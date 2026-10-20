const { chromium } = require('playwright');
let browser;
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
function range(view, offset = 0) {
  const start = new Date(`${today}T12:00:00Z`);
  let end;
  if (view === 'month') {
    start.setUTCDate(1); start.setUTCMonth(start.getUTCMonth() + offset);
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0, 12));
  } else {
    start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7 + offset * 7);
    end = new Date(start); end.setUTCDate(end.getUTCDate() + 6);
  }
  return `${start.toISOString().slice(0, 10)} — ${end.toISOString().slice(0, 10)}`;
}
(async () => {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, timezoneId: 'UTC' });
  const page = await context.newPage();
  const errors = [];
  const dialogs = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.accept(); });
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`${process.env.RECEPTION_TEST_URL ?? 'http://localhost:3017'}/login`);
  await page.getByPlaceholder('Correo electrónico').fill('recepcion@villaserena.gt');
  await page.getByPlaceholder('Contraseña', { exact: true }).fill('VillaSerena26');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  if (process.argv.includes('--api')) {
    await page.getByRole('heading', { name: 'Recepción pendiente de conexión' }).waitFor();
    require('node:assert/strict').equal(await page.getByRole('heading', { name: 'Calendario de reservas' }).count(), 0);
    console.log('PASS navegador: modo API bloqueado explícitamente, sin reservas demo ni falso éxito.');
    return;
  }
  await page.getByRole('heading', { name: 'Calendario de reservas' }).waitFor();
  await page.getByText('Sin asignar', { exact: true }).waitFor();
  const assert = require('node:assert/strict');
  const calendar = page.getByRole('region', { name: 'Calendario de reservas', exact: true });
  await calendar.getByRole('button', { name: 'Período siguiente' }).click();
  await page.getByText(range('month', 1), { exact: true }).waitFor();
  await calendar.getByRole('button', { name: 'Hoy', exact: true }).click();
  await calendar.getByLabel('Vista del calendario').selectOption('week');
  await page.getByText(range('week'), { exact: true }).waitFor();
  await calendar.getByRole('button', { name: 'Período siguiente' }).click();
  await page.getByText(range('week', 1), { exact: true }).waitFor();
  await calendar.getByRole('button', { name: 'Hoy', exact: true }).click();
  await calendar.getByLabel('Vista del calendario').selectOption('month');
  await calendar.getByRole('button', { name: 'Nueva reserva', exact: true }).click();
  await page.getByPlaceholder('Buscar por nombre…').fill('Ana');
  await page.getByRole('button', { name: /^Ana Morales/ }).click();
  await page.getByRole('button', { name: /^Habitación 102/ }).click();
  await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
  await page.getByRole('heading', { name: 'Reserva confirmada', exact: true }).waitFor();
  const created = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas'))[0]);
  assert.equal(created.estado, 'confirmada');
  assert.equal(created.habitacionId, 'hh-102');
  assert.equal(created.pagos.length, 0);
  await calendar.getByRole('button', { name: `${created.codigo}, Confirmada`, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Ver reserva / realizar check-in', exact: true }).click();
  await page.getByRole('button', { name: 'Realizar check-in', exact: true }).click();
  assert.equal(dialogs.length, 0);
  await page.waitForFunction(id => JSON.parse(localStorage.getItem('vs-reservas')).find(r => r.id === id).estado === 'en-curso', created.id);
  await page.getByRole('button', { name: 'Cerrar detalle de reserva' }).click();
  await page.getByRole('button', { name: /^Vista del día/ }).first().click();
  await calendar.getByRole('button', { name: `${created.codigo}, En curso`, exact: true }).waitFor();
  await page.reload();
  await calendar.getByRole('button', { name: `${created.codigo}, En curso`, exact: true }).waitFor();
  // Un registro independiente, solo en el contexto temporal del navegador de prueba.
  await page.evaluate(({ created }) => {
    const reservations = JSON.parse(localStorage.getItem('vs-reservas'));
    reservations.unshift({ ...created, id: 'browser-dirty-test', codigo: 'VS-BROWSER-DIRTY', estado: 'confirmada', habitacionId: 'hh-104', checkInEn: undefined });
    localStorage.setItem('vs-reservas', JSON.stringify(reservations));
    const rooms = JSON.parse(localStorage.getItem('vs-habitaciones'));
    localStorage.setItem('vs-habitaciones', JSON.stringify(rooms.map(r => r.id === 'hh-104' ? { ...r, estado: 'en-limpieza' } : r)));
  }, { created });
  await page.reload();
  await calendar.getByRole('button', { name: 'VS-BROWSER-DIRTY, Confirmada', exact: true }).click();
  await page.getByRole('button', { name: 'Ver detalle', exact: true }).click();
  dialogs.length = 0;
  await page.getByRole('button', { name: 'Realizar check-in', exact: true }).click();
  assert.match(dialogs[0], /libre y limpia/);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas')).find(r => r.id === 'browser-dirty-test').estado), 'confirmada');
  await page.getByRole('button', { name: 'Cerrar detalle de reserva' }).click();
  await page.getByRole('button', { name: /^Vista del día/ }).first().click();
  await calendar.getByRole('button', { name: 'Nueva reserva', exact: true }).click();
  await page.getByPlaceholder('Buscar por nombre…').fill('Ana');
  await page.getByRole('button', { name: /^Ana Morales/ }).click();
  await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
  await page.getByRole('heading', { name: 'Reserva confirmada', exact: true }).waitFor();
  await page.getByText('Sin asignar', { exact: true }).last().waitFor();
  const unassigned = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas'))[0]);
  assert.equal(unassigned.habitacionId, null);
  assert.equal(unassigned.estado, 'confirmada');
  assert.equal(unassigned.pagos.length, 0);
  await calendar.getByRole('button', { name: `${unassigned.codigo}, Confirmada`, exact: true }).waitFor();
  await page.getByRole('button', { name: 'Hacer otra reserva', exact: true }).click();
  await page.reload();
  await calendar.getByRole('button', { name: `${unassigned.codigo}, Confirmada`, exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('heading', { name: 'Calendario de reservas' }).waitFor();
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  console.log('PASS navegador: navegación mes/semana/Hoy, creación sin pagos visible en Gantt, check-in limpio, persistencia tras recarga, rechazo por habitación no lista, vista móvil. Solo modo demo.');
  assert.equal(errors.length, 0, errors.join('\n'));
  await browser.close();
})().catch(e => { console.error(e); process.exitCode = 1; }).finally(async () => { await browser?.close(); });
