const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PUBLIC_TEST_BASE_URL ?? 'http://localhost:3032';
(async () => {
  const browser = await chromium.launch();
  fs.mkdirSync('.data/issue32-evidence', { recursive: true });
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport });
      const page = await context.newPage(); page.setDefaultTimeout(60000);
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(base, { waitUntil: 'domcontentloaded' });
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const offset = n => new Date(Date.parse(today) + n * 86400000).toISOString().slice(0,10);
      const id = await page.evaluate(({ entrada, salida }) => {
        const id = crypto.randomUUID();
        const params = new URLSearchParams({ habitacion: 'Habitación Estándar', tipoHabitacionId: '1', llegada: entrada, salida, adultos: '2', ninos: '0', nombre: 'Prueba', apellidos: 'Pago', correo: 'issue32@example.test', telefono: '55555555', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', documento: '1234567890123' });
        sessionStorage.setItem('vs-public-booking-draft', JSON.stringify({ id, createdAt: Date.now(), params: params.toString() }));
        return id;
      }, { entrada: offset(viewport.width === 390 ? 17 : 14), salida: offset(viewport.width === 390 ? 19 : 16) });
      const paymentUrl = `${base}/reservar/pago?draft=${id}`;
      await page.goto(paymentUrl, { waitUntil: 'domcontentloaded' });
      await page.locator('.booking-summary-card img').waitFor();
      const button = page.getByRole('button', { name: 'Continuar pago →', exact: true });
      assert.equal(await button.isDisabled(), true);
      assert.equal(await page.locator('.summary-total').count(), 1);
      const summaryBox = await page.locator('.booking-summary-card').boundingBox();
      const formBox = await page.locator('.checkout-form').boundingBox();
      if (viewport.width > 800) {
        assert.ok(Math.abs(summaryBox.y-formBox.y) < 2 && Math.abs(formBox.width-summaryBox.width*2) < 2);
      } else assert.ok(formBox.y >= summaryBox.y + summaryBox.height);
      assert.equal(await page.locator('input').count(), 1);
      assert.equal(await page.locator('.online-payment-head').count(), 0);
      assert.ok(!/simulación|conexión.*pendiente/i.test(await page.locator('.checkout-form').innerText()));
      for (const [text, heading] of [['condiciones de reserva y cancelación', 'Condiciones de reserva y cancelación'], ['política de privacidad', 'Política de privacidad']]) {
        await page.getByRole('button', { name: text, exact: true }).click();
        await page.getByRole('heading', { name: heading, exact: true }).waitFor();
        await page.locator('.legal-modal').getByRole('button', { name: 'Cerrar', exact: true }).click();
      }
      await page.locator('.terms-check input').check();
      await page.waitForFunction(() => !document.querySelector('.checkout-form > .reserve-primary').disabled);
      assert.equal(await button.evaluate(el => Math.round(el.getBoundingClientRect().width)), await page.locator('.checkout-form').evaluate(el => Math.round(el.clientWidth - parseFloat(getComputedStyle(el).paddingLeft) - parseFloat(getComputedStyle(el).paddingRight))));
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: `.data/issue32-evidence/payment-${viewport.width}.png`, fullPage: true });
      let creates = 0;
      page.on('request', request => { if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/publico/reservas') creates++; });
      // La reserva se guarda, pero se interrumpe la solicitud de pago: recuperación con código existente.
      await page.route('**/api/publico/reservas/*/pago', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ mensaje: 'Prueba: pago temporalmente no disponible.' }) }));
      await button.click();
      await page.getByRole('alert').filter({ hasText: 'temporalmente' }).waitFor();
      const savedCode = await page.evaluate(() => JSON.parse(sessionStorage.getItem('vs-public-booking-draft')).attempt.code);
      assert.match(savedCode, /^VS-[A-Z0-9]{6}$/);
      await page.reload({ waitUntil: 'domcontentloaded' });
      const recover = page.getByRole('button', { name: 'Recuperar intento anterior', exact: true });
      await recover.waitFor(); assert.equal(await recover.isDisabled(), true);
      await page.locator('.terms-check input').check();
      await page.unroute('**/api/publico/reservas/*/pago');
      await recover.click();
      await page.getByRole('heading', { name: 'Pago en proceso', exact: true }).waitFor();
      assert.equal(new URL(page.url()).searchParams.get('codigo'), savedCode);
      assert.equal(creates, 1);
      const state = await page.request.get(`${base}/api/publico/reservas/${savedCode}/estado`);
      const result = await state.json();
      assert.equal(result.estadoReserva, 'PENDIENTE_PAGO'); assert.equal(result.estadoPago, 'PENDIENTE');
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.getByRole('heading', { name: 'Pago en proceso', exact: true }).waitFor();
      assert.equal(creates, 1); assert.deepEqual(errors, []);
      console.log(`Pago ${viewport.width}px: total único, enlaces, validación, recuperación sin duplicar y estado pendiente correctos.`);
      // Deja la pantalla de pago disponible para la prueba manual, con el intento recuperable.
      await page.goto(paymentUrl, { waitUntil: 'domcontentloaded' });
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
