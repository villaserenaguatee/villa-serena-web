const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const base = process.env.RECEPTION_TEST_URL ?? 'http://localhost:3025';
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
const date = offset => new Date(Date.parse(today) + offset * 86400000).toISOString().slice(0, 10);
const coreOffset = Number(process.env.RECEPTION_TEST_OFFSET ?? 5);
let browser;
async function login(page) {
  await page.goto(`${base}/panel/login`);
  await page.getByLabel('Correo', { exact: true }).fill('recepcion@villaserena.gt');
  await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
}
async function calendar(page, code, offset = coreOffset) {
  await page.goto(`${base}/recepcion`);
  const region = page.getByRole('region', { name: 'Calendario de reservas', exact: true });
  await region.getByRole('heading', { name: 'Calendario de reservas' }).waitFor();
  // El caso se crea en el mes que contiene su entrada, incluso al final del mes actual.
  if (date(offset).slice(0, 7) !== today.slice(0, 7)) await region.getByRole('button', { name: 'Período siguiente' }).click();
  if (code) await region.getByRole('button', { name: `${code}, Confirmada`, exact: true }).waitFor();
  return region;
}
async function checkDetail(page, code, expected) {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === `/api/reservas/${code}` && r.status() === 200);
  const detail = await (await response).json();
  assert.deepEqual(detail, expected);
  const dialog = page.getByRole('dialog', { name: 'Detalle de reserva' });
  await dialog.getByRole('heading', { name: 'Historial de estados' }).waitFor();
  const text = await dialog.innerText();
  assert.ok(text.includes(code)); assert.ok(text.includes(expected.huesped.nombreCompleto));
  assert.ok(text.includes(expected.tipoHabitacion.nombre));
  if (expected.habitacion) assert.ok(text.includes(expected.habitacion.numero));
  else assert.ok(text.includes('Sin asignar'));
  return dialog;
}
(async () => {
  browser = await chromium.launch({ headless: true });
  mkdirSync('.data/issue25-evidence', { recursive: true });
  const createdCases = [];
  for (const [name, viewport] of (process.argv.includes('--resilience-only') ? [] : [['computadora', { width: 1440, height: 1000 }], ['movil', { width: 390, height: 844 }]])) {
    const context = await browser.newContext({ viewport }); context.setDefaultTimeout(25000);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await login(page); await calendar(page);
    const previous = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas')));
    for (const assigned of [true, false]) {
      const region = await calendar(page);
      await region.getByRole('button', { name: 'Nueva reserva', exact: true }).click();
      await page.getByPlaceholder('Buscar por nombre…').fill('Ana');
      await page.getByRole('button', { name: /^Ana Morales/ }).click();
      await page.getByLabel('Entrada', { exact: true }).fill(date(coreOffset));
      await page.getByLabel('Salida', { exact: true }).fill(date(coreOffset + 2));
      if (assigned) await page.getByRole('dialog', { name: 'Nueva reserva' }).getByRole('button', { name: /^Habitación \d{3}/ }).first().click();
      await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
      const creation = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'POST');
      let posts = 0;
      const count = r => { if (new URL(r.url()).pathname === '/api/reservas' && r.method() === 'POST') posts++; };
      page.on('request', count);
      await page.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
      const response = await creation; assert.equal(response.status(), 201);
      const expected = await response.json(), code = expected.codigo;
      createdCases.push(expected);
      assert.equal(Boolean(expected.habitacion), assigned);
      assert.equal(expected.saldoPendiente, expected.total); assert.equal(expected.canal, 'RECEPCION');
      await page.getByRole('heading', { name: 'Reserva confirmada', exact: true }).waitFor();
      await page.screenshot({ path: `.data/issue25-evidence/${name}-${assigned ? 'asignada' : 'sin-asignar'}-confirmacion.png` });
      const detailCheck = checkDetail(page, code, expected);
      await page.getByRole('button', { name: 'Ver reserva / realizar check-in', exact: true }).click();
      const dialog = await detailCheck;
      await dialog.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
      const loaded = await calendar(page, code);
      assert.equal(await loaded.getByRole('button', { name: `${code}, Confirmada`, exact: true }).count(), 1);
      await loaded.getByRole('button', { name: `${code}, Confirmada`, exact: true }).click();
      const fromCalendar = checkDetail(page, code, expected);
      await loaded.getByRole('region', { name: 'Resumen de reserva' }).getByRole('button', { name: 'Ver detalle', exact: true }).click();
      await fromCalendar;
      await page.screenshot({ path: `.data/issue25-evidence/${name}-${assigned ? 'asignada' : 'sin-asignar'}-detalle.png` });
      await page.goto(`${base}/recepcion/reservas`);
      for (const field of ['Nombre o documento', 'Código de reserva']) {
        await page.getByLabel('Nombre o documento', { exact: true }).fill(field === 'Nombre o documento' ? 'Ana' : '');
        await page.getByLabel('Código de reserva', { exact: true }).fill(field === 'Código de reserva' ? code : '');
        const search = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'GET' && r.status() === 200 &&
          new URL(r.url()).searchParams.get(field === 'Nombre o documento' ? 'texto' : 'codigo') === (field === 'Nombre o documento' ? 'Ana' : code));
        await page.getByRole('button', { name: 'Buscar', exact: true }).click();
        const result = await (await search).json();
        assert.equal(result.contenido.filter(r => r.codigo === code).length, 1);
        await page.getByRole('button').filter({ hasText: code }).waitFor();
      }
      await page.getByRole('button').filter({ hasText: code }).click();
      // La vista de búsqueda usa el mismo endpoint que la del calendario.
      const searchDialog = page.getByRole('dialog', { name: 'Detalle de reserva' });
      await searchDialog.getByRole('heading', { name: 'Historial de estados' }).waitFor();
      assert.ok((await searchDialog.innerText()).includes(expected.huesped.nombreCompleto));
      await page.reload();
      await page.goto(`${base}/recepcion/reservas/${code}`);
      await page.getByRole('dialog', { name: 'Detalle de reserva' }).getByRole('heading', { name: 'Historial de estados' }).waitFor();
      assert.deepEqual(await (await context.request.get(`${base}/api/reservas/${code}`)).json(), expected);
      const reloaded = await calendar(page, code);
      assert.equal(await reloaded.getByRole('button', { name: `${code}, Confirmada`, exact: true }).count(), 1);
      const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas')));
      assert.equal(stored.filter(r => r.codigo === code).length, 1);
      for (const original of previous) assert.deepEqual(stored.find(r => r.id === original.id), original);
      assert.equal(posts, 1); page.off('request', count);
      console.log(`PASS ${name}: ${code} ${assigned ? 'con habitación' : 'sin habitación'}, calendario, nombre/código, mismo detalle, recarga y sin duplicados.`);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  const fresh = await browser.newContext({ viewport: { width: 390, height: 844 } });
  fresh.setDefaultTimeout(25000);
  const page = await fresh.newPage(); await login(page);
  if (!createdCases.length) {
    const result = await (await fresh.request.get(`${base}/api/reservas?size=100`)).json();
    for (const summary of result.contenido.filter(r => /^VS-[A-F0-9]{6}$/.test(r.codigo) && r.entrada === date(coreOffset)).slice(0, 2))
      createdCases.push(await (await fresh.request.get(`${base}/api/reservas/${summary.codigo}`)).json());
    assert.ok(createdCases.length, 'Primero ejecuta la prueba completa para preparar reservas de creación.');
  }
  for (const expected of createdCases) {
    const region = await calendar(page, expected.codigo);
    assert.equal(await page.evaluate(code => JSON.parse(localStorage.getItem('vs-reservas')).some(r => r.codigo === code), expected.codigo), false);
    await region.getByRole('button', { name: `${expected.codigo}, Confirmada`, exact: true }).click();
    const same = checkDetail(page, expected.codigo, expected);
    await region.getByRole('region', { name: 'Resumen de reserva' }).getByRole('button', { name: 'Ver detalle', exact: true }).click();
    await same;
  }
  console.log('PASS: las reservas se recuperan del BFF en un navegador sin su copia local.');
  // Abrir cuenta/check-in de una fixture reutiliza su identidad, sin una segunda estancia local.
  await page.goto(`${base}/recepcion/reservas/VS-TEST04`);
  const oldDetail = page.getByRole('dialog', { name: 'Detalle de reserva' });
  await oldDetail.getByRole('heading', { name: 'Historial de estados' }).waitFor();
  const originalLocal = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas')));
  await oldDetail.getByRole('button', { name: 'Ver cuenta', exact: true }).click();
  await page.getByRole('button', { name: 'Cuenta y pagos', exact: true }).waitFor();
  const afterBridge = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas')));
  assert.equal(afterBridge.length, originalLocal.length);
  const linked = afterBridge.find(r => r.codigoBff === 'VS-TEST04');
  assert.ok(linked); assert.equal(linked.codigo, originalLocal.find(r => r.id === linked.id).codigo);
  await page.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
  console.log('PASS: cuenta existente conserva su identidad y código local, sin duplicar la estancia.');
  // Guarda la reserva en el servidor y pierde solo la respuesta. No debe repetirse el POST.
  const region = await calendar(page, undefined, 15);
  await region.getByRole('button', { name: 'Nueva reserva', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Nueva reserva' });
  await form.getByRole('button', { name: 'Registrar nuevo huésped', exact: true }).click();
  const unique = Date.now();
  await form.getByLabel('Nombre', { exact: true }).fill('Prueba');
  await form.getByLabel('Apellidos', { exact: true }).fill(`Persistencia ${unique}`);
  await form.getByLabel('Número de documento', { exact: true }).fill(String(unique));
  await form.getByLabel('Correo electrónico', { exact: true }).fill(`issue25-${unique}@example.test`);
  await form.getByLabel('Teléfono', { exact: true }).fill('55551234');
  await form.getByLabel('Entrada', { exact: true }).fill(date(15));
  await form.getByLabel('Salida', { exact: true }).fill(date(17));
  await form.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  let lost, posts = 0;
  await page.route(`${base}/api/reservas`, async route => {
    if (route.request().method() !== 'POST') return route.continue();
    posts++; const response = await route.fetch(); assert.equal(response.status(), 201);
    lost = await response.json(); await route.abort('failed');
  });
  await form.getByRole('button', { name: 'Confirmar reserva', exact: true }).dblclick();
  await form.getByRole('alert').filter({ hasText: 'No se pudo comprobar el resultado' }).waitFor();
  assert.equal(await form.getByRole('button', { name: 'Confirmar reserva', exact: true }).isEnabled(), false);
  assert.equal(posts, 1); assert.ok(lost);
  await page.unroute(`${base}/api/reservas`);
  await page.goto(`${base}/recepcion/reservas`);
  await page.getByLabel('Código de reserva', { exact: true }).fill(lost.codigo);
  const query = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'GET' && new URL(r.url()).searchParams.get('codigo') === lost.codigo);
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  assert.equal((await (await query).json()).contenido.filter(r => r.codigo === lost.codigo).length, 1);
  const recovered = await calendar(page, lost.codigo, 15);
  await recovered.getByRole('button', { name: `${lost.codigo}, Confirmada`, exact: true }).click();
  const same = checkDetail(page, lost.codigo, lost);
  await recovered.getByRole('region', { name: 'Resumen de reserva' }).getByRole('button', { name: 'Ver detalle', exact: true }).click();
  await same;
  console.log('PASS: huésped nuevo, respuesta perdida y doble clic; una sola reserva recuperable por el BFF.');
  await fresh.close();
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
