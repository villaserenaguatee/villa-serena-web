import {test,expect} from '@playwright/test';
import {expectNoOverflow} from './public-fixtures';
for(const width of [1440,390,320]){
 test.describe(`Indicadores ${width}px`,()=>{
  test.use({viewport:{width,height:900}});
  test('official metrics, date validation and connection errors keep the real report layout',async({page,context,baseURL},testInfo)=>{
   const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let requests=0,fail=false;
   await page.route('**/api/admin/**',route=>{
    const url=new URL(route.request().url());
    if(url.pathname==='/api/admin/indicadores'){
     requests++;return route.fulfill({status:fail?503:200,json:fail?{mensaje:'Indicadores no disponibles'}:{inicio:'2026-10-01',fin:'2026-10-31',ocupacionHoy:{fecha:'2026-10-22',habitacionesOcupadas:2,habitacionesActivas:8,porcentaje:25},ingresos:1200,reservasPorCanal:[{canal:'DIRECTO_WEB',cantidad:3},{canal:'RECEPCION',cantidad:2},{canal:'BOOKING',cantidad:1}]}});
    }
    if(url.pathname==='/api/admin/reportes')return route.fulfill({json:{desde:'2026-10-01',hasta:'2026-10-31',reservas:[],pagos:[],ocupacionActual:[]}});
    throw Error('Unexpected admin request '+url.pathname);
   });
   const response=await context.request.post('/api/auth/login',{headers:{Origin:baseURL!},data:{correo:'admin@villaserena.gt',contrasena:'VillaSerena26'}});expect(response.status()).toBe(200);
   await page.goto('/admin/reportes');const panel=page.getByRole('region',{name:'Indicadores principales'});await expect(panel.getByText('25.00 %')).toBeVisible();
   await expectNoOverflow(page);await page.screenshot({path:testInfo.outputPath('indicadores.png'),fullPage:true});
   await page.getByLabel('Desde',{exact:true}).fill('2026-10-20');await page.getByLabel('Hasta',{exact:true}).fill('2026-10-10');const before=requests;
   await page.getByRole('button',{name:'Consultar',exact:true}).click();await expect(page.getByRole('alert').filter({hasText:'fecha final'})).toBeVisible();expect(requests).toBe(before);
   await page.getByLabel('Hasta',{exact:true}).fill('2026-10-25');await page.getByRole('button',{name:'Consultar',exact:true}).click();await expect(panel).toBeVisible();
   fail=true;await page.reload();await expect(page.getByRole('alert').filter({hasText:'Indicadores no disponibles'})).toBeVisible();await expect(panel).toHaveCount(0);
   await expectNoOverflow(page);expect(errors).toEqual([]);
  });
 });
}
