const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.RECEPTION_TEST_URL ?? 'http://localhost:3031';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage();
      page.setDefaultTimeout(60000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const initial = page.waitForResponse(r => r.url().endsWith('/api/auth/yo'));
      await page.goto(`${base}/panel/login`, { waitUntil: 'domcontentloaded' }); await initial;
      await page.getByLabel('Correo', { exact: true }).fill('recepcion@villaserena.gt');
      await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
      const calendarResponse = page.waitForResponse(r => r.url().includes('/api/reservas/calendario?') && r.status() === 200);
      await page.goto(`${base}/recepcion`, { waitUntil: 'domcontentloaded' });
      const data = await (await calendarResponse).json();
      const calendar = page.getByRole('region', { name: 'Calendario de reservas', exact: true });
      await calendar.locator('[data-reservation-code]').first().waitFor();
      const codes = async () => [...new Set(await calendar.locator('[data-reservation-code]').evaluateAll(nodes => nodes.map(n => n.dataset.reservationCode)))].sort();
      const monthCodes = await codes();
      assert.deepEqual(monthCodes, data.reservas.filter(r => r.habitacionId).map(r => r.codigo).sort());
      assert.equal(await calendar.getByRole('region', { name: 'Reservas sin habitación asignada' }).count(), 0);
      const first = data.reservas.find(r => r.habitacionId);
      await calendar.locator(`[data-reservation-code="${first.codigo}"]`).first().click();
      const detail = page.getByRole('dialog', { name: 'Detalle de reserva' });
      await detail.getByRole('heading', { name: 'Historial de estados' }).waitFor();
      assert.ok((await detail.innerText()).includes(first.huespedPrincipal));
      await detail.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
      await calendar.getByRole('button', { name: 'Habitaciones', exact: true }).click();
      await calendar.getByRole('table').locator('[data-reservation-code]').first().waitFor();
      assert.deepEqual(await codes(), monthCodes);
      assert.ok((await calendar.innerText()).includes('Piso 1'));
      const table = calendar.getByRole('table', { name: 'Reservas por habitación y día' });
      const from = new Date(`${data.desde}T12:00:00Z`);
      const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
      await table.getByRole('columnheader', { name: `${weekdays[from.getUTCDay()]} ${from.getUTCDate()}`, exact: true }).waitFor();
      assert.equal(await table.locator('[colspan]').count(), new Set(data.grupos.flatMap(g => g.habitaciones.map(h => h.piso))).size);
      assert.equal(await table.locator('.ec-event').count(), 0);
      const group = data.grupos.find(g => g.habitaciones.some(h => h.id === first.habitacionId));
      const room = group.habitaciones.find(h => h.id === first.habitacionId);
      await calendar.getByLabel('Piso del calendario').selectOption(String(room.piso));
      await calendar.getByLabel('Categoría del calendario').selectOption(group.tipoHabitacion.nombre);
      await calendar.getByRole('table').locator('[data-reservation-code]').first().waitFor();
      assert.equal(await table.locator('[colspan]').count(), 0);
      const filteredRooms = group.habitaciones.filter(h => h.piso === room.piso);
      assert.deepEqual(await table.locator('tbody tr th[scope="row"]').allTextContents(), filteredRooms.sort((a,b) => a.numero.localeCompare(b.numero)).map(h => `Hab. ${h.numero}`));
      const filteredCodes = await codes();
      const expected = data.reservas.filter(r => r.tipoHabitacionId === group.tipoHabitacion.id &&
        r.habitacionId && group.habitaciones.some(h => h.id === r.habitacionId && h.piso === room.piso)).map(r => r.codigo).sort();
      assert.deepEqual(filteredCodes, expected);
      await calendar.locator(`[data-reservation-code="${first.codigo}"]`).first().click();
      await detail.getByRole('heading', { name: 'Historial de estados' }).waitFor();
      assert.ok((await detail.innerText()).includes(first.codigo));
      await detail.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
      await calendar.getByRole('button', { name: 'Mes', exact: true }).click();
      assert.equal(await calendar.getByLabel('Piso del calendario').inputValue(), String(room.piso));
      assert.equal(await calendar.getByLabel('Categoría del calendario').inputValue(), group.tipoHabitacion.nombre);
      assert.deepEqual(await codes(), filteredCodes);
      await calendar.getByLabel('Piso del calendario').selectOption('');
      await calendar.getByLabel('Categoría del calendario').selectOption('');
      const period = await calendar.locator('p[aria-live]').innerText();
      const current = new Date();
      const hotelDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(current);
      const monthName = date => new Intl.DateTimeFormat('es-GT', { month: 'long', timeZone: 'UTC' }).format(date).replace(/^./, letter => letter.toLocaleUpperCase('es-GT'));
      assert.equal(period, monthName(new Date(`${hotelDate}T12:00:00Z`)));
      for (const view of ['Mes', 'Habitaciones']) {
        await calendar.getByRole('button', { name: view, exact: true }).click();
        for (const [button, direction] of [['Período siguiente', 1], ['Período anterior', -1]]) {
          const expectedDate = new Date(`${hotelDate}T12:00:00Z`);
          expectedDate.setUTCDate(1); expectedDate.setUTCMonth(expectedDate.getUTCMonth() + direction);
          await calendar.getByRole('button', { name: button }).click();
          assert.equal(await calendar.locator('p[aria-live]').innerText(), monthName(expectedDate));
          await calendar.getByRole('button', { name: direction === 1 ? 'Período anterior' : 'Período siguiente' }).click();
          assert.equal(await calendar.locator('p[aria-live]').innerText(), period);
        }
      }
      const created = [];
      for (const assigned of [true, false]) {
        await calendar.getByRole('button', { name: '+ Nueva reserva', exact: true }).click();
        const modal = page.getByRole('dialog', { name: 'Nueva reserva' });
        await modal.waitFor();
        await page.getByPlaceholder('Buscar por nombre…').fill('Ana');
        await page.getByRole('button', { name: /^Ana Morales/ }).click();
        const now = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
        const offset = n => new Date(Date.parse(now) + n * 86400000).toISOString().slice(0,10);
        const testOffset = Number(process.env.RECEPTION_TEST_OFFSET ?? 15);
        await page.getByLabel('Entrada', { exact: true }).fill(offset(testOffset));
        await page.getByLabel('Salida', { exact: true }).fill(offset(testOffset + 2));
        if (assigned) await modal.getByRole('button', { name: /^Habitación \d{3}/ }).first().click();
        await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
        const creation = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'POST');
        await page.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
        const response = await creation; assert.equal(response.status(), 201);
        const reservation = await response.json(); created.push({ codigo: reservation.codigo, assigned });
        assert.equal(Boolean(reservation.habitacion), assigned);
        await modal.getByRole('button', { name: 'Hacer otra reserva', exact: true }).click();
      }
      const refreshed = page.waitForResponse(r => r.url().includes('/api/reservas/calendario?') && r.status() === 200);
      await page.reload({ waitUntil: 'domcontentloaded' }); await refreshed;
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const bookingMonth = new Date(Date.parse(today) + Number(process.env.RECEPTION_TEST_OFFSET ?? 15) * 86400000).toISOString().slice(0,7);
      if (bookingMonth !== today.slice(0,7)) {
        const next = page.waitForResponse(r => r.url().includes('/api/reservas/calendario?') && r.status() === 200);
        await calendar.getByRole('button', { name: 'Período siguiente' }).click(); await next;
      }
      for (const { codigo, assigned } of created) {
        if (assigned) await calendar.locator(`[data-reservation-code="${codigo}"]`).first().waitFor();
        else assert.equal(await calendar.locator(`[data-reservation-code="${codigo}"]`).count(), 0);
        const search = await page.request.get(`${base}/api/reservas?codigo=${codigo}`);
        assert.equal(search.status(), 200);
        assert.ok((await search.json()).contenido.some(r => r.codigo === codigo));
        const saved = await page.request.get(`${base}/api/reservas/${codigo}`);
        assert.equal(saved.status(), 200);
        assert.equal(Boolean((await saved.json()).habitacion), assigned);
      }
      const afterCreation = await codes();
      await calendar.getByRole('button', { name: 'Habitaciones', exact: true }).click();
      await calendar.getByRole('table').locator('[data-reservation-code]').first().waitFor();
      assert.deepEqual(await codes(), afterCreation);
      for (const { codigo, assigned } of created) if (!assigned) {
        assert.equal(await calendar.locator(`[data-reservation-code="${codigo}"]`).count(), 0);
        await page.goto(`${base}/recepcion/reservas/${codigo}`, { waitUntil: 'domcontentloaded' });
        await detail.getByRole('heading', { name: 'Historial de estados' }).waitFor();
        assert.ok((await detail.innerText()).includes('Sin asignar'));
        await detail.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
      }
      const returned = page.waitForResponse(r => r.url().includes('/api/reservas/calendario?') && r.status() === 200);
      await page.goto(`${base}/recepcion`, { waitUntil: 'domcontentloaded' }); await returned;
      await calendar.getByRole('button', { name: 'Habitaciones', exact: true }).click();
      await calendar.getByRole('table').locator('[data-reservation-code]').first().waitFor();
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      assert.deepEqual(errors, []);
      require('node:fs').mkdirSync('.data/issue31-evidence', { recursive: true });
      await page.screenshot({ path: `.data/issue31-evidence/rooms-${viewport.width}.png` });
      await calendar.getByRole('button', { name: 'Mes', exact: true }).click();
      await page.screenshot({ path: `.data/issue31-evidence/month-${viewport.width}.png` });
      console.log(`Calendario correcto: ${viewport.width}px, ${monthCodes.length} reservas, filtros y detalle.`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });

