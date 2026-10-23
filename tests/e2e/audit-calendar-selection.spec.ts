import {test,expect} from '@playwright/test';
import {expectNoOverflow} from './public-fixtures';
import {hotelDate} from './reception-fixtures';
for(const width of [1440,390,320])test.describe('Gantt selection '+width,()=>{
 test.use({viewport:{width,height:900},hasTouch:width<700,isMobile:width<700});
 test('selects free nights, keeps existing reservations, preloads the form and survives month navigation',async({page,context,baseURL},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));let checks=0,available=true;
  const type={id:1,nombre:'Standard'},room={id:1,numero:'101',piso:1,tipoHabitacion:type,ocupacion:'LIBRE',condicion:'LIMPIA',llegaHoy:false,saleHoy:false,incidenciaPendiente:false,incidenciaBloqueante:null};
  await page.route('**/api/habitaciones**',route=>{const p=new URL(route.request().url()).pathname;if(p.endsWith('/disponibles')){checks++;return route.fulfill({headers:{'X-Villa-Serena-Mode':'spring'},json:available?[{id:1,numero:'101',piso:1}]:[]});}return route.fulfill({headers:{'X-Villa-Serena-Mode':'spring'},json:[room,{...room,id:2,numero:'102',condicion:'FUERA_DE_SERVICIO'}]});});
  await page.route('**/api/reservas**',route=>{const p=new URL(route.request().url()).pathname;const headers={'X-Villa-Serena-Mode':'spring'};
   if(p.endsWith('/calendario'))return route.fulfill({headers,json:{grupos:[{tipoHabitacion:type,habitaciones:[{id:1,numero:'101',piso:1},{id:2,numero:'102',piso:1}]}],reservas:[{codigo:'VS-ABC123',estado:'CONFIRMADA',entrada:hotelDate(2),salida:hotelDate(3),habitacionId:1,tipoHabitacionId:1,huespedPrincipal:'Huésped de revisión',canal:'RECEPCION'}]}});
   if(p.endsWith('/disponibilidad'))return route.fulfill({headers,json:[{tipoHabitacion:type,capacidad:2,habitacionesDisponibles:1,total:200,noches:2,precioBase:100,detalleNoches:[]}]});
   return route.fulfill({headers,json:{contenido:[],pagina:0,tamano:100,totalElementos:0,totalPaginas:1}});
  });
  expect((await context.request.post('/api/auth/login',{headers:{Origin:baseURL!},data:{correo:'revisor@example.invalid',contrasena:'fixture-only'}})).status()).toBe(200);
  await page.goto('/recepcion');await page.getByRole('button',{name:'Ver calendario',exact:true}).click();
  const calendar=page.getByRole('region',{name:'Calendario de reservas'});await calendar.getByRole('button',{name:'Habitaciones',exact:true}).click();
  expect(await calendar.getByRole('button',{name:`Seleccionar noche ${hotelDate(2)}, habitación 101`}).count()).toBe(0);
  await expect(calendar.getByRole('button',{name:`Seleccionar noche ${hotelDate(4)}, habitación 102`})).toBeDisabled();
  const first=calendar.getByRole('button',{name:`Seleccionar noche ${hotelDate(4)}, habitación 101`});await first.scrollIntoViewIfNeeded();
  const last=calendar.getByRole('button',{name:`Seleccionar noche ${hotelDate(5)}, habitación 101`});
  if(width<700){await first.tap();await last.tap();}else{await first.click();await last.click();}
  await expect(first).toHaveAttribute('aria-pressed','true');await expectNoOverflow(page);await page.screenshot({path:info.outputPath('rango.png'),fullPage:true});
  await calendar.getByRole('button',{name:'Reservar selección'}).click();const form=page.getByRole('dialog',{name:'Nueva reserva'});await expect(form).toBeVisible();
  await expect(form.getByText(`${hotelDate(4)} → ${hotelDate(6)}`,{exact:true})).toBeVisible();
  await expect(form.getByRole('heading',{name:/Habitación 101/})).toBeVisible();
  expect(checks).toBeGreaterThan(0);await expectNoOverflow(page);
  await form.getByText(`${hotelDate(4)} → ${hotelDate(6)}`,{exact:true}).scrollIntoViewIfNeeded();
  await page.screenshot({path:info.outputPath('formulario-precargado.png'),fullPage:true});
  await form.getByRole('button',{name:'Cancelar',exact:true}).click();await expect(form).toHaveCount(0);
  const period=calendar.getByRole('group',{name:'Navegación del calendario'}).locator('p');const initial=await period.innerText();await calendar.getByRole('button',{name:'Período siguiente'}).click();await expect(period).not.toHaveText(initial);await calendar.getByRole('button',{name:'Período anterior'}).click();await expect(period).toHaveText(initial);
  available=false;await calendar.getByRole('button',{name:'Reservar selección'}).click();await expect(calendar.getByRole('alert').filter({hasText:'ya no está disponible'})).toBeVisible();await expect(form).toHaveCount(0);
  expect(errors).toEqual([]);
 });
});
