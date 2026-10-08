const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.STAFF_TEST_URL ?? 'http://localhost:3000';
let browser;
async function login(page, correo, contrasena = 'VillaSerena26') {
  await page.goto(`${base}/panel/login`);
  await page.getByLabel('Correo', { exact: true }).fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill(contrasena);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
}
(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push({ message: error.message, stack: error.stack, url: page.url() }));
  await page.goto(base); assert.equal(new URL(page.url()).pathname, '/');
  await page.goto(`${base}/panel`); await page.waitForURL('**/panel/login');
  await page.goto(`${base}/recepcion/reservas`); await page.waitForURL('**/panel/login');
  console.log('PASS inicio público y páginas privadas sin sesión.');
  await login(page, 'recepcion@villaserena.gt');
  await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
  const menu = page.getByRole('navigation', { name: 'Menú de mi rol' });
  assert.deepEqual(await menu.getByRole('link').allTextContents(), ['Calendario', 'Reservas', 'Habitaciones']);
  const cookies = (await context.cookies()).filter(c => c.name.startsWith('vs_staff_'));
  assert.equal(cookies.length, 2); assert.ok(cookies.every(c => c.httpOnly && c.sameSite === 'Lax' && c.path === '/'));
  assert.equal(await page.evaluate(() => document.cookie.includes('vs_staff_')), false);
  assert.equal(await page.evaluate(() => localStorage.getItem('villa-serena-session')), null);
  const yo = await context.request.get(`${base}/api/auth/yo`);
  assert.deepEqual(Object.keys(await yo.json()).sort(), ['area', 'correo', 'debeCambiarContrasena', 'id', 'nombre', 'rol']);
  console.log('PASS menú de Recepción, cookies HttpOnly y sin tokens ni sesión del personal en localStorage.');
  await menu.getByRole('link', { name: 'Calendario', exact: true }).click();
  await page.getByRole('heading', { name: 'Calendario de reservas' }).waitFor();
  await page.reload(); await page.getByRole('heading', { name: 'Calendario de reservas' }).waitFor();
  await page.goto(`${base}/admin`); await page.getByRole('heading', { name: 'Acceso denegado' }).waitFor();
  await page.goto(`${base}/panel/admin/canal-simulado`); await page.getByRole('heading', { name: 'Acceso denegado' }).waitFor();
  console.log('PASS diseño actual, recarga con sesión y rechazo de otro rol por URL.');
  // Simula la desaparición de la cookie de acceso; el refresh debe rotar en el BFF.
  const oldRefresh = (await context.cookies()).find(c => c.name === 'vs_staff_refresh').value;
  await context.clearCookies({ name: 'vs_staff_access' });
  await page.goto(`${base}/panel`); await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
  assert.notEqual((await context.cookies()).find(c => c.name === 'vs_staff_refresh').value, oldRefresh);
  const forged = await context.request.get(`${base}/api/auth/yo`, { headers: { Cookie: `vs_staff_refresh=${oldRefresh}` } }); assert.equal(forged.status(), 401);
  // La petición con refresh usado borró las cookies del contexto; vuelve a iniciar sesión.
  await login(page, 'recepcion@villaserena.gt'); await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE']) {
    const bad = await context.request.fetch(`${base}/api/auth/login`, { method, headers: { Origin: 'https://ajeno.example' }, data: {} }); assert.equal(bad.status(), 403);
  }
  const missing = await context.request.post(`${base}/api/auth/login`, { data: {} }); assert.equal(missing.status(), 403);
  for (const path of ['pagos/stripe/webhook', 'canal/reservas', 'auth/renovar']) {
    const denied = await context.request.post(`${base}/api/${path}`, { headers: { Origin: base }, data: {} }); assert.equal(denied.status(), 403);
  }
  console.log('PASS renovación al abrir el panel, refresh usado rechazado y Origin ajeno o ausente rechazado.');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(); await page.waitForURL('**/panel/login');
  assert.equal((await context.cookies()).filter(c => c.name.startsWith('vs_staff_')).length, 0);
  await page.goto(`${base}/panel`); await page.waitForURL('**/panel/login');
  console.log('PASS cierre de sesión: cookies borradas y panel protegido.');
  await login(page, 'temporal@villaserena.gt'); await page.waitForURL('**/panel/cambiar-contrasena');
  await page.goto(`${base}/recepcion`); await page.waitForURL('**/panel/cambiar-contrasena');
  const blocked = await context.request.get(`${base}/api/reservas`); assert.equal(blocked.status(), 403); assert.equal((await blocked.json()).codigo, 'CONTRASENA_TEMPORAL');
  await page.getByLabel('Contraseña actual', { exact: true }).fill('VillaSerena26');
  await page.getByLabel('Nueva contraseña', { exact: true }).fill('NuevaClave123');
  await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('distinta');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click(); await page.getByText('La confirmación no coincide con la nueva contraseña.', { exact: true }).waitFor();
  await page.getByLabel('Confirmar nueva contraseña', { exact: true }).fill('NuevaClave123');
  await page.getByRole('button', { name: 'Guardar contraseña' }).click();
  await page.getByRole('heading', { name: 'Calendario de reservas' }).waitFor();
  console.log('PASS temporal: bloqueo de páginas y API, confirmación y cambio completado.');
  for (const [correo, expected] of [
    ['admin@villaserena.gt', ['Canal simulado']], ['roomservice@villaserena.gt', ['Pedidos', 'Menú']],
    ['limpieza@villaserena.gt', ['Limpieza', 'Solicitudes', 'Incidencias']], ['mantenimiento@villaserena.gt', ['Incidencias']],
    ['ambas@villaserena.gt', ['Limpieza', 'Solicitudes', 'Incidencias']],
  ]) {
    await login(page, correo); await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
    assert.deepEqual(await page.getByRole('navigation', { name: 'Menú de mi rol' }).getByRole('link').allTextContents(), expected);
  }
  console.log('PASS menús de Administración, Room Service, Limpieza, Mantenimiento y Ambas.');
  assert.deepEqual(errors, []);
  await context.close();
  console.log('Todas las pruebas usan datos de prueba detrás del BFF. API de Pablo: PENDIENTE.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
