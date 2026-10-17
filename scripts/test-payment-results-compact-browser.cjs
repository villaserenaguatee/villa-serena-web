const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PUBLIC_TEST_BASE_URL ?? 'http://localhost:3033';
(async () => {
  const browser = await chromium.launch(); fs.mkdirSync('.data/issue33-evidence', { recursive: true });
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage(); page.setDefaultTimeout(60000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.clock.install();
      let creates = 0; page.on('request', r => { if (r.method() === 'POST' && new URL(r.url()).pathname === '/api/publico/reservas') creates++; });
      for (const [code, title, retry] of [['VS-DEMO01','Tu reserva está confirmada',false], ['VS-DEMO02','Pago en proceso',true], ['VS-DEMO03','Pago no completado',true], ['VS-DEMO04','Pago no completado',false]]) {
        await page.goto(`${base}/reserva/resultado?codigo=${code}&paid=true`, { waitUntil: 'domcontentloaded' });
        await page.getByRole('heading', { name: title, exact: true }).waitFor();
        assert.equal(await page.locator('.payment-result-summary > div').count(), 3);
        assert.equal(await page.getByRole('button', { name: 'Reintentar pago', exact: true }).count(), retry ? 1 : 0);
        assert.equal(await page.getByRole('link', { name: 'Ver mi reserva' }).count(), 0);
        const actions = await page.locator('.payment-status-actions button, .payment-status-actions a').allTextContents();
        if (code === 'VS-DEMO02') assert.deepEqual(actions, ['Consultar estado', 'Reintentar pago']);
        if (code === 'VS-DEMO03') assert.deepEqual(actions, ['Reintentar pago', 'Consultar estado']);
        if (code === 'VS-DEMO04') {
          assert.deepEqual(actions, ['Hacer nueva reserva']);
          assert.equal(await page.getByRole('link', { name: 'Hacer nueva reserva', exact: true }).getAttribute('href'), '/catalogo');
        }
        assert.ok(!/PAGO DE PRUEBA|integración|simulación/i.test(await page.locator('main').innerText()));
        assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
        if (code === 'VS-DEMO02') {
          await page.clock.fastForward(61000);
          await page.getByRole('heading', { name: 'Pago en proceso', exact: true }).waitFor();
          let release; const gate = new Promise(resolve => release = resolve);
          await page.route(`**/api/publico/reservas/${code}/estado`, async route => { await gate; await route.continue(); });
          await page.getByRole('button', { name: 'Consultar estado', exact: true }).click();
          await page.getByRole('button', { name: 'Consultando…', exact: true }).waitFor();
          release(); await page.getByRole('status').filter({ hasText: 'Estado actualizado.' }).waitFor();
          await page.unroute(`**/api/publico/reservas/${code}/estado`);
        }
        await page.screenshot({ path: `.data/issue33-evidence/${code}-${viewport.width}.png`, fullPage: true });
        if (retry) {
          const request = page.waitForRequest(r => r.method() === 'POST' && new URL(r.url()).pathname === `/api/publico/reservas/${code}/pago`);
          await page.getByRole('button', { name: 'Reintentar pago', exact: true }).click(); await request;
          await page.waitForURL(url => url.searchParams.get('codigo') === code && !url.searchParams.has('paid'));
          await page.getByRole('heading', { name: title, exact: true }).waitFor();
        }
      }
      // Respuesta del contrato sin alterar los cuatro ejemplos persistidos.
      const statusRoute = '**/api/publico/reservas/VS-DEMO03/estado';
      await page.route(statusRoute, route => route.fulfill({ headers: { 'X-Villa-Serena-Mode': 'demo' }, json: { codigo: 'VS-DEMO03', estadoReserva: 'PENDIENTE_PAGO', estadoPago: 'FALLIDO', puedeReintentar: true } }));
      await page.goto(`${base}/reserva/resultado?codigo=VS-DEMO03`, { waitUntil: 'domcontentloaded' });
      await page.getByText('Venció el intento de pago.', { exact: false }).waitFor();
      assert.ok(!/rechazo bancario|banco rechaz/i.test(await page.locator('main').innerText()));
      await page.unroute(statusRoute);
      await page.route(statusRoute, route => route.fulfill({ headers: { 'X-Villa-Serena-Mode': 'demo' }, json: { codigo: 'VS-DEMO03', estadoReserva: 'CANCELADA', estadoPago: 'FALLIDO', puedeReintentar: false } }));
      let paymentRequests = 0;
      page.on('request', r => { if (r.method() === 'POST' && new URL(r.url()).pathname.endsWith('/pago')) paymentRequests++; });
      await page.getByRole('button', { name: 'Reintentar pago', exact: true }).click();
      await page.getByRole('link', { name: 'Hacer nueva reserva', exact: true }).waitFor();
      assert.equal(paymentRequests, 0, 'Una respuesta actualizada que prohíbe reintentar impide enviar el pago');
      assert.equal(creates, 0); assert.deepEqual(errors, []);
      console.log(`${viewport.width}px: cuatro ejemplos, consulta visible, minuto pendiente y reintento de la misma reserva correctos.`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
