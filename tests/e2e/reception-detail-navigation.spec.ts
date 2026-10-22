import { test, expect, viewports, login, prepareCreation, confirmCreation } from './reception-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('new reservation detail survives delayed navigation and closes normally', async ({ page }) => {
      await login(page);
      const form = await prepareCreation(page, { assigned: true });
      const reservation = await confirmCreation(page, form);
      let release!: () => void;
      const gate = new Promise<void>(resolve => { release = resolve; });
      let arrived!: () => void;
      const navigation = new Promise<void>(resolve => { arrived = resolve; });
      await page.route('**/recepcion/reservas/**', async route => {
        if (route.request().headers().rsc === '1') {
          arrived();
          await gate;
        }
        await route.continue();
      });
      const dialog = page.getByRole('dialog', { name: 'Detalle de reserva', exact: true });
      try {
        await form.getByRole('button', { name: 'Ver reserva / realizar check-in', exact: true }).click();
        await navigation;
        await expect(page).toHaveURL(/\/recepcion$/);
        release();
        await expect(page).toHaveURL(new RegExp(`/recepcion/reservas/${reservation.codigo}$`));
        await expect(dialog.getByRole('heading', { name: 'Historial de estados' })).toBeVisible();
        await expect(dialog).toContainText(reservation.codigo);
        // Let effects triggered by the committed route settle before closing.
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'Cerrar', exact: true }).click();
        await expect(dialog).toHaveCount(0);
        await expect(page).toHaveURL(/\/recepcion\/reservas$/);
        await expect(page.getByRole('button', { name: 'Buscar', exact: true })).toBeVisible();
      } finally {
        release();
        await page.unroute('**/recepcion/reservas/**');
      }
    });
  });
}
