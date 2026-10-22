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

for(const width of [1440,390,320]){
 test.describe(`Administración ${width}px`,()=>{
  test.use({viewport:{width,height:900}});
  test('supervisión de solo lectura conserva ruta al recargar y permite consultar/cerrar el detalle',async({page,context,baseURL,mock},testInfo)=>{
   await login(context,baseURL!,'admin');await page.goto('/admin/mantenimiento');
   await expect(page.getByRole('heading',{name:'Supervisión de mantenimiento'})).toBeVisible();
   await page.getByRole('button',{name:width<1024?'Mant.':'Mantenimiento',exact:true}).click();
   await expect(page).toHaveURL(/\/admin\/mantenimiento$/);
   const card=page.getByRole('article').filter({hasText:'Fuga de prueba'});await expect(card).toBeVisible();
   await card.getByRole('button',{name:'Ver detalle'}).click();const dialog=page.getByRole('dialog',{name:'Detalle de incidencia'});
   await expect(dialog.getByRole('heading',{name:'Historial'})).toBeVisible();await expectNoOverflow(page);
   await page.screenshot({path:testInfo.outputPath('supervision.png'),fullPage:true});
   await dialog.getByRole('button',{name:'Cerrar',exact:true}).click();await expect(dialog).toHaveCount(0);
   await page.reload();await expect(page.getByRole('heading',{name:'Supervisión de mantenimiento'})).toBeVisible();
   await page.getByRole('combobox',{name:'Estado',exact:true}).selectOption('RESUELTA');await expect(page.getByText('Sin incidencias',{exact:true})).toBeVisible();
   await expectNoOverflow(page);expect((await mock.state()).calls.filter(call=>call.path.startsWith('/api/v1/incidencias')).every(call=>call.method==='GET')).toBe(true);
  });
 });
}
