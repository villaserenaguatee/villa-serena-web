const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.RECEPTION_TEST_URL ?? 'http://localhost:3027';
const reproduce = process.argv.includes('--reproduce');
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of (process.argv.includes('--mobile') ? [{ width: 390, height: 844 }] : [{ width: 1440, height: 1000 }, { width: 390, height: 844 }])) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      const dialogs = [], errors = [];
      page.on('dialog', async d => { dialogs.push(d.message()); await d.accept(); });
      page.on('pageerror', e => errors.push(e.message));
      const initialSession = page.waitForResponse(r => r.url().endsWith('/api/auth/yo'));
      await page.goto(`${base}/panel/login`, { waitUntil: 'domcontentloaded' });
      await initialSession;
      await page.getByLabel('Correo').fill('recepcion@villaserena.gt');
      await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      await page.getByRole('heading', { name: 'Panel del personal' }).waitFor().catch(async e => { throw new Error(`${e.message}\n${page.url()}\n${await page.locator('body').innerText()}`); });
      await page.goto(`${base}/recepcion/habitaciones`, { waitUntil: 'domcontentloaded' });
      const dirty = page.locator('[data-room="102"]');
      await dirty.waitFor();
      if (await dirty.getByRole('button', { name: 'Marcar sucia' }).count()) {
        await dirty.getByRole('button', { name: 'Marcar sucia' }).click();
      }
      await dirty.getByText(/Sucia/).waitFor();
      const clean = (await page.request.get(`${base}/api/habitaciones`)).json();
      const cleanRoom = (await clean).find(r => r.ocupacion === 'LIBRE' && r.condicion === 'LIMPIA' && r.numero === '201');
      assert.ok(cleanRoom, '201 debe estar libre y limpia en el BFF');
      for (const number of ['102', '201']) {
        await page.goto(`${base}/recepcion`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: viewport.width < 1024 ? /Día/ : /^Vista del día/ }).first().click();
        const calendar = page.getByRole('region', { name: 'Calendario de reservas', exact: true });
        await calendar.getByRole('button', { name: 'Nueva reserva', exact: true }).click();
        await page.getByPlaceholder('Buscar por nombre…').fill('Ana');
        await page.getByRole('button', { name: /^Ana Morales/ }).click();
        await page.getByRole('button', { name: new RegExp(`^Habitación ${number}`) }).click();
        await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
        await page.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
        await page.getByRole('heading', { name: 'Reserva confirmada', exact: true }).waitFor();
        const before = await page.evaluate(() => localStorage.getItem('vs-reservas'));
        const created = JSON.parse(before)[0];
        await page.getByRole('button', { name: 'Ver reserva / realizar check-in', exact: true }).click();
        dialogs.length = 0;
        const roomsBefore = await page.evaluate(() => localStorage.getItem('vs-habitaciones'));
        if (!reproduce && number === '201') {
          // Fallo del servicio: no recurrir al estado local antiguo.
          await page.route('**/api/habitaciones?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ mensaje: 'Consulta de habitaciones no disponible' }) }));
          await page.getByRole('button', { name: 'Realizar check-in', exact: true }).click();
          for (let n = 0; !dialogs.length && n < 100; n++) await page.waitForTimeout(50);
          assert.match(dialogs[0], /no disponible/);
          assert.equal(await page.evaluate(() => localStorage.getItem('vs-reservas')), before);
          assert.equal(await page.evaluate(() => localStorage.getItem('vs-habitaciones')), roomsBefore);
          await page.unroute('**/api/habitaciones?*');
          dialogs.length = 0;
        }
        await page.getByRole('button', { name: 'Realizar check-in', exact: true }).click();
        if (reproduce) {
          await page.waitForFunction(id => JSON.parse(localStorage.getItem('vs-reservas')).find(r => r.id === id).estado === 'en-curso', created.id);
          assert.equal(dialogs.length, 0);
          console.log(`REPRODUCIDO ${viewport.width}: habitación 102 SUCIA en BFF, check-in aceptado`);
          break;
        }
        if (number === '102') {
          await page.waitForFunction(() => true);
          for (let n = 0; !dialogs.length && n < 100; n++) await page.waitForTimeout(50);
          assert.match(dialogs[0], /sucia/i);
          assert.equal(await page.evaluate(() => localStorage.getItem('vs-reservas')), before);
          assert.equal(await page.evaluate(() => localStorage.getItem('vs-habitaciones')), roomsBefore);
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.getByRole('button', { name: viewport.width < 1024 ? /Día/ : /^Vista del día/ }).first().click();
          await calendar.getByRole('button', { name: `${created.codigo}, Confirmada`, exact: true }).click();
          await page.getByRole('region', { name: 'Resumen de reserva' }).getByRole('button', { name: 'Ver detalle' }).click();
          dialogs.length = 0;
          await page.getByRole('button', { name: 'Realizar check-in', exact: true }).click();
          for (let n = 0; !dialogs.length && n < 100; n++) await page.waitForTimeout(50);
          assert.match(dialogs[0], /sucia/i);
        } else {
          await page.waitForFunction(id => JSON.parse(localStorage.getItem('vs-reservas')).find(r => r.id === id).estado === 'en-curso', created.id);
          assert.equal(dialogs.length, 0);
          await page.reload({ waitUntil: 'domcontentloaded' });
          assert.equal(await page.evaluate(id => JSON.parse(localStorage.getItem('vs-reservas')).find(r => r.id === id).estado, created.id), 'en-curso');
        }
      }
      assert.deepEqual(errors, []);
      console.log(`PASS ${viewport.width}: comprobación con datos de prueba`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
