import { test, expect, viewports, login } from './reception-fixtures';
import type { ReservationDetail } from '@/lib/bff/contracts/reception';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('habitación → reserva completa, misma URL, otra estancia, recarga y habitación sin reserva', async ({ page, context }) => {
      await login(page); await page.goto('/recepcion/habitaciones');
      await page.locator('[data-room="101"] img').click();
      const room = page.getByRole('dialog', { name: 'Detalle de habitación 101', exact: true });
      await expect(room.getByText('VS-TEST01 · En estadía', { exact: true })).toBeVisible();
      const expected: ReservationDetail = await (await context.request.get('/api/reservas/VS-TEST01')).json();
      expect(expected.habitacion?.numero).toBe('101'); await expect(room).toContainText(expected.huesped.nombreCompleto);
      await room.getByRole('link', { name: 'Ver reserva completa', exact: true }).click();
      const detail = page.getByRole('dialog', { name: 'Detalle de reserva', exact: true });
      await expect(detail.getByRole('heading', { name: 'VS-TEST01', exact: true })).toBeVisible();
      await expect(detail.getByRole('heading', { name: expected.huesped.nombreCompleto, exact: true })).toBeVisible();
      await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(0);
      await expect(page).toHaveURL(/\/recepcion\/reservas\/VS-TEST01$/);
      await page.reload(); await expect(detail.getByRole('heading', { name: 'VS-TEST01', exact: true })).toBeVisible();
      const roomsMenu = () => page.getByRole('button', { name: viewport.width < 1024 ? /^Habs\./ : /^Habitaciones/ }).first();
      for (const [number, code] of [['101', 'VS-TEST01'], ['105', 'VS-TEST03']]) {
        await detail.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
        await roomsMenu().click(); await page.getByRole('button', { name: `Abrir detalle de habitación ${number}`, exact: true }).click();
        await page.getByRole('dialog', { name: `Detalle de habitación ${number}`, exact: true }).getByRole('link', { name: 'Ver reserva completa' }).click();
        await expect(detail.getByRole('heading', { name: code, exact: true })).toBeVisible();
        if (code !== 'VS-TEST01') { await expect(detail).toContainText('Deluxe · Habitación 105'); await expect(detail.getByRole('heading', { name: 'VS-TEST01', exact: true })).toHaveCount(0); }
      }
      await page.goto('/recepcion/habitaciones');
      await page.getByRole('button', { name: 'Abrir detalle de habitación 103', exact: true }).click();
      const empty = page.getByRole('dialog', { name: 'Detalle de habitación 103', exact: true });
      await expect(empty).toContainText('No hay reservas activas asignadas a esta habitación.');
      await expect(empty.getByRole('link', { name: 'Ver reserva completa' })).toHaveCount(0);
      await empty.getByRole('button', { name: 'Cerrar detalle de habitación' }).click();
      const card = page.locator('[data-room="103"]'); await card.getByRole('button', { name: 'Marcar sucia', exact: true }).click();
      await expect(card).toContainText('Sucia'); await expect(page.getByRole('dialog')).toHaveCount(0);
      await page.getByLabel('Condición', { exact: true }).selectOption('SUCIA');
      await expect(card).toBeVisible(); await expect(page.locator('[data-room="101"]')).toHaveCount(0);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
    });
  });
}
