import { test, expect, viewports, login, expectNoOverflow } from './operations-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('Room Service: notificación STOMP, conflicto, transición, cancelación, reconexión y menú agotado', async ({ page, context, baseURL, mock, realtime }, testInfo) => {
      await login(context, baseURL!, 'roomservice');
      const issued = page.waitForResponse(response => response.url().endsWith('/api/auth/ws-ticket'));
      await page.goto('/room-service');
      await page.getByRole('button', { name: 'Pedidos', exact: true }).last().click();
      await expect(page.getByText('Ana de prueba', { exact: false }).first()).toBeVisible();
      await realtime.subscribed('/topic/pedidos');
      expect(Object.keys(await (await issued).json()).sort()).toEqual(['expiraEn', 'ticket']);
      realtime.emit('/topic/pedidos', { tipo: 'NUEVO_PEDIDO', datos: (await mock.state()).order });
      await expect(page.getByText('Nuevo pedido de Room Service', { exact: true })).toBeVisible();
      await page.getByRole('button').filter({ hasText: 'Toca para ver el detalle' }).click();
      await expect(page.getByRole('heading', { name: 'Pedido #12', exact: true })).toBeVisible();
      await mock.configure({ conflict: true });
      await page.getByRole('button', { name: 'Marcar en preparación', exact: true }).click();
      await expect(page.getByText('Otro empleado cambió estos datos.', { exact: false })).toBeVisible();
      expect((await mock.state()).order.estado).toBe('NUEVO');
      await page.getByRole('button', { name: 'Marcar en preparación', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Marcar en camino', exact: true })).toBeVisible();
      expect((await mock.state()).order.estado).toBe('EN_PREPARACION');
      await page.getByRole('button', { name: 'Cancelar pedido', exact: true }).click();
      await page.getByPlaceholder('Describe el motivo de la cancelación…').fill('Prueba de cancelación');
      await page.getByRole('button', { name: 'Confirmar cancelación', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Pedido #12', exact: true })).toBeHidden();
      expect((await mock.state()).order).toMatchObject({ estado: 'CANCELADO', motivoCancelacion: 'Prueba de cancelación' });
      await realtime.reconnect(); await realtime.subscribed('/topic/pedidos');
      await page.getByRole('button', { name: name === 'móvil' ? 'Menú' : 'Menú y catálogo', exact: true }).last().click();
      await page.getByRole('button', { name: 'Marcar agotado', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Marcar agotado', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: /Reactivar/ })).toHaveCount(0);
      expect((await mock.state()).menuAvailable).toBe(false);
      expect(realtime.tickets.length).toBeGreaterThan(1);
      await expectNoOverflow(page); await page.screenshot({ path: testInfo.outputPath('room-service.png'), fullPage: true });
    });
  });
}
