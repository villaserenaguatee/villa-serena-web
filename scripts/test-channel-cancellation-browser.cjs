const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.RECEPTION_TEST_URL ?? 'http://localhost:3026';
const reproduce = process.argv.includes('--reproduce');
let browser;
async function openCalendar(page, code) {
  await page.goto(`${base}/recepcion`);
  const calendar = page.getByRole('region', { name: 'Calendario de reservas', exact: true });
  const detail = await (await page.request.get(`${base}/api/reservas/${code}`)).json();
  const month = detail.entrada.slice(0, 7);
  if (!(await calendar.innerText()).includes(month)) await calendar.getByRole('button', { name: 'Período siguiente' }).click();
  await calendar.getByRole('button', { name: `${code}, Confirmada`, exact: true }).click();
  await calendar.getByRole('region', { name: 'Resumen de reserva' }).getByRole('button', { name: 'Ver detalle', exact: true }).click();
}
(async () => {
  browser = await chromium.launch({ headless: true });
  for (const [name, viewport] of [['computadora', { width: 1440, height: 1000 }], ['movil', { width: 390, height: 844 }]]) {
    const context = await browser.newContext({ viewport }); context.setDefaultTimeout(30000);
    const page = await context.newPage(), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/panel/login`);
    await page.getByLabel('Correo', { exact: true }).fill('recepcion@villaserena.gt');
    await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
    for (const code of (reproduce ? ['VS-CANA01'] : ['VS-CANA01', 'VS-CANA02'])) {
      await page.goto(`${base}/recepcion/reservas/${code}`);
      const detail = page.getByRole('dialog', { name: 'Detalle de reserva' });
      await detail.getByRole('heading', { name: 'Historial de estados' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Cancelar reserva', exact: true }).count(), 0);
      await detail.getByRole('button', { name: 'Ver cuenta', exact: true }).click();
      await page.getByRole('button', { name: 'Cuenta y pagos', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
      await openCalendar(page, code);
      const cancel = page.getByRole('button', { name: 'Cancelar reserva', exact: true });
      if (reproduce) { await cancel.waitFor(); console.log(`REPRODUCIDO ${name}: ${code} vuelve a mostrar Cancelar desde el calendario.`); continue; }
      assert.equal(await cancel.count(), 0);
      await page.reload(); await openCalendar(page, code);
      assert.equal(await cancel.count(), 0);
      // Copia guardada por la versión anterior: no tenía el canal.
      await page.evaluate(code => {
        const records = JSON.parse(localStorage.getItem('vs-reservas'));
        const reservation = records.find(r => r.codigo === code); delete reservation.canal;
        localStorage.setItem('vs-reservas', JSON.stringify(records));
      }, code);
      await page.reload(); await openCalendar(page, code);
      await page.getByRole('dialog', { name: 'Detalle de reserva' }).getByRole('heading', { name: 'Historial de estados' }).waitFor();
      assert.equal(await cancel.count(), 0);
      const rejection = await context.request.post(`${base}/api/reservas/${code}/cancelar`, { headers: { Origin: base }, data: { motivo: 'Comprobación de prueba' } });
      assert.equal(rejection.status(), 409); assert.equal((await rejection.json()).codigo, 'CANAL_NO_CANCELABLE');
      assert.equal((await (await context.request.get(`${base}/api/reservas/${code}`)).json()).estado, 'CONFIRMADA');
      console.log(`PASS ${name}: ${code}, detalle, cuenta, calendario, recarga, copia antigua y rechazo del BFF.`);
    }
    if (!reproduce) for (const code of ['VS-TEST04', 'VS-PAGO01']) {
      await page.goto(`${base}/recepcion/reservas/${code}`);
      const detail = page.getByRole('dialog', { name: 'Detalle de reserva' });
      await detail.getByRole('heading', { name: 'Historial de estados' }).waitFor();
      await detail.getByRole('button', { name: 'Cancelar reserva', exact: true }).waitFor();
      await detail.getByRole('button', { name: 'Ver cuenta', exact: true }).click();
      await page.getByRole('button', { name: 'Cuenta y pagos', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
      await openCalendar(page, code);
      await page.getByRole('button', { name: 'Cancelar reserva', exact: true }).waitFor();
      await page.reload(); await openCalendar(page, code);
      await page.getByRole('button', { name: 'Cancelar reserva', exact: true }).waitFor();
      await page.evaluate(code => {
        const records = JSON.parse(localStorage.getItem('vs-reservas'));
        delete records.find(r => r.codigo === code).canal;
        localStorage.setItem('vs-reservas', JSON.stringify(records));
      }, code);
      await page.reload(); await openCalendar(page, code);
      await page.getByRole('dialog', { name: 'Detalle de reserva' }).getByRole('button', { name: 'Cancelar reserva', exact: true }).waitFor();
      console.log(`PASS ${name}: ${code} mantiene Cancelar en detalle y calendario tras recargar.`);
    }
    assert.deepEqual(errors, []); await context.close();
  }
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { if (browser) await browser.close(); });
