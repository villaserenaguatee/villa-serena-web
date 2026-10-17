const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.RECEPTION_TEST_URL ?? 'http://localhost:3031';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage(); page.setDefaultTimeout(60000);
      const initial = page.waitForResponse(r => r.url().endsWith('/api/auth/yo'));
      await page.goto(`${base}/panel/login`, { waitUntil: 'domcontentloaded' }); await initial;
      await page.getByLabel('Correo', { exact: true }).fill('recepcion@villaserena.gt');
      await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
      const loaded = page.waitForResponse(r => r.url().includes('/api/reservas/calendario?') && r.status() === 200);
      await page.goto(`${base}/recepcion`, { waitUntil: 'domcontentloaded' }); await loaded;
      const calendar = page.getByRole('region', { name: 'Calendario de reservas', exact: true });
      assert.equal(await page.getByText('Datos de prueba · reservas nuevas mediante el BFF', { exact: true }).count(), 0);
      assert.equal(await page.getByRole('link', { name: 'Cuenta, check-out y factura', exact: true }).getAttribute('href'), '/panel/recepcion/reservas/VS-DEMO-4C/cuenta');
      const navigation = calendar.getByRole('group', { name: 'Navegación del calendario' });
      for (const view of ['Mes', 'Habitaciones']) {
        await calendar.getByRole('button', { name: view, exact: true }).click();
        const before = await navigation.locator('p[aria-live]').innerText();
        await navigation.getByRole('button', { name: 'Período siguiente' }).click();
        assert.notEqual(await navigation.locator('p[aria-live]').innerText(), before);
        await navigation.getByRole('button', { name: 'Período anterior' }).click();
        assert.equal(await navigation.locator('p[aria-live]').innerText(), before);
        const positions = await navigation.locator('button, p').evaluateAll(elements => elements.map(el => ({x: el.getBoundingClientRect().x, y: el.getBoundingClientRect().y + el.getBoundingClientRect().height / 2})));
        assert.ok(positions.every((p,i) => !i || (p.x > positions[i-1].x && Math.abs(p.y-positions[0].y) < 2)));
      }
      assert.equal(await calendar.getByRole('button', { name: 'Hoy', exact: true }).count(), 0);
      const newButton = calendar.getByRole('button', { name: '+ Nueva reserva', exact: true });
      const newBox = await newButton.boundingBox();
      const selectorBox = await calendar.getByRole('group', { name: 'Vista del calendario' }).boundingBox();
      const calendarBox = await calendar.boundingBox();
      require('node:fs').writeFileSync(`.data/issue31-evidence/header-${viewport.width}.json`, JSON.stringify({ selectorBox, newBox, navigation: await navigation.boundingBox(), floor: await calendar.getByLabel('Piso del calendario').boundingBox(), category: await calendar.getByLabel('Categoría del calendario').boundingBox() }));
      assert.ok(Math.abs(selectorBox.x + selectorBox.width - newBox.x - newBox.width) < 2);
      const baseline = require('node:fs').existsSync(`.data/issue31-evidence/header-before-${viewport.width}.json`) ? JSON.parse(require('node:fs').readFileSync(`.data/issue31-evidence/header-before-${viewport.width}.json`, 'utf8')) : null;
      if (baseline) {
        for (const key of ['newBox', 'navigation', 'floor', 'category']) {
          const now = key === 'newBox' ? newBox : key === 'navigation' ? await navigation.boundingBox() : await calendar.getByLabel(key === 'floor' ? 'Piso del calendario' : 'Categoría del calendario').boundingBox();
          assert.ok(Math.abs(now.x-baseline[key].x) < 2 && Math.abs(now.y-baseline[key].y) < 2, `Se movió ${key}`);
        }
        console.log(`Selector ${viewport.width}px: antes (${baseline.selectorBox.x}, ${baseline.selectorBox.y}), ahora (${selectorBox.x}, ${selectorBox.y}).`);
      }
      await newButton.click();
      const modal = page.getByRole('dialog', { name: 'Nueva reserva' });
      await modal.waitFor();
      await modal.getByRole('button', { name: 'Cancelar', exact: true }).click();
      await calendar.getByRole('button', { name: 'Habitaciones', exact: true }).click();
      const area = calendar.getByRole('table', { name: 'Reservas por habitación y día' }).locator('..');
      const result = await area.evaluate(el => {
        const header = el.querySelector('thead th:nth-child(2)');
        const corner = el.querySelector('thead th');
        const room = el.querySelector('tbody th[scope="row"]');
        const before = { top: header.getBoundingClientRect().top, left: room.getBoundingClientRect().left, corner: corner.getBoundingClientRect().left };
        el.scrollTop = 200; el.scrollLeft = 350;
        return {
          before, after: { top: header.getBoundingClientRect().top, left: room.getBoundingClientRect().left, corner: corner.getBoundingClientRect().left },
          vertical: el.scrollTop, horizontal: el.scrollLeft, height: el.clientHeight,
          controlsInside: Boolean(el.querySelector('select')),
        };
      });
      assert.ok(result.vertical > 0 && result.horizontal > 0);
      assert.ok(Math.abs(result.before.top - result.after.top) < 2);
      assert.ok(Math.abs(result.before.left - result.after.left) < 2);
      assert.ok(Math.abs(result.before.corner - result.after.corner) < 2);
      assert.equal(result.controlsInside, false);
      assert.ok(result.height <= 640);
      await page.screenshot({ path: `.data/issue31-evidence/scroll-${viewport.width}.png` });
      console.log(`Scroll interno y encabezados fijos correctos: ${viewport.width}x${viewport.height}, altura ${result.height}px.`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
