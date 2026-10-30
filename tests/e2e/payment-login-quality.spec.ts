import {test,expect,viewports,expectNoOverflow} from './public-fixtures';
const guestAction='Obtén tu código de acceso';
for(const {name,viewport} of [...viewports,{name:'320px',viewport:{width:320,height:740}}])test.describe(name,()=>{
 test.use({viewport});
 test('visual order, keyboard, inline validation and visibility',async({page},info)=>{
  const posts:string[]=[];
  await page.route('**/api/auth/iniciar-sesion',route=>{posts.push(route.request().url());return route.fulfill({status:401,json:{}});});
  await page.goto('/login');
  const guestLink=page.getByRole('button',{name:guestAction});
  await expect(page.locator('.login-guest-access>span')).toHaveText('¿Eres huésped?');
  await expect(page.locator('.login-guest-access>span')).toHaveCSS('color','rgb(83, 101, 121)');
  for(const link of [guestLink,page.getByRole('button',{name:'¿Olvidaste tu contraseña?'})]){
   await expect(link).toHaveCSS('color','rgb(66, 109, 152)');await expect(link).toHaveCSS('text-decoration-line','none');
   await link.hover();await expect(link).toHaveCSS('color','rgb(47, 82, 117)');
   await page.mouse.move(0,0);await link.focus();expect(await link.evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  }
  const email=page.getByRole('textbox',{name:'Correo electrónico',exact:true}),credential=page.getByLabel('Contraseña o código de acceso',{exact:true});
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(email).toBeFocused();await expect(email).toHaveAttribute('aria-invalid','true');expect(posts).toHaveLength(0);
  await email.fill('incomplete@');await credential.fill('123456');await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(page.getByText('Ingrese un correo electrónico válido')).toBeVisible();expect(posts).toHaveLength(0);
  await email.fill('navigation@example.test');await credential.focus();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'Mostrar credencial'})).toBeFocused();await page.keyboard.press('Enter');await expect(credential).toHaveAttribute('type','text');
  await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'¿Olvidaste tu contraseña?'})).toBeFocused();
  expect(await page.getByRole('button',{name:'¿Olvidaste tu contraseña?'}).evaluate(el=>getComputedStyle(el).outlineStyle)).not.toBe('none');
  const contrast=await page.locator('.login-submit,.login-recovery-action,.unified-login-options button').evaluateAll(elements=>elements.map(el=>{
   const luminance=(color:string)=>{const rgb=color.match(/[\d.]+/g)!.slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722;};
   const style=getComputedStyle(el),fg=luminance(style.color),bg=luminance(style.backgroundColor==='rgba(0, 0, 0, 0)'?'rgb(255, 255, 255)':style.backgroundColor);return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05);
  }));for(const value of contrast)expect(value).toBeGreaterThanOrEqual(4.5);
  const recover=(await page.getByRole('button',{name:'¿Olvidaste tu contraseña?'}).boundingBox())!,input=(await credential.boundingBox())!,submit=(await page.getByRole('button',{name:'Iniciar sesión',exact:true}).boundingBox())!,guest=(await page.getByRole('button',{name:guestAction}).boundingBox())!;
  expect(recover.y).toBeGreaterThanOrEqual(input.y+input.height);expect(submit.y).toBeGreaterThanOrEqual(recover.y+recover.height);expect(guest.y).toBeGreaterThanOrEqual(submit.y+submit.height);
  const preferences=(await page.locator('.guest-login-preferences').boundingBox())!;const remember=(await page.getByRole('checkbox',{name:'Recordarme'}).boundingBox())!;expect(recover.x).toBeGreaterThanOrEqual(preferences.x-2);expect(recover.x+recover.width).toBeLessThanOrEqual(preferences.x+preferences.width+2);expect(remember.x).toBeGreaterThanOrEqual(preferences.x-2);expect(remember.x+remember.width).toBeLessThanOrEqual(preferences.x+preferences.width+2);
  await page.getByRole('button',{name:'Ocultar credencial'}).click();await expectNoOverflow(page);await page.screenshot({path:info.outputPath('login.png'),fullPage:true});
  await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();await expect(page.locator('.login-error')).toContainText('No se pudo iniciar sesión');await expect(email).toHaveValue('navigation@example.test');
  expect(posts).toHaveLength(1);
 });
 test('code/recovery request fixtures, wait, errors, return and reload; no provider contacted',async({page})=>{
  await page.clock.install();
  const counts={code:0,recovery:0};
  await page.route('**/api/app/acceso/solicitar-codigo',route=>{counts.code++;return route.fulfill({status:200,json:{}});});
  await page.route('**/api/auth/recuperacion/solicitar',route=>{counts.recovery++;return route.fulfill({status:503,json:{}});});
  await page.goto('/login');await page.getByLabel('Correo electrónico',{exact:true}).fill('navigation@example.test');await page.getByRole('button',{name:guestAction}).click();
  await page.getByRole('button',{name:'Enviar código',exact:true}).dblclick();await expect(page.getByText('Si el correo tiene una reserva, recibirás un código de acceso.')).toBeVisible();expect(counts.code).toBe(1);
  await page.reload();await expect(page.getByRole('button',{name:'Enviar código',exact:true})).toBeDisabled();await expectNoOverflow(page);
  await page.clock.fastForward(61000);await page.reload();await expect(page.getByRole('button',{name:'Enviar código',exact:true})).toBeEnabled();await page.getByRole('button',{name:'Enviar código',exact:true}).click();await expect(page.getByText('Si el correo tiene una reserva, recibirás un código de acceso.')).toBeVisible();expect(counts.code).toBe(2);
  await page.getByRole('button',{name:'Volver a iniciar sesión',exact:true}).first().click();await expect(page.getByLabel('Correo electrónico',{exact:true})).toHaveValue('navigation@example.test');
  await page.getByRole('button',{name:'¿Olvidaste tu contraseña?'}).click();await page.getByRole('button',{name:'Enviar enlace',exact:true}).dblclick();await expect(page.getByRole('alert').filter({hasText:'No se pudo solicitar el enlace'})).toBeVisible();expect(counts.recovery).toBe(1);
  await page.getByRole('button',{name:'Volver a iniciar sesión',exact:true}).click();await expect(page.getByLabel('Correo electrónico',{exact:true})).toHaveValue('navigation@example.test');
 });
 test('client accepts only allowed role destinations from response fixtures',async({page})=>{
  const destinations=['/admin','/recepcion','/room-service','/limpieza','/mantenimiento','/portal','/panel/cambiar-contrasena'];
  let destination='';
  await page.route('**/portal?codigo=*',route=>route.fulfill({contentType:'text/html',body:'<h1>Destino controlado</h1>'}));
  await page.route('**/api/auth/iniciar-sesion',route=>route.fulfill({json:{destino:destination}}));
  // A destination stub only verifies navigation, never access permissions or a real session.
  for(const target of destinations){
   await page.route('**'+target,route=>route.request().isNavigationRequest()?route.fulfill({contentType:'text/html',body:'<h1>Destino controlado: no acredita permisos</h1>'}):route.continue());
   await page.goto('/login?codigo=VS-ABC123');destination=target;await page.getByLabel('Correo electrónico',{exact:true}).fill('navigation@example.test');await page.getByLabel('Contraseña o código de acceso',{exact:true}).fill('123456');
   await page.getByRole('button',{name:'Iniciar sesión',exact:true}).click();
   await expect(page).toHaveURL(url=>url.pathname===target);if(target==='/portal')expect(new URL(page.url()).searchParams.get('codigo')).toBe('VS-ABC123');
  }
 });
});
