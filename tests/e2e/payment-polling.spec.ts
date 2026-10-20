import { test, expect } from './public-fixtures';

test('sondeo cada tres segundos: termina al minuto, conserva pendiente y permite consulta manual', async ({ page }) => {
  await page.clock.install();
  await page.clock.pauseAt(new Date());
  let queries = 0;
  await page.route('**/api/publico/reservas/VS-DEMO02/estado', async route => {
    queries++;
    await route.fulfill({ headers: { 'X-Villa-Serena-Mode': 'demo' }, json: { codigo: 'VS-DEMO02', estadoReserva: 'PENDIENTE_PAGO', estadoPago: 'PENDIENTE', puedeReintentar: true } });
  });
  await page.goto('/reserva/resultado?codigo=VS-DEMO02&success=true&estadoPago=APROBADO');
  await expect(page.getByRole('heading', { name: 'Pago en proceso', exact: true })).toBeVisible();
  expect(queries).toBe(1);
  await page.clock.runFor(2_999); expect(queries).toBe(1);
  const secondResponse = page.waitForResponse('**/api/publico/reservas/VS-DEMO02/estado');
  await page.clock.runFor(1); await (await secondResponse).finished();
  await page.clock.runFor(0);
  await expect.poll(() => queries).toBe(2);
  await expect(page.getByRole('button', { name: 'Consultar estado', exact: true })).toBeEnabled();
  const finalResponse = page.waitForResponse('**/api/publico/reservas/VS-DEMO02/estado');
  await page.clock.fastForward(61_000); await (await finalResponse).finished();
  await page.clock.runFor(0);
  await expect.poll(() => queries).toBe(3);
  await expect(page.getByRole('button', { name: 'Consultar estado', exact: true })).toBeEnabled();
  await page.clock.runFor(30_000); expect(queries).toBe(3);
  await expect(page.getByRole('heading', { name: 'Pago en proceso', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Consultar estado', exact: true }).click();
  await expect.poll(() => queries).toBe(4);
  await expect(page.getByRole('status').filter({ hasText: 'Estado actualizado.' })).toBeVisible();
});
