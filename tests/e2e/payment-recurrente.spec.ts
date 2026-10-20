import {test,expect,viewports,hotelDate,reviewGuest,expectNoOverflow} from './public-fixtures';
for(const {name,viewport} of viewports)test.describe(name,()=>{
 test.use({viewport});
 test('Recurrente protocol: one creation/checkout, safe destination, pending return never approves or recharges',async({page},info)=>{
  let creates=0,payments=0,queries=0,approved=false;
  const code='VS-REC001',destination='https://app.recurrente.com/checkout-session/ch_browser_fixture';
  await page.route('**/api/publico/reservas',async route=>{creates++;expect(route.request().headers()['idempotency-key']).toBeTruthy();await route.fulfill({headers:{'X-Villa-Serena-Mode':'spring'},json:{codigo:code,estado:'PENDIENTE_PAGO',total:840}});});
  await page.route(`**/api/publico/reservas/${code}/pago`,async route=>{payments++;await route.fulfill({headers:{'X-Villa-Serena-Mode':'spring'},json:{urlPago:destination,expiraEn:new Date(Date.now()+1800000).toISOString()}});});
  await page.route(`**/api/publico/reservas/${code}/estado`,route=>{queries++;return route.fulfill({headers:{'X-Villa-Serena-Mode':'spring'},json:{codigo:code,estadoReserva:approved?'CONFIRMADA':'PENDIENTE_PAGO',estadoPago:approved?'APROBADO':'PENDIENTE',puedeReintentar:!approved}});});
  // This is a protocol fixture, not the provider's real card form or a Sandbox payment.
  await page.route(destination,route=>route.fulfill({contentType:'text/html',body:'<p>Hosted checkout protocol fixture — no payment provider contacted.</p>'}));
  await page.goto('/');const draft=await page.evaluate(({arrival,departure})=>{const id=crypto.randomUUID();sessionStorage.setItem('vs-public-booking-draft',JSON.stringify({id,createdAt:Date.now(),params:new URLSearchParams({slug:'habitacion-estandar',habitacion:'Habitación Estándar',tipoHabitacionId:'1',llegada:arrival,salida:departure,adultos:'2',ninos:'0',nombre:'Protocol',apellidos:'Fixture',correo:'browser@example.test',telefono:'+502 55555555',tipoDocumento:'DPI',documento:'0000000000001'}).toString()}));return id;},{arrival:hotelDate(14),departure:hotelDate(16)});
  await page.goto('/reservar/datos?'+new URLSearchParams({draft,slug:'habitacion-estandar',tipoHabitacionId:'1',llegada:hotelDate(14),salida:hotelDate(16),adultos:'2',ninos:'0'}));await expect(page.getByRole('heading',{name:'Introduce tus datos',exact:true})).toBeVisible();await reviewGuest(page);
  await expect(page.getByText('Pago procesado por Recurrente',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:/Descartar/})).toHaveCount(0);await expectNoOverflow(page);
  await page.locator('.terms-check input').check();await expect(page.getByRole('button',{name:'Continuar pago',exact:true})).toBeEnabled();
  await page.screenshot({path:info.outputPath('pago-recurrente.png'),fullPage:true});
  await page.locator('.terms-check input').check();await page.getByRole('button',{name:'Continuar pago',exact:true}).dblclick();
  await expect(page).toHaveURL(destination);expect(creates).toBe(1);expect(payments).toBe(1);
  await page.goto(`/reserva/resultado?codigo=${code}&success=true&paid=true`);
  await expect(page.getByRole('heading',{name:'Pago en proceso',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'Reintentar pago',exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Consultar estado',exact:true}).click();expect(queries).toBeGreaterThan(0);expect(payments).toBe(1);expect(creates).toBe(1);
  await page.screenshot({path:info.outputPath('retorno-pendiente.png'),fullPage:true});
  approved=true;await page.getByRole('button',{name:'Consultar estado',exact:true}).click();await expect(page.getByRole('heading',{name:'Tu reserva está confirmada',exact:true})).toBeVisible();
  expect(payments).toBe(1);expect(creates).toBe(1);await expectNoOverflow(page);
  expect(await page.evaluate(()=>sessionStorage.getItem('vs-public-booking-draft'))).toBeNull();
 });
 test('status outage shows uncertainty, not rejection; historical confirmed booking does not invent approval',async({page})=>{
  const code='VS-OLD123';await page.route(`**/api/publico/reservas/${code}/estado`,route=>route.abort());
  await page.goto(`/reserva/resultado?codigo=${code}&paid=true`);await expect(page.locator('main [role=alert]')).toContainText('No se pudo consultar');await expect(page.getByRole('button',{name:'Reintentar pago',exact:true})).toHaveCount(0);await expect(page.locator('main')).not.toContainText(/rechazado|aprobado/i);
  await page.unroute(`**/api/publico/reservas/${code}/estado`);await page.route(`**/api/publico/reservas/${code}/estado`,route=>route.fulfill({headers:{'X-Villa-Serena-Mode':'spring'},json:{codigo:code,estadoReserva:'CONFIRMADA',estadoPago:null,puedeReintentar:false}}));
  await page.getByRole('button',{name:'Consultar estado',exact:true}).click();await expect(page.getByRole('heading',{name:'Tu reserva está confirmada',exact:true})).toBeVisible();await expect(page.locator('main')).toContainText('El detalle del pago no está disponible');await expect(page.locator('.payment-result-summary')).not.toContainText('Aprobado');
 });
});