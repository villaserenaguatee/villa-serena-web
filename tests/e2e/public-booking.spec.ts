import type { Page } from '@playwright/test';
import { test, expect, viewports, hotelDate, fillGuest, reviewGuest, expectNoOverflow } from './public-fixtures';

async function chooseDate(page: Page, index: number, value: string) {
  await page.locator('.availability-modal .vs-date-trigger').nth(index).click();
  const target = new Date(`${value}T12:00:00`);
  const month = target.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).toLowerCase();
  const dialog = page.getByRole('dialog', { name: 'Calendario', exact: true });
  for (let i = 0; i < 13 && (await dialog.locator('.vs-calendar-head strong').innerText()).toLowerCase() !== month; i++) {
    await dialog.getByRole('button', { name: 'Mes siguiente', exact: true }).click();
  }
  await expect(dialog.locator('.vs-calendar-head strong')).toHaveText(new RegExp(month, 'i'));
  await dialog.locator('.vs-days').getByRole('button', { name: String(target.getDate()), exact: true }).click();
}

async function expectPending(page: Page) {
  await expect(page.getByRole('heading', { name: 'Pago en proceso', exact: true })).toBeVisible();
  await expect(page.getByText('Pendiente de pago', { exact: true })).toBeVisible();
  await expect(page.getByText('Pendiente', { exact: true })).toBeVisible();
  const code = new URL(page.url()).searchParams.get('codigo')!;
  expect(code).toMatch(/^VS-[A-Z0-9]{6}$/);
  const response = await page.request.get(`/api/publico/reservas/${code}/estado`);
  expect(response.status()).toBe(200);
  expect(response.headers()['x-villa-serena-mode']).toBe('demo');
  expect(await response.json()).toMatchObject({ codigo: code, estadoReserva: 'PENDIENTE_PAGO', estadoPago: 'PENDIENTE' });
  return code;
}

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('catálogo y resultados: validación, tarjeta y contrato de pago pendiente', async ({ page }, testInfo) => {
      const calls: { path: string; method: string; body: string | null }[] = [];
      page.on('request', request => {
        const path = new URL(request.url()).pathname;
        if (path.startsWith('/api/')) calls.push({ path, method: request.method(), body: request.postData() });
      });
      const searches = () => calls.filter(call => /disponibilidad|availability/.test(call.path)).length;
      const posts = () => calls.filter(call => call.method === 'POST' && call.path.startsWith('/api/publico/reservas'));
      await page.goto('/');
      await page.locator('.availability-search').click();
      await expect(page.getByRole('alert').filter({ hasText: 'Selecciona fechas válidas' })).toBeVisible();
      expect(searches()).toBe(0);
      await expectNoOverflow(page);
      await page.locator('a[href="/catalogo"]').first().click();
      await expect(page.locator('.catalog-grid > article')).toHaveCount(15);
      await expectNoOverflow(page);
      await page.locator('.catalog-grid a.catalog-image-link').first().click();
      await page.getByRole('button', { name: 'Consultar disponibilidad', exact: true }).click();
      await chooseDate(page, 0, hotelDate(45));
      await chooseDate(page, 1, hotelDate(47));
      await page.getByRole('button', { name: 'Comprobar disponibilidad', exact: true }).click();
      await page.getByRole('link', { name: 'Reservar habitación', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Introduce tus datos', exact: true })).toBeVisible();
      await fillGuest(page, 'public-issue48@example.test', '   ');
      await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'Completa todos' })).toBeVisible();
      expect(posts()).toHaveLength(0);
      await page.getByLabel('Nombre', { exact: true }).fill('Huésped');
      await reviewGuest(page);
      expect(page.url()).not.toMatch(/public-issue48|documento/);
      await expect(page.locator('input[type="radio"]')).toHaveCount(0);
      await expect(page.getByText('Pagar en el hotel', { exact: false })).toHaveCount(0);
      await expect(page.getByText('Transferencia / depósito bancario')).toHaveCount(0);
      await expect(page.locator('input[placeholder="0000 0000 0000 0000"]')).toHaveCount(0);
      await page.locator('.terms-check input').check();
      await expectNoOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('pago.png'), fullPage: true });
      await page.getByRole('button', { name: 'Continuar pago →', exact: true }).click();
      const code = await expectPending(page);
      await expect(page.locator('main')).not.toContainText(/PAGO DE PRUEBA|¡Reserva confirmada!/);
      await expectNoOverflow(page);
      expect(posts()).toHaveLength(2);
      const creation = JSON.parse(posts()[0].body!);
      expect(Object.keys(creation).sort()).toEqual(['entrada', 'huesped', 'numeroHuespedes', 'salida', 'tipoHabitacionId']);
      expect(creation.numeroHuespedes).toBe(2);
      await page.reload(); await expectPending(page);
      await page.getByRole('button', { name: 'Consultar estado', exact: true }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Estado actualizado.' })).toBeVisible();
      await expectPending(page);
      expect(posts()).toHaveLength(2);
      expect(calls.some(call => call.path.endsWith('/hotel'))).toBe(true);
      expect(calls.some(call => call.path.endsWith('/tipos-habitacion'))).toBe(true);
      expect(calls.filter(call => call.path.endsWith(`/${code}/estado`)).length).toBeGreaterThanOrEqual(3);
      const routePattern = `**/api/publico/reservas/${code}/estado`;
      await page.route(routePattern, route => route.fulfill({ status: 503, json: { codigo: 'SERVICIO_NO_DISPONIBLE', mensaje: 'Consulta de prueba interrumpida.', detalles: [] } }));
      await page.goto(`/reserva/resultado?codigo=${code}&paid=true&estado=CONFIRMADA`);
      await expect(page.getByRole('heading', { name: 'Estado no disponible', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Tu reserva está confirmada', exact: true })).toHaveCount(0);
      await page.unroute(routePattern);
      await page.getByRole('button', { name: 'Consultar estado', exact: true }).click();
      await expectPending(page);
      expect(posts()).toHaveLength(2);
      await page.goto(`/reservar/habitaciones?llegada=${hotelDate(45)}&salida=${hotelDate(45)}&adultos=0&ninos=-1`);
      const before = searches();
      await expect(page.getByRole('alert').filter({ hasText: 'La salida debe ser posterior' })).toBeVisible();
      await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
      expect(searches()).toBe(before);
      await page.goto(`/reservar/habitaciones?llegada=${hotelDate(45)}&salida=${hotelDate(47)}&adultos=6&ninos=0`);
      await expect(page.getByRole('alert').filter({ hasText: 'supera la capacidad' })).toBeVisible();
      expect(searches()).toBe(before);
      await page.goto(`/reservar/habitaciones?llegada=${hotelDate(55)}&salida=${hotelDate(57)}&adultos=1&ninos=1`);
      await expect(page.locator('.reserve-room-grid article').first()).toBeVisible();
      await expectNoOverflow(page);
      await page.locator('.reserve-room-grid .reserve-view-room').first().click();
      await page.getByRole('button', { name: 'Reservar habitación', exact: true }).click();
      await fillGuest(page, 'card-issue48@example.test', 'Tarjeta');
      await reviewGuest(page);
      await page.locator('.terms-check input').check();
      await page.getByRole('button', { name: 'Continuar pago →', exact: true }).click();
      const secondCode = await expectPending(page);
      expect(secondCode).not.toBe(code);
      expect(posts()).toHaveLength(4);
      expect(calls.filter(call => call.method === 'POST' && call.path === '/api/public/bookings')).toHaveLength(0);
    });

    test('enlace antiguo sin borrador bloqueado y recorrido válido hasta pago', async ({ page }, testInfo) => {
      const oldQuery = new URLSearchParams({ habitacion: 'Habitación Estándar', tipoHabitacionId: '1', llegada: hotelDate(12), salida: hotelDate(14), adultos: '2', ninos: '0' });
      await page.goto(`/reservar/pago?${oldQuery}`);
      await expect(page.getByRole('alert').filter({ hasText: 'Tus datos no están disponibles' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continuar pago →', exact: true })).toBeDisabled();
      await page.goto(`/reservar/datos?${oldQuery}`);
      await expect(page.locator('main')).toContainText(/Introduce tus datos|La habitación no está disponible|No se pudo consultar/);
      await page.goto(`/reservar/habitaciones?llegada=${hotelDate(32)}&salida=${hotelDate(34)}&adultos=2&ninos=0&huespedes=2`);
      await page.locator('a[href^="/habitaciones/"]').first().click();
      await page.getByRole('button', { name: 'Reservar habitación', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Introduce tus datos', exact: true })).toBeVisible();
      const dataURL = page.url();
      await fillGuest(page);
      await reviewGuest(page);
      const button = page.getByRole('button', { name: 'Continuar pago →', exact: true });
      await expect(button).toBeDisabled();
      await page.locator('.terms-check input').check();
      await expect(button).toBeEnabled();
      await expect(page.locator('.summary-total')).toHaveCount(1);
      await expectNoOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('pago.png'), fullPage: true });
      await testInfo.attach('recorrido', { body: JSON.stringify({ datos: dataURL, pago: page.url() }, null, 2), contentType: 'application/json' });
    });
  });
}
