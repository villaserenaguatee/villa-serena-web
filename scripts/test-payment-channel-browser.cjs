const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { chromium } = require('playwright');
const base = process.env.ISSUE6_TEST_URL || 'http://localhost:3006';
const evidence = '.next-dev/issue6-evidence';
const markers = ['issue6-server-only-marker', 'CANAL_BOOKING_CLAVE', 'CANAL_EXPEDIA_CLAVE'];
let browser;
async function login(page, correo) {
  await page.goto(base + '/panel/login');
  await page.getByLabel('Correo', { exact: true }).fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Desborde: ${page.url()}`);
}
(async () => {
  mkdirSync(evidence, { recursive: true });
  browser = await chromium.launch({ headless: true });
  for (const mobile of [false, true]) {
    const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, locale: 'es-GT', timezoneId: 'America/Guatemala' });
    const page = await context.newPage(), errors = [], requests = [], reads = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', r => {
      if (r.url().startsWith(base)) {
        requests.push({ url: r.url(), method: r.method(), headers: r.headers(), body: r.postData() });
        for (const marker of markers) assert.ok(!JSON.stringify(requests.at(-1)).includes(marker));
        assert.ok(!Object.keys(r.headers()).some(h => h.startsWith('x-canal-')));
      }
    });
    page.on('response', r => {
      if (r.url().startsWith(base) && /javascript|json|text\/html/.test(r.headers()['content-type'] || ''))
        reads.push(r.text().then(body => { for (const marker of markers) assert.ok(!body.includes(marker), `Clave expuesta en ${r.url()}`); }).catch(e => { if (e.code === 'ERR_ASSERTION') throw e; }));
    });
    for (const [code, title] of [['VS-DEMO01', 'Pago confirmado'], ['VS-DEMO02', 'Pago en proceso'], ['VS-DEMO03', 'Pago no completado'], ['VS-DEMO04', 'Pago no completado']]) {
      await page.goto(`${base}/reserva/resultado?codigo=${code}&success=true&estadoPago=APROBADO`);
      await page.getByRole('heading', { name: title, exact: true }).waitFor();
      if (code === 'VS-DEMO01') { await page.getByText('El correo de confirmación es simulado', { exact: false }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Reintentar pago' }).count(), 0); }
      if (code === 'VS-DEMO04') { await page.getByText('Venció el plazo de 30 minutos', { exact: false }).waitFor(); assert.equal(await page.getByRole('button', { name: 'Reintentar pago' }).count(), 0); }
      await noOverflow(page);
      await page.screenshot({ path: `${evidence}/${mobile ? 'mobile' : 'desktop'}-${code}.png`, fullPage: true });
    }
    await page.goto(`${base}/reserva/resultado?codigo=VS-DEMO03`);
    await page.getByRole('heading', { name: 'Pago no completado' }).waitFor();
    const retryRequest = page.waitForRequest(r => r.url().endsWith('/VS-DEMO03/pago') && r.method() === 'POST');
    await Promise.all([page.waitForNavigation({ waitUntil: 'load' }), page.getByRole('button', { name: 'Reintentar pago' }).click(), retryRequest]);
    await page.getByRole('heading', { name: 'Pago no completado' }).waitFor();
    if (!mobile) {
      await page.clock.install();
      await page.goto(`${base}/reserva/resultado?codigo=VS-DEMO02`);
      await page.getByRole('heading', { name: 'Pago en proceso' }).waitFor();
      await page.clock.pauseAt(new Date(Date.now() + 1000));
      const before = requests.filter(r => r.url.includes('/VS-DEMO02/estado')).length;
      await page.clock.runFor(3000);
      await page.waitForFunction(() => document.querySelector('h1')?.textContent === 'Pago en proceso');
      assert.ok(requests.filter(r => r.url.includes('/VS-DEMO02/estado')).length > before);
      await page.clock.fastForward(61000);
      await page.getByRole('heading', { name: 'Pago no completado' }).waitFor();
      const stopped = requests.filter(r => r.url.includes('/VS-DEMO02/estado')).length;
      await page.clock.fastForward(30000);
      assert.equal(requests.filter(r => r.url.includes('/VS-DEMO02/estado')).length, stopped);
      await page.clock.resume();
      console.log('PASS consultas cada 3 segundos y parada al superar un minuto, sin confirmar pago.');
    }
    await login(page, 'recepcion@villaserena.gt');
    assert.equal(await page.getByRole('navigation', { name: 'Menú de mi rol' }).getByRole('link', { name: 'Canal simulado' }).count(), 0);
    await page.goto(base + '/panel/admin/canal-simulado');
    await page.getByRole('heading', { name: 'Acceso denegado' }).waitFor();
    const denied = await context.request.post(base + '/api/admin/canal-simulado/reservas', { headers: { Origin: base }, data: {} });
    assert.equal(denied.status(), 403);
    await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click(); await page.waitForURL('**/panel/login');
    await login(page, 'admin@villaserena.gt');
    await page.getByRole('link', { name: 'Canal simulado', exact: true }).click();
    await page.getByRole('heading', { name: 'Canal simulado' }).waitFor();
    await page.getByRole('button', { name: 'Llenar al azar' }).click();
    await page.getByLabel('Identificador externo', { exact: true }).fill(`BROWSER-${mobile ? 'MOBILE' : 'DESKTOP'}-${Date.now()}`);
    const sent = page.waitForRequest(r => r.url().endsWith('/api/admin/canal-simulado/reservas') && r.method() === 'POST');
    await page.getByRole('button', { name: 'Enviar reserva de prueba' }).click();
    const captured = JSON.parse((await sent).postData());
    await page.getByRole('heading', { name: 'Solicitud aceptada · HTTP 201 del canal' }).waitFor();
    const code = await page.locator('[role="status"] strong').innerText();
    await page.getByLabel('Monto total (Q)').fill('1234');
    const repeated = page.waitForRequest(r => r.url().endsWith('/api/admin/canal-simulado/reservas') && r.method() === 'POST');
    await page.getByRole('button', { name: 'Repetir último envío' }).click();
    assert.deepEqual(JSON.parse((await repeated).postData()), captured);
    await page.getByRole('heading', { name: 'Solicitud aceptada · HTTP 200 del canal' }).waitFor();
    assert.equal(await page.locator('[role="status"] strong').innerText(), code);
    await noOverflow(page);
    await page.screenshot({ path: `${evidence}/${mobile ? 'mobile' : 'desktop'}-channel.png`, fullPage: true });
    const postCount = requests.filter(r => r.url.endsWith('/api/admin/canal-simulado/reservas')).length;
    await page.getByLabel('Salida', { exact: true }).fill(await page.getByLabel('Entrada', { exact: true }).inputValue());
    await page.getByRole('button', { name: 'Enviar reserva de prueba' }).click();
    await page.getByRole('alert').filter({ hasText: 'La salida debe ser posterior' }).waitFor();
    assert.equal(requests.filter(r => r.url.endsWith('/api/admin/canal-simulado/reservas')).length, postCount);
    const storage = await page.evaluate(() => JSON.stringify({ html: document.documentElement.outerHTML, cookie: document.cookie, local: { ...localStorage }, session: { ...sessionStorage } }));
    for (const marker of markers) assert.ok(!storage.includes(marker));
    assert.ok(!storage.includes('vs_staff_access='));
    await Promise.all(reads); assert.deepEqual(errors, []);
    console.log(`PASS ${mobile ? 'móvil' : 'computadora'}: resultados, reintento, permisos, 201/200, validación y clave ausente en navegador.`);
    await context.close();
  }
  console.log('Pruebas simuladas. API real, Stripe, webhook y correo pendientes.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); });
