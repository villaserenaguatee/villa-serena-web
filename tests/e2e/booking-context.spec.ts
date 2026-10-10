import { randomUUID } from 'node:crypto';
import { test, expect, viewports, hotelDate, enterSelectedPortal, fillGuest, reviewGuest, expectNoOverflow } from './public-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('contexto HttpOnly: resumen autorizado, total original y portal de la reserva elegida', async ({ page, context, browser, baseURL }, testInfo) => {
      const email = 'ana.morales@correo.com';
      const response = await context.request.post('/api/publico/reservas', {
        headers: { Origin: baseURL!, 'Idempotency-Key': randomUUID() },
        data: { tipoHabitacionId: 1, entrada: hotelDate(60), salida: hotelDate(62), numeroHuespedes: 2, huesped: { nombreCompleto: 'Ana Morales', correo: email, telefono: '55555555', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', numeroDocumento: '1234567890101' } },
      });
      expect(response.status()).toBe(201);
      const created = await response.json() as { codigo: string; total: number };
      expect((await context.cookies()).find(cookie => cookie.name === 'vs_booking_context')?.httpOnly).toBe(true);
      expect((await context.request.get('/api/reserva-contexto?codigo=VS-DEMO01')).status()).toBe(401);
      const outsider = await browser.newContext();
      try { expect((await outsider.request.get(`${baseURL}/api/reserva-contexto?codigo=${created.codigo}`)).status()).toBe(401); }
      finally { await outsider.close(); }
      await page.goto(`/reserva/detalle?codigo=${created.codigo}`);
      await expect(page.getByRole('heading', { name: 'Gestiona tu estancia', exact: true })).toBeVisible();
      await expect(page.getByLabel('Correo de la reserva', { exact: true })).toHaveCount(0);
      await expect(page.locator('.guest-reservation-payment')).toContainText(String(created.total));
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Gestiona tu estancia', exact: true })).toBeVisible();
      await page.screenshot({ path: testInfo.outputPath('resumen.png'), fullPage: true });
      await enterSelectedPortal(page, created.codigo, email);
      await page.goto(`/reserva/detalle?codigo=${created.codigo}`);
      await page.getByRole('link', { name: 'Acceder al portal del huésped', exact: true }).click();
      await expect(page).toHaveURL(url => url.pathname === '/portal' && url.searchParams.get('codigo') === created.codigo);
      await expect(page.getByLabel('Correo de la reserva', { exact: true })).toHaveCount(0);
    });

    test('disponibilidad → datos → pago pendiente → OTP → portal y recarga sin otra estancia', async ({ page }, testInfo) => {
      await page.goto(`/reservar/habitaciones?llegada=${hotelDate(60)}&salida=${hotelDate(62)}&adultos=2&ninos=0&huespedes=2`);
      await page.getByRole('link', { name: 'Ver habitación', exact: true }).first().click();
      await page.getByRole('button', { name: 'Reservar habitación', exact: true }).click();
      await fillGuest(page, 'ana.morales@correo.com', 'Ana');
      await reviewGuest(page);
      await page.locator('.terms-check input').check();
      await page.getByRole('button', { name: 'Continuar pago →', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Pago en proceso', exact: true })).toBeVisible();
      const code = new URL(page.url()).searchParams.get('codigo')!;
      expect(code).toMatch(/^VS-[A-Z0-9]{6}$/);
      await page.goto(`/reserva/detalle?codigo=${code}`);
      await expect(page.getByRole('heading', { name: 'Gestiona tu estancia', exact: true })).toBeVisible();
      await expect(page.getByLabel('Correo de la reserva', { exact: true })).toHaveCount(0);
      await enterSelectedPortal(page, code, 'ana.morales@correo.com');
      await page.reload();
      await expect(page.getByText('Habitación pendiente de asignación.', { exact: false })).toBeVisible();
      await expect(page.locator('body')).toContainText(code);
      await expect(page.locator('body')).not.toContainText('VS-2026-01042');
      await expectNoOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('portal.png'), fullPage: true });
    });
  });
}
