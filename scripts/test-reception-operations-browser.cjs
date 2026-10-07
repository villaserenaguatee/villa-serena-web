const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const { mkdirSync } = require('node:fs');
const base = process.env.RECEPTION_TEST_URL ?? 'http://localhost:3008';
let browser;
async function login(page, correo = 'recepcion@villaserena.gt') {
  await page.goto(`${base}/panel/login`);
  await page.getByLabel('Correo', { exact: true }).fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
}
async function open(page, code) {
  await page.goto(`${base}/recepcion/reservas/${code}`);
  const dialog = page.getByRole('dialog', { name: 'Detalle de reserva' });
  await dialog.getByRole('heading', { name: 'Historial de estados' }).waitFor();
  return dialog;
}
async function checkedSearch(page, action) {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.status() === 200);
  await action(); const result = await (await response).json();
  await page.getByText(`${result.totalElementos} reservas`, { exact: true }).waitFor();
  return result;
}
(async () => {
  browser = await chromium.launch({ headless: true });
  mkdirSync('.next-dev/issue8-evidence', { recursive: true });
  for (const [name, viewport] of [['computadora', { width: 1440, height: 1000 }], ['movil', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport }); context.setDefaultTimeout(20000); const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/recepcion/reservas`); await page.waitForURL('**/panel/login');
    await login(page); await page.goto(`${base}/recepcion/reservas`);
    await page.getByText('14 reservas', { exact: true }).waitFor();
    console.log(`${name}: búsqueda cargada`);
    await page.getByLabel('Nombre o documento', { exact: true }).fill('Marta');
    await page.getByLabel('Canal de origen', { exact: true }).selectOption('BOOKING');
    let result = await checkedSearch(page, () => page.getByRole('button', { name: 'Buscar', exact: true }).click());
    assert.equal(result.totalElementos, 1); assert.equal(result.contenido[0].codigo, 'VS-CANA01');
    let dialog = await open(page, 'VS-CANA01');
    await dialog.getByText('Identificador externo: BOOKING-PRUEBA').waitFor();
    assert.equal(await dialog.getByRole('button', { name: 'Cancelar reserva', exact: true }).count(), 0);
    assert.equal((await context.request.post(`${base}/api/reservas/VS-CANA01/cancelar`, { headers: { Origin: base }, data: { motivo: 'Prueba' } })).status(), 409);
    await dialog.getByRole('button', { name: 'Ver cuenta', exact: true }).click();
    await page.getByRole('button', { name: 'Cuenta y pagos', exact: true }).waitFor();
    assert.equal(await page.getByRole('button', { name: 'Cancelar reserva', exact: true }).count(), 0);
    assert.equal(await page.getByRole('button', { name: 'Resumen', exact: true }).count(), 0);
    await page.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
    await page.goto(`${base}/recepcion/reservas`); await page.getByText('14 reservas', { exact: true }).waitFor();
    let searches = 0; const count = req => { if (new URL(req.url()).pathname === '/api/reservas') searches++; }; page.on('request', count);
    await page.getByLabel('Código de reserva', { exact: true }).fill('VS-INVALIDO');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('alert').getByText('Indica el código completo de reserva (VS- y seis letras o números).').waitFor(); assert.equal(searches, 0);
    await page.getByLabel('Código de reserva', { exact: true }).fill('');
    await page.getByLabel('Desde', { exact: true }).fill('2026-11-10'); await page.getByLabel('Hasta', { exact: true }).fill('2026-11-01');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click(); await page.getByRole('alert').getByText('Selecciona un rango de fechas válido.').waitFor(); assert.equal(searches, 0); page.off('request', count);
    await checkedSearch(page, () => page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click());
    result = await checkedSearch(page, () => page.getByRole('button', { name: 'Llegan hoy', exact: true }).click()); assert.ok(result.contenido.every(r => r.estado === 'CONFIRMADA'));
    result = await checkedSearch(page, () => page.getByRole('button', { name: 'Salen hoy', exact: true }).click()); assert.ok(result.contenido.every(r => r.estado === 'EN_ESTADIA'));
    await page.screenshot({ path: `.next-dev/issue8-evidence/${name}-busqueda.png` });
    dialog = await open(page, 'VS-TEST01'); assert.equal(await dialog.getByRole('button', { name: 'Cancelar reserva', exact: true }).count(), 0); assert.equal(await dialog.getByRole('button', { name: 'Cambiar habitación', exact: true }).count(), 0); await dialog.getByRole('button', { name: 'Ir a check-out', exact: true }).waitFor();
    dialog = await open(page, 'VS-TEST05'); assert.equal(await dialog.getByRole('button', { name: 'Cancelar reserva', exact: true }).count(), 0);
    await dialog.getByRole('button', { name: /Asignar habitación|Cambiar habitación/ }).click();
    const select = dialog.getByLabel('Habitación', { exact: true }); await select.waitFor();
    const options = await select.locator('option').evaluateAll(elements => elements.map(e => e.value).filter(Boolean)); assert.ok(options.length);
    await select.selectOption(options[0]); await dialog.getByRole('button', { name: 'Guardar asignación', exact: true }).click(); await dialog.getByRole('status').getByText('Habitación asignada en la simulación.').waitFor();
    dialog = await open(page, 'VS-PAGO03'); await dialog.getByRole('button', { name: 'Cancelar reserva', exact: true }).click(); await dialog.getByText('Resultado calculado por el BFF. Esta prueba no devuelve dinero realmente.').waitFor();
    await dialog.getByLabel('Motivo de cancelación', { exact: true }).fill('Prueba de rechazo'); await dialog.getByRole('button', { name: 'Confirmar cancelación de prueba', exact: true }).click(); await dialog.getByRole('alert').getByText('El reembolso de prueba fue rechazado; la reserva no se canceló. No se devolvió dinero real.').waitFor();
    assert.equal((await (await context.request.get(`${base}/api/reservas/VS-PAGO03`)).json()).estado, 'CONFIRMADA');
    if (name === 'computadora') {
      dialog = await open(page, 'VS-PAGO02'); await dialog.getByRole('button', { name: 'Cancelar reserva', exact: true }).click();
      await dialog.getByText('No corresponde reembolso: faltan menos de 48 horas para las 15:00 de llegada.').waitFor();
      await dialog.getByLabel('Motivo de cancelación', { exact: true }).fill('Sin reembolso de prueba'); await dialog.getByRole('button', { name: 'Confirmar cancelación de prueba', exact: true }).click();
      await dialog.getByRole('status').getByText('Reserva cancelada en la simulación. No se devolvió dinero real.').waitFor();
    }
    const cancelCode = name === 'computadora' ? 'VS-PAGO01' : 'VS-TEST04';
    dialog = await open(page, cancelCode); await dialog.getByRole('button', { name: 'Cancelar reserva', exact: true }).click();
    await dialog.getByLabel('Motivo de cancelación', { exact: true }).fill(`Cancelación simulada ${name}`); await dialog.getByRole('button', { name: 'Confirmar cancelación de prueba', exact: true }).click(); await dialog.getByRole('status').getByText('Reserva cancelada en la simulación. No se devolvió dinero real.').waitFor();
    await dialog.getByText(`Cancelación simulada ${name}`, { exact: true }).waitFor(); assert.equal(await dialog.getByRole('button', { name: 'Cancelar reserva', exact: true }).count(), 0);
    await page.screenshot({ path: `.next-dev/issue8-evidence/${name}-cancelacion.png` });
    result = await checkedSearch(page, () => dialog.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click());
    assert.equal(result.contenido.find(r => r.codigo === cancelCode).estado, 'CANCELADA');
    await page.goto(`${base}/recepcion/habitaciones`); await page.locator('[data-room="101"]').waitFor();
    for (const number of ['101', '104', '110', '209']) assert.equal(await page.locator(`[data-room="${number}"]`).getByRole('button', { name: 'Marcar sucia', exact: true }).count(), 0);
    const number = name === 'computadora' ? '102' : '201';
    await page.locator(`[data-room="${number}"]`).getByRole('button', { name: 'Marcar sucia', exact: true }).click(); await page.getByRole('status').getByText(`Habitación ${number} marcada sucia en la simulación.`).waitFor();
    await page.locator(`[data-room="${number}"]`).getByText('Sucia', { exact: false }).waitFor(); assert.equal(await page.locator(`[data-room="${number}"]`).getByRole('button', { name: 'Marcar sucia', exact: true }).count(), 0);
    await page.getByLabel('Ocupación', { exact: true }).selectOption('LIBRE'); await page.getByLabel('Condición', { exact: true }).selectOption('SUCIA'); await page.getByLabel('Tipo', { exact: true }).selectOption('1'); await page.getByLabel('Piso', { exact: true }).selectOption('2'); await page.locator('[data-room="209"]').waitFor();
    await page.screenshot({ path: `.next-dev/issue8-evidence/${name}-habitaciones.png` });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.equal(await page.evaluate(() => document.cookie.includes('vs_staff_')), false);
    assert.deepEqual(errors, []); await context.close(); console.log(`PASS ${name}: filtros, historial, acciones, canal, asignación, cancelación y habitaciones.`);
  }
  const context = await browser.newContext(), page = await context.newPage(); await login(page, 'admin@villaserena.gt'); await page.goto(`${base}/recepcion/reservas`); await page.getByRole('heading', { name: 'Acceso denegado' }).waitFor(); assert.equal((await context.request.get(`${base}/api/habitaciones`)).status(), 403); await context.close();
  console.log('PASS permisos de página y BFF. Datos de prueba; no se comprobó Stripe ni una devolución real.');
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
