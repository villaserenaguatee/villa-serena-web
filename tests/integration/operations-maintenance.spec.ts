import { test, expect, viewports, login, expectNoOverflow } from './operations-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('Mantenimiento: tomar incidencia, ocultar resolución de otro técnico y guardar solución propia', async ({ page, context, baseURL, mock }, testInfo) => {
      await login(context, baseURL!, 'mantenimiento'); await page.goto('/mantenimiento/incidencias');
      const card = page.getByRole('article').filter({ hasText: 'Fuga de prueba' });
      await card.getByRole('button', { name: 'Tomar', exact: true }).click();
      await expect(card.getByRole('button', { name: 'Resolver', exact: true })).toBeVisible();
      expect((await mock.state()).incidents[0]).toMatchObject({ estado: 'EN_PROCESO', tecnicoACargo: { id: 5 } });
      await mock.configure({ technicianId: 99 }); await page.reload();
      await expect(card.getByText('Técnico: Otro técnico', { exact: true })).toBeVisible();
      await expect(card.getByRole('button', { name: 'Resolver', exact: true })).toHaveCount(0);
      expect((await mock.state()).calls.filter(call => call.path.endsWith('/resolver'))).toHaveLength(0);
      await mock.configure({ technicianId: 5 });
      await page.getByRole('button', { name: 'Actualizar', exact: true }).click();
      await card.getByRole('button', { name: 'Resolver', exact: true }).click();
      await page.getByLabel('Solución', { exact: true }).fill('Daño reparado en prueba');
      await page.getByRole('button', { name: 'Guardar solución', exact: true }).click();
      await expect(card).toHaveCount(0);
      const state = await mock.state(); expect(state.incidents[0].estado).toBe('RESUELTA');
      expect(state.calls.find(call => call.path.endsWith('/resolver'))?.body).toEqual({ solucion: 'Daño reparado en prueba' });
      await expectNoOverflow(page); await page.screenshot({ path: testInfo.outputPath('maintenance.png'), fullPage: true });
    });
  });
}
