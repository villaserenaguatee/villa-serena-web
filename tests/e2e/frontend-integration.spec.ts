import {test,expect} from '@playwright/test';
import {expectNoOverflow} from './public-fixtures';
for(const width of [1440,390,320])test.describe('Integrated navigation '+width,()=>{test.use({viewport:{width,height:900}});test('administrative routes coexist without removing Personnel, Inventory or maintenance',async({page,context,baseURL})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/admin/**',route=>{const path=new URL(route.request().url()).pathname;if(path==='/api/admin/empleados'||path==='/api/admin/catalogos/personal')return route.fulfill({json:[]});if(path==='/api/admin/wifi')return route.fulfill({json:{nombreRed:'Red local',contrasena:'fixture-only'}});if(path==='/api/admin/hotel')return route.fulfill({status:404,json:{codigo:'HOTEL_NO_CONFIGURADO',mensaje:'Hotel no configurado en esta prueba'}});return route.fulfill({json:[]});});
 await page.route('**/api/gestion/**',route=>route.fulfill({json:[]}));
 await page.route('**/api/incidencias**',route=>route.fulfill({json:[]}));
 expect((await context.request.post('/api/auth/login',{headers:{Origin:baseURL!},data:{correo:'admin@example.invalid',contrasena:'fixture-only'}})).status()).toBe(200);
 await page.goto('/admin/menu');await expect(page.getByRole('button',{name:'Nuevo producto',exact:true})).toBeVisible();
 await page.goto('/admin/hotel');await expect(page.getByText('Hotel no configurado en esta prueba')).toBeVisible();
 await page.goto('/admin/amenidades');await expect(page.getByRole('button',{name:'Nueva amenidad',exact:true})).toBeVisible();
 await page.goto('/admin/personal');await page.getByRole('button',{name:'Turnos',exact:true}).click();await expect(page.getByRole('heading',{name:'Turnos',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Nuevo turno',exact:true})).toBeVisible();
 await page.goto('/admin/inventario');await page.getByRole('button',{name:'Productos',exact:true}).click();await expect(page.getByRole('checkbox',{name:'Solo stock bajo'})).toBeVisible();await expect(page.getByRole('button',{name:'Actualizar inventario',exact:true})).toBeVisible();
 await page.goto('/admin/mantenimiento');await expect(page.getByRole('heading',{name:/mantenimiento/i})).toBeVisible();await expectNoOverflow(page);expect(errors).toEqual([]);
});});
