import { test, expect, login, calendarRegion, viewports } from './reception-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('la sección sigue la URL al recargar y volver explícitamente al día', async ({ page }) => {
      await login(page);
      await page.getByRole('button', { name: viewport.width >= 1024 ? 'Huéspedes' : 'Huésped.', exact: true }).click();
      await expect(page).toHaveURL(/\/recepcion\/huespedes$/);
      await expect(page.getByRole('heading', { name: 'Huéspedes', exact: true })).toBeVisible();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Huéspedes', exact: true })).toBeVisible();
      await page.goto('/recepcion');
      await expect(calendarRegion(page).getByRole('heading', { name: 'Calendario de reservas', exact: true })).toBeVisible();
    });
  });
}
