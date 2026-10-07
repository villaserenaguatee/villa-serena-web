// Ejecutar contra pnpm dev. Cada contexto usa almacenamiento temporal independiente.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const base = process.env.ACCOUNT_TEST_URL ?? 'http://127.0.0.1:3012';
const artifacts = process.env.ACCOUNT_TEST_ARTIFACTS ?? '/tmp/villa-serena-cuenta';
const accountPath = '/panel/recepcion/reservas/VS-DEMO-4C/cuenta';
const storageKey = 'vs-demo-cuenta-obj4c';
let browser;

async function login(context, role = 'recepcion') {
  const page = await context.newPage();
  await page.goto(`${base}/login`);
  await page.getByPlaceholder('Correo electrónico').fill(`${role}@villaserena.gt`);
  await page.getByPlaceholder('Contraseña', { exact: true }).fill('local-test');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.waitForURL(`**/${role}`);
  return page;
}
async function setScenario(page, transform) {
  const value = await page.evaluate(storageKey => JSON.parse(localStorage.getItem(storageKey)), storageKey);
  const next = transform(value);
  await page.evaluate(({ storageKey, next }) => localStorage.setItem(storageKey, JSON.stringify(next)), { storageKey, next });
  await page.goto(`${base}${accountPath}`);
}

(async () => {
  fs.mkdirSync(artifacts, { recursive: true });
  browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, timezoneId: 'UTC' });
  const page = await login(context);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  if (process.argv.includes('--api')) {
    await page.goto(`${base}${accountPath}`);
    await page.getByRole('heading', { name: 'Cuenta pendiente de conexión', exact: true }).waitFor();
    assert.equal(await page.getByTestId('account-balance').count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Realizar check-out', exact: true }).count(), 0);
    assert.equal(await page.evaluate(key => localStorage.getItem(key), storageKey), null);
    console.log('PASS: modo API bloquea la cuenta demo y no persiste datos ni simula check-out.');
    return;
  }
  await page.getByRole('link', { name: 'Cuenta, check-out y factura de demostración' }).click();
  await page.getByTestId('account-balance').waitFor();
  assert.equal(await page.getByTestId('account-balance').innerText(), 'Q 125.00');
  await page.goto(`${base}/panel/recepcion/facturas/DEMO-000001`);
  await page.getByText('Todavía no existe una factura emitida para esta cuenta.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Imprimir', exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Volver a la cuenta' }).click();
  await page.getByText('Anulado: Cargo duplicado · Recepción (demo)', { exact: true }).waitFor();
  // Agregar y anular una línea deja el historial visible y vuelve al saldo inicial.
  await page.getByRole('button', { name: 'Agregar cargo', exact: true }).click();
  await page.getByLabel('Concepto', { exact: true }).selectOption('Estacionamiento');
  await page.getByLabel('Cantidad', { exact: true }).fill('2');
  await page.getByLabel('Precio unitario (Q)', { exact: true }).fill('25');
  await page.getByRole('button', { name: 'Guardar cargo', exact: true }).click();
  assert.equal(await page.getByTestId('account-balance').innerText(), 'Q 175.00');
  await page.getByRole('button', { name: 'Anular Estacionamiento', exact: true }).click();
  await page.getByLabel('Motivo de anulación').fill('Registrado por error');
  await page.getByRole('button', { name: 'Confirmar anulación', exact: true }).click();
  assert.equal(await page.getByTestId('account-balance').innerText(), 'Q 125.00');
  const openAccount = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
  await page.getByLabel('Consumidor Final', { exact: true }).uncheck();
  await page.getByLabel('NIT', { exact: true }).fill('14-1');
  assert.equal(await page.getByRole('button', { name: 'Confirmar y emitir factura' }).isDisabled(), true);
  await page.getByText(/NIT inválido/).waitFor();
  await page.getByLabel('Consumidor Final', { exact: true }).check();
  await page.getByLabel('Referencia (opcional)').fill('REC-TEST');
  await page.getByRole('button', { name: 'Confirmar y emitir factura' }).click();
  await page.getByRole('link', { name: 'Ver factura e imprimir' }).waitFor();
  assert.equal(await page.getByTestId('account-balance').innerText(), 'Q 0.00');
  const closed = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey);
  assert.equal(closed.reservation, 'FINALIZADA');
  assert.equal(closed.payments.filter(p => p.id === 'checkout-demo').length, 1);
  assert.equal(closed.payments.at(-1).cents, 12500);
  await page.getByRole('link', { name: 'Ver factura e imprimir' }).click();
  const invoice = page.locator('main article');
  await invoice.waitFor();
  assert.equal(await invoice.getByText('Lavandería', { exact: true }).count(), 0);
  assert.equal(await invoice.getByText('Estacionamiento', { exact: true }).count(), 0);
  await invoice.getByText('CF — Consumidor Final', { exact: false }).waitFor();
  assert.ok((await invoice.innerText()).includes('Q 1,925.00'));
  // Emular impresión y exportar PDFs con el @page de cada formato.
  for (const format of ['ticket', 'letter']) {
    await page.getByLabel('Formato de impresión').selectOption(format);
    await page.screenshot({ path: path.join(artifacts, `${format}-screen.png`), fullPage: true });
    await page.emulateMedia({ media: 'print' });
    const printed = page.locator('body > .invoice-print');
    assert.equal(await printed.isVisible(), true);
    assert.equal(await page.locator('main').isVisible(), false);
    assert.equal(await printed.getByRole('button').count(), 0);
    const layout = await printed.locator('article').evaluate(element => ({
      width: element.getBoundingClientRect().width,
      fits: Array.from(element.querySelectorAll('.invoice-line')).every(line => {
        const parent = line.getBoundingClientRect();
        return Array.from(line.children).every(child => child.getBoundingClientRect().right <= parent.right + 1);
      }),
      overflow: element.scrollWidth > element.clientWidth,
    }));
    assert.equal(layout.fits, true, `${format}: monto fuera del ancho`);
    assert.equal(layout.overflow, false, `${format}: desbordamiento`);
    if (format === 'ticket') assert.ok(Math.abs(layout.width - 72 * 96 / 25.4) < 1);
    await page.pdf({ path: path.join(artifacts, `${format}.pdf`), preferCSSPageSize: true, displayHeaderFooter: false, printBackground: true });
    await page.emulateMedia({ media: 'screen' });
  }
  await page.reload();
  await page.locator('main article').waitFor();
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), closed);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('link', { name: 'Volver a la cuenta' }).click();
  await page.getByTestId('account-balance').waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  await page.screenshot({ path: path.join(artifacts, 'account-mobile.png'), fullPage: true });
  // Bloqueo de entrega y saldo cero, usando copias del mismo fixture en almacenamiento de prueba.
  await setScenario(page, () => ({ ...openAccount, orders: [{ id: 'delivery', status: 'EN_CAMINO' }] }));
  await page.getByTestId('account-balance').waitFor();
  assert.equal(await page.getByRole('button', { name: 'Realizar check-out', exact: true }).isDisabled(), true);
  await page.getByText(/Hay un pedido en camino/).waitFor();
  await setScenario(page, () => ({ ...openAccount, payments: [{ id: 'approved', date: '2026-10-08T16:00:00Z', method: 'Tarjeta', cents: 192500, status: 'APROBADO' }] }));
  await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
  assert.equal(await page.getByLabel('Método de pago', { exact: true }).count(), 0);
  await page.getByLabel('Consumidor Final', { exact: true }).uncheck();
  await page.getByLabel('NIT', { exact: true }).fill('6-K');
  await page.getByRole('button', { name: 'Confirmar y emitir factura' }).click();
  await page.getByRole('link', { name: 'Ver factura e imprimir' }).waitFor();
  assert.equal(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).payments.length, storageKey), 1);
  await setScenario(page, () => openAccount);
  await page.evaluate(storageKey => {
    const write = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key, value) {
      if (key === storageKey) throw new Error('No se pudo guardar la operación de prueba.');
      return write.call(this, key, value);
    };
  }, storageKey);
  await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar y emitir factura' }).click();
  await page.getByRole('dialog').getByRole('alert').waitFor();
  assert.equal(await page.getByTestId('account-balance').innerText(), 'Q 125.00');
  assert.equal(await page.getByRole('link', { name: 'Ver factura e imprimir' }).count(), 0);
  assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)), storageKey), openAccount);
  assert.equal(errors.length, 0, errors.join('\n'));
  const deniedContext = await browser.newContext();
  const denied = await login(deniedContext, 'mantenimiento');
  await denied.goto(`${base}${accountPath}`);
  await denied.waitForURL('**/login');
  assert.equal(await denied.getByRole('heading', { name: /Cuenta de VS-DEMO/ }).count(), 0);
  console.log('PASS: cargos y anulación, NIT inválido/CF/K, pago único, saldo cero, entrega en camino, factura persistida, impresión 80 mm/carta sin menús ni cortes, móvil y permisos. Solo modo demo.');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(async () => { await browser?.close(); });
