import { access } from 'node:fs/promises';
import type { Page } from '@playwright/test';
import { test, expect, viewports, login, calendarRegion, hotelDate } from './reception-fixtures';
import { expectNoOverflow } from './public-fixtures';

const message = 'La conexión real está pendiente. No se usarán datos de prueba en modo conectado.';
const snapshot = (page: Page) => page.evaluate(() => ({ reservations: localStorage.getItem('vs-reservas'), rooms: localStorage.getItem('vs-habitaciones'), guests: localStorage.getItem('vs-huespedes') }));

async function expectNoServerDemoData() {
  const path = process.env.ISSUE48_RECEPTION_STATE_PATH;
  expect(path).toBeTruthy();
  await expect(access(path!)).rejects.toMatchObject({ code: 'ENOENT' });
}

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });

    test('calendario muestra el fallo de conexión y conserva datos locales sin confirmar creación', async ({ page }, testInfo) => {
      await login(page);
      const calendar = calendarRegion(page);
      await expect(calendar.getByRole('alert')).toContainText(message);
      await expect(calendar.getByRole('alert')).toContainText('Se conservan las reservas locales.');
      const before = await snapshot(page);
      for (const view of ['Mes', 'Habitaciones']) {
        await calendar.getByRole('button', { name: view, exact: true }).click();
        await expect(calendar.getByRole('alert')).toContainText(message);
        expect(await snapshot(page)).toEqual(before);
      }
      await calendar.getByRole('button', { name: '+ Nueva reserva', exact: true }).click();
      const modal = page.getByRole('dialog', { name: 'Nueva reserva', exact: true });
      await expect(modal.getByRole('alert').filter({ hasText: message })).toBeVisible();
      await modal.getByPlaceholder('Buscar por nombre…').fill('Ana');
      await modal.getByRole('button', { name: /^Ana Morales/ }).click();
      await modal.getByRole('button', { name: 'Revisar datos', exact: true }).click();
      await expect(modal.getByRole('button', { name: 'Confirmar reserva', exact: true })).toHaveCount(0);
      await expect(modal.getByRole('heading', { name: 'Reserva confirmada', exact: true })).toHaveCount(0);
      expect(await snapshot(page)).toEqual(before);
      await expectNoServerDemoData(); await expectNoOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('connected-calendar-error.png'), fullPage: true });
      await page.reload();
      await expect(calendarRegion(page).getByRole('alert')).toContainText(message);
      expect(await snapshot(page)).toEqual(before);
    });

    test('búsqueda y detalle no inventan resultados ni ofrecen acciones con el BFF bloqueado', async ({ page }, testInfo) => {
      await login(page);
      await expect(calendarRegion(page).getByRole('alert')).toContainText(message);
      const before = await snapshot(page);
      await page.goto('/recepcion/reservas');
      await expect(page.getByRole('heading', { name: 'Reservas', exact: true })).toBeVisible();
      await expect(page.getByRole('alert').filter({ hasText: message })).toBeVisible();
      await expect(page.getByRole('button', { name: /VS-TEST01/ })).toHaveCount(0);
      await expect(page.getByText('No hay reservas que coincidan con la búsqueda.', { exact: true })).toHaveCount(0);
      await page.goto('/recepcion/reservas/VS-TEST01');
      const detail = page.getByRole('dialog', { name: 'Detalle de reserva', exact: true });
      await expect(detail.getByRole('alert')).toHaveText(message);
      for (const name of ['Cancelar reserva', 'Asignar habitación', 'Ir a check-in', 'Ver cuenta']) await expect(detail.getByRole('button', { name, exact: true })).toHaveCount(0);
      const retry = page.waitForResponse(response => new URL(response.url()).pathname === '/api/reservas/VS-TEST01');
      await detail.getByRole('button', { name: 'Consultar estado otra vez', exact: true }).click();
      expect((await retry).status()).toBe(503);
      await expect(detail.getByRole('alert')).toHaveText(message);
      expect(await snapshot(page)).toEqual(before);
      await expectNoServerDemoData();
      await page.screenshot({ path: testInfo.outputPath('connected-detail-error.png'), fullPage: true });
    });

    test('consultas y mutaciones del BFF devuelven 503 sin archivos demo ni cambios locales', async ({ page, context, baseURL }) => {
      await login(page);
      await expect(calendarRegion(page).getByRole('alert')).toContainText(message);
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
