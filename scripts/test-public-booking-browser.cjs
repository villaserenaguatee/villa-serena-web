const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const { chromium } = require('playwright');

const base = process.env.PUBLIC_TEST_BASE_URL || 'http://localhost:3005';
const evidence = '.next-dev/public-booking-evidence';
const day = offset => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const date = new Date(`${parts.find(p => p.type === 'year').value}-${parts.find(p => p.type === 'month').value}-${parts.find(p => p.type === 'day').value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};
async function chooseDate(page, index, value) {
  await page.locator('.availability-modal .vs-date-trigger').nth(index).click();
  const target = new Date(`${value}T12:00:00`);
  const month = target.toLocaleDateString('es-GT', { month: 'long', year: 'numeric' }).toLowerCase();
  const dialog = page.getByRole('dialog', { name: 'Calendario' });
  for (let i = 0; i < 13 && (await dialog.locator('.vs-calendar-head strong').innerText()).toLowerCase() !== month; i++) {
    await dialog.getByRole('button', { name: 'Mes siguiente' }).click();
  }
  assert.equal((await dialog.locator('.vs-calendar-head strong').innerText()).toLowerCase(), month);
  await dialog.locator('.vs-days').getByRole('button', { name: String(target.getDate()), exact: true }).click();
}
async function noOverflow(page) {
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `Desborde horizontal: ${page.url()}`);
}
async function expectPendingPayment(page) {
  await page.getByRole('heading', { name: 'Pago en proceso', exact: true }).waitFor();
  await page.getByText('Pendiente de pago', { exact: true }).waitFor();
  await page.getByText('Pendiente', { exact: true }).waitFor();
  const code = new URL(page.url()).searchParams.get('codigo');
  assert.match(code, /^VS-[A-Z0-9]{6}$/);
  const response = await page.request.get(`${base}/api/publico/reservas/${code}/estado`);
  assert.equal(response.status(), 200);
  assert.equal(response.headers()['x-villa-serena-mode'], 'demo');
  const status = await response.json();
  assert.equal(status.codigo, code);
  assert.equal(status.estadoReserva, 'PENDIENTE_PAGO');
  assert.equal(status.estadoPago, 'PENDIENTE');
}
async function flow(browser, mobile, offset) {
  const context = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, isMobile: mobile, hasTouch: mobile, locale: 'es-GT', timezoneId: 'America/Guatemala' });
  const page = await context.newPage(), calls = [], errors = [];
  page.on('request', request => { if (request.url().startsWith(base + '/api/')) calls.push({ url: request.url(), method: request.method(), body: request.postData() }); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.locator('.availability-search').click();
  await page.getByRole('alert').filter({ hasText: 'Selecciona fechas válidas' }).waitFor();
  assert.equal(calls.filter(c => c.url.includes('disponibilidad') || c.url.includes('/availability')).length, 0);
  await noOverflow(page);
  await page.locator('a[href="/catalogo"]').first().click();
  await page.waitForFunction(() => document.querySelectorAll('.catalog-grid>article').length === 15);
  await noOverflow(page);
  await page.locator('.catalog-grid a.catalog-image-link').first().click();
  await page.getByRole('button', { name: 'Consultar disponibilidad', exact: true }).click();
  await chooseDate(page, 0, day(offset));
  await chooseDate(page, 1, day(offset + 2));
  const check = page.getByRole('button', { name: 'Comprobar disponibilidad', exact: true });
  await check.waitFor();
  await page.waitForFunction(() => !document.querySelector('.availability-button')?.disabled);
  await check.click();
  await page.getByRole('link', { name: 'Reservar habitación', exact: true }).click();
  await page.getByRole('heading', { name: 'Introduce tus datos' }).waitFor();
  await page.getByLabel('Nombre', { exact: true }).fill('   ');
  await page.getByLabel('Apellidos', { exact: true }).fill('Prueba');
  await page.getByLabel('Número de documento', { exact: true }).fill('1234567890123');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(`public-${mobile ? 'mobile' : 'desktop'}@example.test`);
  await page.locator('.phone-number-input').fill('55555555');
  await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Completa todos' }).waitFor();
  assert.equal(calls.filter(c => c.method === 'POST' && c.url.endsWith('/reservas')).length, 0);
  await page.getByLabel('Nombre', { exact: true }).fill('Huésped');
  await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  await page.getByRole('heading', { name: 'Revisa tus datos' }).waitFor();
  await noOverflow(page);
  await page.screenshot({ path: `${evidence}/${mobile ? 'mobile' : 'desktop'}-datos.png`, fullPage: true });
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('heading', { name: 'Pago con tarjeta', exact: true }).waitFor();
  assert.ok(!page.url().includes('public-')); assert.ok(!page.url().includes('documento'));
  assert.equal(await page.locator('input[type="radio"]').count(), 0);
  assert.equal(await page.getByText('Pagar en el hotel', { exact: false }).count(), 0);
  assert.equal(await page.getByText('Transferencia / depósito bancario').count(), 0);
  assert.equal(await page.locator('input[placeholder="0000 0000 0000 0000"]').count(), 0);
  await page.locator('.terms-check input').check();
  await page.waitForFunction(() => !document.querySelector('.checkout-form>.reserve-primary')?.disabled);
  await noOverflow(page);
  await page.screenshot({ path: `${evidence}/${mobile ? 'mobile' : 'desktop'}-resumen.png`, fullPage: true });
  await page.getByRole('button', { name: 'Iniciar pago de prueba', exact: true }).click();
  await expectPendingPayment(page);
  await page.getByText('PAGO DE PRUEBA', { exact: true }).waitFor();
  const code = new URL(page.url()).searchParams.get('codigo'); assert.match(code, /^VS-[A-Z0-9]{6}$/);
  assert.equal(await page.getByText('¡Reserva confirmada!', { exact: true }).count(), 0);
  await noOverflow(page);
  await page.screenshot({ path: `${evidence}/${mobile ? 'mobile' : 'desktop'}-estado.png`, fullPage: true });
  const posts = calls.filter(c => c.method === 'POST' && c.url.includes('/publico/reservas'));
  assert.equal(posts.length, 2);
  const creation = JSON.parse(posts[0].body);
  assert.deepEqual(Object.keys(creation).sort(), ['entrada', 'huesped', 'numeroHuespedes', 'salida', 'tipoHabitacionId']);
  assert.equal(creation.numeroHuespedes, 2);
  await page.reload({ waitUntil: 'networkidle' });
  await expectPendingPayment(page);
  await page.getByRole('button', { name: 'Consultar estado otra vez' }).click();
  await expectPendingPayment(page);
  assert.equal(calls.filter(c => c.method === 'POST' && c.url.includes('/publico/reservas')).length, 2);
  assert.ok(calls.some(c => c.url.endsWith('/hotel'))); assert.ok(calls.some(c => c.url.endsWith('/tipos-habitacion')));
  assert.ok(calls.filter(c => c.url.endsWith(`/${code}/estado`)).length >= 3);
  // Ni los parámetros de regreso ni un fallo de consulta pueden confirmar el pago.
  const stateRoute = `**/api/publico/reservas/${code}/estado`;
  await page.route(stateRoute, route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ codigo: 'SERVICIO_NO_DISPONIBLE', mensaje: 'Consulta de prueba interrumpida.', detalles: [] }) }));
  await page.goto(`${base}/reserva/resultado?codigo=${code}&paid=true&estado=CONFIRMADA`, { waitUntil: 'networkidle' });
  await page.getByRole('heading', { name: 'Estado no disponible' }).waitFor();
  assert.equal(await page.getByText('¡Reserva confirmada!', { exact: true }).count(), 0);
  await page.unroute(stateRoute);
  await page.getByRole('button', { name: 'Consultar estado otra vez' }).click();
  await expectPendingPayment(page);
  assert.equal(calls.filter(c => c.method === 'POST' && c.url.includes('/publico/reservas')).length, 2);
  await page.goto(`${base}/reservar/habitaciones?llegada=${day(offset)}&salida=${day(offset)}&adultos=0&ninos=-1`, { waitUntil: 'networkidle' });
  const searchesBefore = calls.filter(c => c.url.includes('disponibilidad') || c.url.includes('/availability')).length;
  await page.getByRole('alert').filter({ hasText: 'La salida debe ser posterior' }).waitFor();
  await page.getByRole('button', { name: 'Aplicar', exact: true }).click();
  assert.equal(calls.filter(c => c.url.includes('disponibilidad') || c.url.includes('/availability')).length, searchesBefore);
  await page.goto(`${base}/reservar/habitaciones?llegada=${day(offset)}&salida=${day(offset + 2)}&adultos=6&ninos=0`, { waitUntil: 'networkidle' });
  await page.getByRole('alert').filter({ hasText: 'supera la capacidad' }).waitFor();
  assert.equal(calls.filter(c => c.url.includes('disponibilidad') || c.url.includes('/availability')).length, searchesBefore);
  // También la búsqueda por resultados termina únicamente en tarjeta.
  await page.goto(`${base}/reservar/habitaciones?llegada=${day(offset + 10)}&salida=${day(offset + 12)}&adultos=1&ninos=1`, { waitUntil: 'networkidle' });
  await page.locator('.reserve-room-grid article').first().waitFor();
  await noOverflow(page);
  await page.locator('.reserve-room-grid .reserve-view-room').first().click();
  await page.getByRole('button', { name: 'Reservar habitación', exact: true }).click();
  await page.getByRole('heading', { name: 'Introduce tus datos' }).waitFor();
  await page.getByLabel('Nombre', { exact: true }).fill('Tarjeta');
  await page.getByLabel('Apellidos', { exact: true }).fill('Prueba');
  await page.getByLabel('Número de documento', { exact: true }).fill(mobile ? '1234567890125' : '1234567890124');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(`card-${mobile ? 'mobile' : 'desktop'}@example.test`);
  await page.locator('.phone-number-input').fill('55555555');
  await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('heading', { name: 'Pago con tarjeta', exact: true }).waitFor();
  await page.locator('.terms-check input').check();
  await page.getByRole('button', { name: 'Iniciar pago de prueba', exact: true }).click();
  await expectPendingPayment(page);
  assert.match(new URL(page.url()).searchParams.get('codigo'), /^VS-[A-Z0-9]{6}$/);
  assert.equal(calls.filter(c => c.method === 'POST' && c.url.includes('/api/public/bookings')).length, 0);
  assert.deepEqual(errors, []);
  console.log(`${mobile ? 'Móvil' : 'Computadora'}: ambos recorridos solo con tarjeta, validaciones sin búsqueda, pago de prueba y estado BFF aprobados.`);
  await context.close();
}
(async () => {
  mkdirSync(evidence, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try { await flow(browser, false, 45); await flow(browser, true, 48); }
  finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
