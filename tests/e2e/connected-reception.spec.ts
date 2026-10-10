import { access } from 'node:fs/promises';
import { test, expect, viewports, hotelDate } from './reception-fixtures';
import type { Page } from '@playwright/test';

const message = 'La conexión real está pendiente. No se usarán datos de prueba en modo conectado.';
const snapshot = (page: Page) => page.evaluate(() => ({ reservations: localStorage.getItem('vs-reservas'), rooms: localStorage.getItem('vs-habitaciones'), guests: localStorage.getItem('vs-huespedes') }));
const boundaryTitle = 'Recepción pendiente de conexión';
const boundaryDescription = 'Faltan los servicios de huéspedes y reservas del API.';

async function login(page: Page) {
  const session = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/yo');
  await page.goto('/panel/login');
  await session;
  await page.getByLabel('Correo electrónico', { exact: true }).fill('recepcion@villaserena.gt');
  await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/\/recepcion$/);
  await expect(page.getByRole('heading', { name: boundaryTitle, exact: true })).toBeVisible();
}

async function expectNoServerDemoData() {
  const path = process.env.ISSUE48_RECEPTION_STATE_PATH;
  expect(path).toBeTruthy();
  await expect(access(path!)).rejects.toMatchObject({ code: 'ENOENT' });
}

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });

    test('Recepción bloquea el módulo completo cuando los servicios del API aún no están conectados', async ({ page }) => {
      await login(page);
      await expect(page.getByText(boundaryDescription, { exact: true })).toBeVisible();
      const before = await snapshot(page);
      await expect(page.getByRole('link', { name: 'Ver habitaciones', exact: true })).toBeVisible();
      await expect(page.getByRole('button')).toHaveCount(0);
      await page.goto('/recepcion/reservas');
      await expect(page.getByRole('heading', { name: boundaryTitle, exact: true })).toBeVisible();
      expect(await snapshot(page)).toEqual(before);
      await expectNoServerDemoData();
      await page.reload();
      await expect(page.getByRole('heading', { name: boundaryTitle, exact: true })).toBeVisible();
      expect(await snapshot(page)).toEqual(before);
    });

    test('búsqueda y detalle tampoco montan datos demo en modo conectado', async ({ page }) => {
      await login(page);
      const before = await snapshot(page);
      for (const path of ['/recepcion/reservas', '/recepcion/reservas/VS-TEST01']) {
        await page.goto(path);
        await expect(page.getByRole('heading', { name: boundaryTitle, exact: true })).toBeVisible();
        await expect(page.getByText(boundaryDescription, { exact: true })).toBeVisible();
      }
      await expect(page.getByRole('button')).toHaveCount(0);
      await expect(page.getByRole('button', { name: /VS-TEST01/ })).toHaveCount(0);
      expect(await snapshot(page)).toEqual(before);
      await expectNoServerDemoData();
    });

    test('consultas y mutaciones del BFF devuelven 503 sin archivos demo ni cambios locales', async ({ page, context, baseURL }) => {
      await login(page);
      const before = await snapshot(page);
      const query = `entrada=${hotelDate(1)}&salida=${hotelDate(3)}`;
      const routes = [
        '/api/reservas', `/api/reservas/calendario?desde=${hotelDate()}&hasta=${hotelDate(3)}`,
        `/api/reservas/disponibilidad?${query}&huespedes=1`, '/api/reservas/VS-TEST01',
        '/api/reservas/VS-TEST01/cancelacion', '/api/habitaciones', `/api/habitaciones/disponibles?tipoHabitacionId=1&${query}`,
      ];
      for (const route of routes) {
        const response = await context.request.get(route);
        expect(response.status(), route).toBe(503);
        expect(await response.json()).toMatchObject({ codigo: 'API_NOT_READY', mensaje: message });
      }
      for (const [method, route, data] of [
        ['POST', '/api/reservas', {}], ['POST', '/api/huespedes', {}],
        ['POST', '/api/reservas/VS-TEST01/cancelar', { motivo: 'Prueba de guard conectado' }],
        ['PUT', '/api/reservas/VS-TEST01/habitacion', { habitacionId: 102 }],
      ] as const) {
        const response = await context.request.fetch(route, { method, headers: { Origin: baseURL! }, data });
        expect(response.status(), `${method} ${route}`).toBe(503);
        expect(await response.json()).toMatchObject({ codigo: 'API_NOT_READY', mensaje: message });
      }
      expect(await snapshot(page)).toEqual(before);
      await expectNoServerDemoData();
    });
  });
}
