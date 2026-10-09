// Prueba web → BFF → API falso. No acredita integración con Spring real.
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const { mkdirSync, createWriteStream } = require('node:fs');
const { chromium } = require('playwright');
const port = Number(process.env.ACCOUNT_CONNECTED_PORT ?? 3124), apiPort = port + 1;
const base = `http://localhost:${port}`, code = 'VS-ABC123', artifacts = '/tmp/villa-serena-cuenta-connected';
let api, next, browser, checkoutCalls = 0, block = false, fail = false;
const errors = [], calls = [];
const date = '2026-10-08T16:00:00Z';
const employee = role => ({ id: 2, nombre: 'Recepción de prueba', correo: 'recepcion@example.test', rol: role, area: null, debeCambiarContrasena: false });
const charge = (id, tipo, concepto, monto, estado = 'VIGENTE') => ({ id, tipo, concepto, monto, cantidad: 1, precioUnitario: monto, fechaHora: date, estado, motivoAnulacion: estado === 'ANULADO' ? 'Duplicado' : null, responsable: 'Recepción de prueba', anuladoPor: estado === 'ANULADO' ? 'Ana' : null });
const initial = () => ({ codigoReserva: code, estadoReserva: 'EN_ESTADIA', estadoCuenta: 'ABIERTA', nombreHuesped: 'Ana Morales', detalleNoches: [{ fecha: '2026-10-07', precio: 600, temporada: null, finDeSemana: false }], totalCargosVigentes: 725, totalPagosAprobados: 600, saldo: 125, facturaId: null, cargos: [charge(1, 'ALOJAMIENTO', 'Alojamiento', 600), charge(2, 'SERVICIO', 'Restaurante', 125), charge(3, 'SERVICIO', 'Lavandería', 50, 'ANULADO')], pagos: [{ id: 1, fechaHora: date, metodo: 'STRIPE', monto: 600, estado: 'APROBADO', referencia: null, responsable: 'Stripe' }, { id: 2, fechaHora: date, metodo: 'STRIPE', monto: 50, estado: 'FALLIDO', referencia: null, responsable: 'Stripe' }] });
let account = initial(), invoice;
function totals() { account.totalCargosVigentes = account.cargos.filter(c => c.estado === 'VIGENTE').reduce((n, c) => n + c.monto, 0); account.saldo = account.totalCargosVigentes - account.totalPagosAprobados; }
async function jsonBody(req) { const chunks = []; for await (const c of req) chunks.push(c); return JSON.parse(Buffer.concat(chunks)); }
async function login(context, role = 'RECEPCION') {
  const response = await context.request.post(`${base}/api/auth/login`, { headers: { Origin: base }, data: { correo: role, contrasena: 'de-prueba' } });
  assert.equal(response.status(), 200); return context.newPage();
}
(async () => {
  mkdirSync(artifacts, { recursive: true });
  api = createServer(async (req, res) => {
    const path = new URL(req.url, base).pathname;
    const send = (value, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(value)); };
    try {
      if (path.endsWith('/auth/login')) { const value = await jsonBody(req); return send({ accessToken: value.correo, refreshToken: 'refresh-test', tipoToken: 'Bearer', expiraEn: 900, empleado: employee(value.correo) }); }
      if (path.endsWith('/auth/yo')) return send(employee(req.headers.authorization?.slice(7)));
      assert.equal(req.headers.authorization, 'Bearer RECEPCION');
      calls.push({ method: req.method, path });
      if (path === `/api/v1/cuentas/${code}`) return send(account);
      if (path.endsWith('/cargos') && req.method === 'POST') { const value = await jsonBody(req); account.cargos.push({ ...charge(4, 'SERVICIO', value.concepto, value.cantidad * value.precioUnitario), cantidad: value.cantidad, precioUnitario: value.precioUnitario }); totals(); return send(account.cargos.at(-1), 201); }
      if (path.endsWith('/cargos/4/anular')) { const value = await jsonBody(req); assert.ok(value.motivo); Object.assign(account.cargos.at(-1), { estado: 'ANULADO', motivoAnulacion: value.motivo, anuladoPor: 'Ana' }); totals(); return send(account.cargos.at(-1)); }
      if (path === `/api/v1/checkout/${code}` && req.method === 'GET') return send({ codigoReserva: code, saldo: account.saldo, nombreCompradorSugerido: 'Ana Morales', pedidoEnCamino: block, pedidosACancelar: [12], puedeConfirmar: !block, motivosBloqueo: block ? ['Pedido en camino'] : [] });
      if (path === `/api/v1/checkout/${code}` && req.method === 'POST') {
        checkoutCalls++; const value = await jsonBody(req);
        assert.equal(value.comprador.nit, 'CF'); assert.equal(value.comprador.nombreComprador, 'Ana Morales');
        if (account.saldo > 0) { assert.deepEqual(value.pago, { metodo: 'EFECTIVO', referencia: 'REC-12' }); assert.equal(value.pago.monto, undefined); }
        else assert.equal(value.pago, undefined);
        if (fail) return send({ codigo: 'FACTURA_ERROR', mensaje: 'No se pudo emitir la factura; no se cobró el pago.' }, 409);
        if (account.saldo) account.pagos.push({ id: 3, fechaHora: date, metodo: value.pago.metodo, monto: account.saldo, estado: 'APROBADO', referencia: value.pago.referencia, responsable: 'Recepción' });
        account.totalPagosAprobados = account.totalCargosVigentes;
        Object.assign(account, { saldo: 0, estadoCuenta: 'CERRADA', estadoReserva: 'FINALIZADA', facturaId: 1 });
        invoice = { id: 1, estado: 'EMITIDA', serie: 'VS-A', numero: 1, emitidaEn: date, codigoReserva: code, hotel: { nombre: 'Hotel de prueba', nombreComercial: 'Hotel del API', razonSocial: 'Empresa del API', nit: '1234567-9', direccionFiscal: 'Dirección fiscal de prueba', correo: 'hotel@example.test', telefono: '55550000' }, comprador: value.comprador, cargos: account.cargos.filter(c => c.estado === 'VIGENTE'), pagos: account.pagos.filter(p => p.estado === 'APROBADO'), total: account.totalCargosVigentes, leyendaIva: 'IVA incluido', leyendaLegal: 'Factura de demostración — no válida ante la SAT' };
        return send({ codigoReserva: code, estadoReserva: 'FINALIZADA', estadoCuenta: 'CERRADA', saldo: 0, factura: invoice });
      }
      if (path === '/api/v1/facturas/1') return send(invoice);
      return send({ mensaje: 'No encontrado' }, 404);
    } catch (e) { errors.push(e.message); send({ mensaje: e.message }, 500); }
  });
  await new Promise(resolve => api.listen(apiPort, '127.0.0.1', resolve));
  next = spawn(process.execPath, [require.resolve('next/dist/bin/next'), 'dev', '--port', String(port)], { env: { ...process.env, STAFF_AUTH_MODE: 'spring', API_URL: `http://127.0.0.1:${apiPort}` }, stdio: ['ignore', 'pipe', 'pipe'] });
  const log = createWriteStream(`${artifacts}/next.log`); next.stdout.pipe(log); next.stderr.pipe(log);
  let ready = false;
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`${base}/panel/login`)).ok) { ready = true; break; } } catch {} await new Promise(resolve => setTimeout(resolve, 500)); }
  assert.ok(ready, 'Next no arrancó');
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext(), page = await login(context);
  page.on('pageerror', e => errors.push(e.message));
  const accountUrl = `${base}/panel/recepcion/reservas/${code}/cuenta`;
  await page.goto(accountUrl); await page.getByTestId('account-balance').waitFor();
  assert.equal(await page.getByTestId('account-balance').innerText(), 'Q 125.00');
  await page.getByText('Anulado: Duplicado · Ana', { exact: true }).waitFor();
  await page.getByRole('button', { name: 'Agregar cargo', exact: true }).click();
  await page.getByLabel('Cantidad', { exact: true }).fill('2'); await page.getByLabel('Precio unitario (Q)', { exact: true }).fill('25');
  await page.getByRole('button', { name: 'Guardar cargo', exact: true }).click();
  await page.getByTestId('account-balance').filter({ hasText: 'Q 175.00' }).waitFor();
  await page.getByRole('button', { name: 'Anular Restaurante', exact: true }).last().click();
  await page.getByLabel('Motivo de anulación').fill('Error de registro'); await page.getByRole('button', { name: 'Confirmar anulación' }).click();
  await page.getByTestId('account-balance').filter({ hasText: 'Q 125.00' }).waitFor();
  block = true; await page.getByRole('button', { name: 'Realizar check-out' }).click();
  await page.getByText(/Hay un pedido en camino/).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Confirmar y emitir factura' }).isDisabled(), true);
  await page.getByRole('button', { name: 'Volver a la cuenta' }).click(); block = false;
  await page.getByRole('button', { name: 'Realizar check-out' }).click();
  await page.getByLabel('Consumidor Final', { exact: true }).uncheck(); await page.getByLabel('NIT', { exact: true }).fill('14-1');
  assert.equal(await page.getByRole('button', { name: 'Confirmar y emitir factura' }).isDisabled(), true); assert.equal(checkoutCalls, 0);
  await page.getByLabel('Consumidor Final', { exact: true }).check(); await page.getByLabel('Referencia (opcional)').fill('REC-12');
  fail = true; await page.getByRole('button', { name: 'Confirmar y emitir factura' }).click();
  await page.getByRole('dialog').getByRole('alert').getByText(/No se pudo emitir/).waitFor();
  assert.equal(account.estadoReserva, 'EN_ESTADIA'); assert.equal(account.saldo, 125);
  fail = false; await page.getByRole('button', { name: 'Confirmar y emitir factura' }).dblclick();
  await page.getByRole('link', { name: 'Ver factura e imprimir' }).waitFor(); assert.equal(checkoutCalls, 2);
  assert.equal(await page.getByTestId('account-balance').innerText(), 'Q 0.00');
  await page.getByRole('link', { name: 'Ver factura e imprimir' }).click(); await page.locator('main article').waitFor();
  await page.getByRole('heading', { name: 'Hotel del API' }).waitFor();
  assert.equal(await page.locator('main article').getByText('Lavandería', { exact: true }).count(), 0);
  for (const format of ['ticket', 'letter']) {
    await page.getByLabel('Formato de impresión').selectOption(format);
    await page.screenshot({ path: `${artifacts}/${format}.png`, fullPage: true });
    await page.emulateMedia({ media: 'print' });
    assert.equal(await page.locator('main').isVisible(), false);
    const paper = page.locator('body > .invoice-print article'); assert.equal(await paper.isVisible(), true);
    assert.equal(await paper.evaluate(e => e.scrollWidth > e.clientWidth), false);
    if (format === 'ticket') assert.ok(Math.abs(await paper.evaluate(e => e.getBoundingClientRect().width) - 72 * 96 / 25.4) < 1);
    await page.pdf({ path: `${artifacts}/${format}.pdf`, preferCSSPageSize: true }); await page.emulateMedia({ media: 'screen' });
  }
  await page.reload(); await page.locator('main article').waitFor();
  assert.equal(await page.evaluate(() => localStorage.getItem('vs-demo-cuenta-obj4c')), null);
  account = initial(); account.saldo = 0; account.totalPagosAprobados = 725;
  await page.goto(accountUrl); await page.getByRole('button', { name: 'Realizar check-out' }).click();
  await page.getByRole('dialog').waitFor(); assert.equal(await page.getByLabel('Método de pago', { exact: true }).count(), 0);
  await page.getByRole('button', { name: 'Confirmar y emitir factura' }).click(); await page.getByRole('link', { name: 'Ver factura e imprimir' }).waitFor();
  assert.equal(checkoutCalls, 3);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: `${artifacts}/mobile.png`, fullPage: true });
  const denied = await browser.newContext(); await login(denied, 'ADMIN');
  const count = calls.length;
  for (const path of [`cuentas/${code}`, `checkout/${code}`, 'facturas/1']) assert.equal((await denied.request.get(`${base}/api/${path}`)).status(), 403);
  assert.equal(calls.length, count);
  assert.equal((await context.request.post(`${base}/api/checkout/${code}`, { headers: { Origin: 'https://ajeno.test' }, data: {} })).status(), 403);
  assert.deepEqual(errors, []);
  console.log('PASS cuenta conectada con API falso: cargos, anulación, bloqueos, NIT, CF, errores, doble envío, saldo cero, factura del servidor, impresión y permisos. Spring real pendiente.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); next?.kill('SIGTERM'); api?.closeAllConnections(); api?.close(); });
