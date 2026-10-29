import {test,expect} from '@playwright/test';
import {expectNoOverflow} from './public-fixtures';
for(const width of [1440,390,320])test.describe('Official catalogs '+width,()=>{
 test.use({viewport:{width,height:900}});
 test('menu, season and hotel forms remain accessible and handle real contract errors',async({page,context,baseURL},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let writes=0,allowHotelSave=false,hotelName='Hotel existente';const hotelWrites:Record<string,unknown>[]=[];
 await page.route('**/api/admin/**',async route=>{
 const p=new URL(route.request().url()).pathname,m=route.request().method();
 const data:Record<string,unknown>={
 '/api/admin/menu/categorias':[{id:3,nombre:'Bebidas'}],
 '/api/admin/menu/items':[{id:7,nombre:'Café',descripcion:'Café del hotel',categoriaId:3,precio:25,fotoClave:null,disponibilidad:'AGOTADO',estado:'ACTIVO'}],
 '/api/admin/temporadas':[{id:4,nombre:'Temporada existente',inicio:'2026-12-01',fin:'2026-12-15',ajustePct:20,tipoHabitacionIds:[9]}],
 '/api/admin/catalogos/habitaciones':[],
 '/api/admin/catalogos/tipos':[{id:9,version:0,nombre:'Categoría existente',descripcion:'Habitación',capacidad:2,precioBase:420,ajusteFinSemanaPct:0,estado:'ACTIVO'}],
 '/api/admin/tipos-habitacion':[{id:9,nombre:'Categoría existente',descripcion:'Habitación',capacidad:2,precioBase:420,ajusteFinSemanaPct:0,estado:'ACTIVO',fotos:[]}],
 '/api/admin/hotel/editorial/es':{idioma:'es',revision:0,revisionPublicada:0,elementos:[]},
 '/api/admin/hotel':{nombre:hotelName,descripcion:'Descripción',direccion:'Dirección existente',telefono:'55551234',correo:'hotel@example.invalid',nombreComercial:'Hotel existente',razonSocial:'Razón social',nit:'1234567-9',direccionFiscal:'Dirección fiscal',fotos:[],horaCheckIn:'15:00',horaCheckOut:'12:00',politicaCancelacion:'Política del servicio'}
 };if(m!=='GET'){writes++;if(p==='/api/admin/hotel'&&m==='PUT'){const body=route.request().postDataJSON();hotelWrites.push(body);if(allowHotelSave){hotelName=body.nombre;return route.fulfill({json:{...data[p] as object,...body}});}}return route.fulfill({status:409,json:{codigo:'CONFLICTO',mensaje:'Conflicto de prueba: conserva los datos'}});}if(!(p in data))throw Error('Unexpected request '+p);await route.fulfill({json:data[p]});});
 expect((await context.request.post('/api/auth/login',{headers:{Origin:baseURL!},data:{correo:'admin@villaserena.gt',contrasena:'VillaSerena26'}})).status()).toBe(200);
 await page.goto('/admin/menu');await expect(page.getByRole('heading',{name:'Café · Q25.00'})).toBeVisible();await page.getByRole('button',{name:'Nuevo producto',exact:true}).click();let modal=page.getByRole('dialog');await expect(modal).toBeVisible();await modal.getByRole('button',{name:'Guardar',exact:true}).click();expect(writes).toBe(0);await expect(modal.getByLabel('Nombre',{exact:true})).toHaveAttribute('aria-invalid','true');await expectNoOverflow(page);await page.screenshot({path:info.outputPath('menu.png'),fullPage:true});await modal.getByRole('button',{name:'Cancelar',exact:true}).click();
 await page.goto('/admin/tarifas');await page.getByRole('tab',{name:'Temporadas',exact:true}).click();await page.getByRole('button',{name:'Nueva temporada',exact:true}).click();modal=page.getByRole('dialog');await modal.getByLabel('Nombre',{exact:true}).fill('Temporada temporal');await modal.getByLabel('Ajuste (%)',{exact:true}).fill('10');await modal.getByLabel('Inicio',{exact:true}).fill('2026-12-01');await modal.getByLabel('Fin',{exact:true}).fill('2026-12-10');await modal.getByRole('button',{name:'Guardar',exact:true}).click();await expect(modal.getByRole('alert')).toContainText('Conflicto de prueba');await expect(modal.getByLabel('Nombre',{exact:true})).toHaveValue('Temporada temporal');await expectNoOverflow(page);await page.screenshot({path:info.outputPath('temporadas.png'),fullPage:true});await modal.getByRole('button',{name:'Cancelar',exact:true}).click();
 await page.goto('/admin/hotel');await page.getByRole('button',{name:'Datos y políticas del hotel',exact:true}).click();
 const name=page.getByLabel('Nombre del hotel *',{exact:true}),save=page.getByRole('button',{name:'Guardar datos del hotel',exact:true});
 await expect(name).toHaveValue('Hotel existente');await expect(save).toBeDisabled();
 await name.fill('');await expect(save).toBeDisabled();expect(hotelWrites).toHaveLength(0);
 await name.fill('Hotel existente');await expect(save).toBeDisabled();
 await name.fill('Hotel actualizado');await expect(save).toBeEnabled();await save.click();
 await expect(page.getByRole('alert').filter({hasText:'Conflicto de prueba'})).toContainText('Conflicto de prueba');await expect(name).toHaveValue('Hotel actualizado');await expect(save).toBeEnabled();
 expect(hotelWrites).toHaveLength(1);allowHotelSave=true;await save.click();
 await expect(page.getByText('Datos del hotel actualizados.',{exact:true})).toBeVisible();await expect(save).toBeDisabled();
 expect(hotelWrites).toHaveLength(2);expect(hotelWrites[1]).toMatchObject({nombre:'Hotel actualizado',razonSocial:'Razón social',nit:'1234567-9'});expect(hotelWrites[1]).not.toHaveProperty('fotos');
 await page.reload();await expect(name).toHaveValue('Hotel actualizado');await expect(save).toBeDisabled();
 await expectNoOverflow(page);await page.screenshot({path:info.outputPath('hotel.png'),fullPage:true});
 await page.getByRole('button',{name:'Editor de la página web',exact:true}).click();
 await expect(page.getByRole('button',{name:'Guardar datos del hotel',exact:true})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Guardar borrador',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Publicar cambios',exact:true})).toBeVisible();expect(errors).toEqual([]);
 });
});
