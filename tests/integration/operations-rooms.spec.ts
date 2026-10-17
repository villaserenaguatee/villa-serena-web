import { test, expect, viewports, login, expectNoOverflow } from './operations-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('Recepción: cambios STOMP de habitación y reporte con límite de foto y upload', async ({ page, context, baseURL, mock, realtime }, testInfo) => {
      await login(context, baseURL!, 'recepcion'); await page.goto('/recepcion/habitaciones');
      await realtime.subscribed('/topic/habitaciones');
      const card = page.locator('[data-room="204"]');
      await expect(card).toBeVisible();
      await mock.configure({ roomCondition: 'EN_LIMPIEZA' });
      realtime.emit('/topic/habitaciones', { tipo: 'HABITACION', datos: (await mock.state()).room });
      await expect(card.getByText('En limpieza', { exact: false })).toBeVisible();
      await mock.configure({ roomCondition: 'LIMPIA' });
      realtime.emit('/topic/habitaciones', { tipo: 'HABITACION', datos: (await mock.state()).room });
      await expect(card.getByText('Limpia', { exact: false })).toBeVisible();
      await card.getByRole('button', { name: 'Reportar daño', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Reportar daño', exact: true });
      await dialog.getByLabel('Descripción', { exact: true }).fill('Ventana de prueba');
      const before = await mock.state();
      await dialog.locator('input[type=file]').setInputFiles({ name: 'grande.png', mimeType: 'image/png', buffer: Buffer.alloc(6 * 1024 * 1024) });
      await expect(dialog.getByText('La foto debe pesar como máximo 5 MB.', { exact: true })).toBeVisible();
      await expect(dialog.getByRole('button', { name: 'Reportar daño', exact: true })).toBeDisabled();
      expect((await mock.state()).uploads).toBe(before.uploads); expect((await mock.state()).reports).toBe(before.reports);
      await dialog.locator('input[type=file]').setInputFiles({ name: 'prueba.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jF4kAAAAASUVORK5CYII=', 'base64') });
      await dialog.getByRole('button', { name: 'Reportar daño', exact: true }).click();
      await expect(dialog).toBeHidden();
      const after = await mock.state(); expect(after.uploads).toBe(before.uploads + 1); expect(after.reports).toBe(before.reports + 1);
      expect(after.incidents.find(item => item.id === 2)).toMatchObject({ descripcion: 'Ventana de prueba', estado: 'REPORTADA', tecnicoACargo: null });
      const report = after.calls.find(call => call.method === 'POST' && call.path === '/api/v1/incidencias');
      expect(report?.body).toMatchObject({ habitacionId: 4, descripcion: 'Ventana de prueba', fotoClave: 'incidencias/prueba.png' });
      await expectNoOverflow(page); await page.screenshot({ path: testInfo.outputPath('reported-room.png'), fullPage: true });
    });
  });
}
