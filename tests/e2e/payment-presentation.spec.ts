import { test, expect, viewports, hotelDate, expectNoOverflow } from './public-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('términos, presentación y recuperación de pago sin duplicar reserva', async ({ page }, testInfo) => {
      await page.goto('/');
      const draft = await page.evaluate(({ entrada, salida }) => {
        const id = crypto.randomUUID();
        const params = new URLSearchParams({ habitacion: 'Habitación Estándar', tipoHabitacionId: '1', llegada: entrada, salida, adultos: '2', ninos: '0', nombre: 'Prueba', apellidos: 'Pago', correo: 'issue48@example.test', telefono: '55555555', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', documento: '1234567890123' });
        sessionStorage.setItem('vs-public-booking-draft', JSON.stringify({ id, createdAt: Date.now(), params: params.toString() }));
        return id;
      }, { entrada: hotelDate(14), salida: hotelDate(16) });
      await page.goto(`/reservar/pago?draft=${draft}`);
      await expect(page.locator('.booking-summary-card img')).toBeVisible();
      const button = page.getByRole('button', { name: 'Continuar pago →', exact: true });
      await expect(button).toBeDisabled();
      await expect(page.locator('.summary-total')).toHaveCount(1);
      const summary = await page.locator('.booking-summary-card').boundingBox();
      const form = await page.locator('.checkout-form').boundingBox();
      expect(summary).not.toBeNull(); expect(form).not.toBeNull();
      if (viewport.width > 800) {
        expect(Math.abs(summary!.y - form!.y)).toBeLessThan(2);
        expect(Math.abs(form!.width - summary!.width * 2)).toBeLessThan(2);
      } else expect(form!.y).toBeGreaterThanOrEqual(summary!.y + summary!.height);
      await expect(page.locator('input')).toHaveCount(1);
      await expect(page.locator('.online-payment-head')).toHaveCount(0);
      await expect(page.locator('.checkout-form')).not.toContainText(/simulación|conexión.*pendiente/i);
      for (const [link, title] of [['condiciones de reserva y cancelación', 'Condiciones de reserva y cancelación'], ['política de privacidad', 'Política de privacidad']]) {
        await page.getByRole('button', { name: link, exact: true }).click();
        await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
        await page.locator('.legal-modal').getByRole('button', { name: 'Cerrar', exact: true }).click();
      }
      await page.locator('.terms-check input').check();
      await expect(button).toBeEnabled();
      expect(await button.evaluate(el => Math.round(el.getBoundingClientRect().width))).toBe(await page.locator('.checkout-form').evaluate(el => Math.round(el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight))));
      await expectNoOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('pago.png'), fullPage: true });
      const creates: string[] = [];
      page.on('request', request => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/publico/reservas') creates.push(request.url()); });
      await page.route('**/api/publico/reservas/*/pago', route => route.fulfill({ status: 503, json: { mensaje: 'Prueba: pago temporalmente no disponible.' } }));
      await button.click();
      await expect(page.getByRole('alert').filter({ hasText: 'temporalmente' })).toBeVisible();
      const savedCode: string = await page.evaluate(() => JSON.parse(sessionStorage.getItem('vs-public-booking-draft')!).attempt.code);
      expect(savedCode).toMatch(/^VS-[A-Z0-9]{6}$/);
      await page.reload();
      const recover = page.getByRole('button', { name: 'Recuperar intento anterior', exact: true });
      await expect(recover).toBeDisabled();
      await page.locator('.terms-check input').check();
      await page.unroute('**/api/publico/reservas/*/pago');
      await recover.click();
      await expect(page.getByRole('heading', { name: 'Pago en proceso', exact: true })).toBeVisible();
      await expect(page).toHaveURL(url => url.searchParams.get('codigo') === savedCode);
      const response = await page.request.get(`/api/publico/reservas/${savedCode}/estado`);
      expect(response.status()).toBe(200);
      expect(await response.json()).toMatchObject({ estadoReserva: 'PENDIENTE_PAGO', estadoPago: 'PENDIENTE' });
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Pago en proceso', exact: true })).toBeVisible();
      expect(creates).toHaveLength(1);
    });
  });
}
