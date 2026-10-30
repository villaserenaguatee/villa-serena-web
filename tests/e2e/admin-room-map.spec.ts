import {test,expect} from '@playwright/test';
import {expectNoOverflow} from './public-fixtures';
for(const width of [1440,390,320])test('panel de habitaciones: layout y filtros a '+width+' px',async({page,context,baseURL},info)=>{
 await page.setViewportSize({width,height:900});let writes=0;
 const types=[{id:9,version:0,nombre:'Estándar',descripcion:'Categoría de prueba',capacidad:2,precioBase:420,ajusteFinSemanaPct:0,estado:'ACTIVO'}];
 const rooms=Array.from({length:24},(_,index)=>({id:index+1,version:0,numero:String((Math.floor(index/8)+1)*100+index%8+1),piso:Math.floor(index/8)+1,tipoHabitacionId:9,estado:'ACTIVO',ocupacion:index%4===1?'OCUPADA':'LIBRE',condicion:index%4===2?'EN_LIMPIEZA':index%4===3?'FUERA_DE_SERVICIO':'LIMPIA'}));
 await page.route('**/api/admin/catalogos/**',route=>{if(route.request().method()!=='GET'){writes++;return route.fulfill({status:403,json:{}});}return route.fulfill({json:new URL(route.request().url()).pathname.endsWith('/tipos')?types:rooms});});
 expect((await context.request.post('/api/auth/login',{headers:{Origin:baseURL!},data:{correo:'admin@villaserena.gt',contrasena:'VillaSerena26'},timeout:60000})).status()).toBe(200);
 await page.goto('/admin');await expect(page.getByRole('heading',{name:'Habitaciones físicas',exact:true})).toBeVisible({timeout:60000});
 await expect(page.getByText('Registre cada habitación por su número y categoría. La cantidad se calcula a partir de estos registros, sin cupos manuales.')).toHaveCount(0);
 await expect(page.getByRole('cell',{name:'101',exact:true})).toBeVisible();await expectNoOverflow(page);await page.screenshot({path:info.outputPath('habitaciones-'+width+'.png'),fullPage:true});
 await page.getByRole('tab',{name:'Categorías de habitación',exact:true}).click();await expect(page.getByRole('heading',{name:'Categorías de habitación',exact:true})).toBeVisible();
 await expect(page.getByText('Edite los datos de la categoría. El contenido de las ofertas públicas se administra por separado.')).toHaveCount(0);
 await expect(page.getByText('Estándar',{exact:true})).toBeVisible();await expectNoOverflow(page);await page.screenshot({path:info.outputPath('categorias-'+width+'.png'),fullPage:true});
 await page.getByRole('tab',{name:'Mapa de habitaciones',exact:true}).click();const heading=page.getByRole('heading',{name:'Mapa de habitaciones',exact:true}),tabs=page.getByRole('tablist',{name:'Gestión de habitaciones'});
 await expect(heading).toBeVisible();await expect(page.getByText('101',{exact:true})).toBeVisible();await expect(tabs).toHaveCount(1);
 for(const tab of await tabs.getByRole('tab').all()){const box=await tab.boundingBox();expect(box!.x).toBeGreaterThanOrEqual(0);expect(box!.x+box!.width).toBeLessThanOrEqual(width);expect(await tab.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);}
 const floor=page.getByRole('combobox',{name:'Piso',exact:true}),state=page.getByRole('combobox',{name:'Estado',exact:true});
 const titleBox=await heading.boundingBox(),tabsBox=await tabs.boundingBox(),floorBox=await floor.boundingBox(),stateBox=await state.boundingBox();
 expect(titleBox!.y).toBeGreaterThanOrEqual(0);expect(tabsBox!.y).toBeGreaterThanOrEqual(titleBox!.y+titleBox!.height);expect(floorBox!.y).toBeGreaterThan(tabsBox!.y+tabsBox!.height);expect(Math.abs(floorBox!.y-stateBox!.y)).toBeLessThanOrEqual(1);
 await expectNoOverflow(page);await page.screenshot({path:info.outputPath('mapa-'+width+'.png'),fullPage:true});
 await floor.selectOption('2');await state.selectOption('ocupada');await expect(page.getByText('202',{exact:true})).toBeVisible();await expect(page.getByText('201',{exact:true})).toHaveCount(0);await expect(page.getByText('102',{exact:true})).toHaveCount(0);
 await floor.selectOption('todos');await expect(state).toHaveValue('ocupada');await expect(page.getByText('102',{exact:true})).toBeVisible();
 await state.selectOption('todas');await heading.evaluate(node=>{let parent=node.parentElement;while(parent&&getComputedStyle(parent).overflowY!=='auto')parent=parent.parentElement;if(!parent)throw Error('Falta contenedor de scroll');parent.scrollTop=parent.scrollHeight;if(parent.scrollTop===0)throw Error('El mapa no permite desplazarse');parent.scrollTop=0;});
 await expect(heading).toBeVisible();await expect(tabs).toBeVisible();expect(writes).toBe(0);
});
