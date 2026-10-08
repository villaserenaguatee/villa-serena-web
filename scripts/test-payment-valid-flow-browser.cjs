const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.PUBLIC_TEST_BASE_URL ?? 'http://localhost:3032';
(async () => {
  const browser = await chromium.launch();
  try {
    for (const viewport of [{ width: 1440, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport }); const page = await context.newPage(); page.setDefaultTimeout(60000);
      const oldQuery = 'habitacion=Habitaci%C3%B3n%20Est%C3%A1ndar&tipoHabitacionId=1&llegada=2026-10-21&salida=2026-10-23&adultos=2&ninos=0';
      await page.goto(`${base}/reservar/pago?${oldQuery}`, { waitUntil: 'domcontentloaded' });
      await page.getByRole('alert').filter({ hasText: 'Tus datos no están disponibles' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Continuar pago →', exact: true }).isDisabled(), true);
      await page.goto(`${base}/reservar/datos?${oldQuery}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => /Introduce tus datos|La habitación no está disponible|No se pudo consultar/.test(document.querySelector('main')?.innerText ?? ''));
      const original = await page.locator('main').innerText();
      console.log(`Enlace anterior de datos ${viewport.width}px: ${original.includes('La habitación no está disponible') ? 'no disponible' : 'formulario disponible'}`);
      const start = `${base}/reservar/habitaciones?llegada=2026-11-10&salida=2026-11-12&adultos=2&ninos=0&huespedes=2`;
      await page.goto(start, { waitUntil: 'domcontentloaded' });
      const offer = page.locator('a[href^="/habitaciones/"]').first(); await offer.waitFor(); await offer.click();
      await page.getByRole('button', { name: 'Reservar habitación', exact: true }).click();
      await page.getByRole('heading', { name: 'Introduce tus datos', exact: true }).waitFor();
      const dataUrl = page.url();
      await page.getByLabel('Nombre', { exact: true }).fill('Revisión');
      await page.getByLabel('Apellidos', { exact: true }).fill('Presentación');
      await page.getByLabel('Número de documento', { exact: true }).fill('1234567890123');
      await page.getByLabel('Correo electrónico', { exact: true }).fill('revision32@example.test');
      await page.locator('.phone-number-input').fill('55555555');
      await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
      await page.getByRole('heading', { name: 'Revisa tus datos', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Continuar', exact: true }).click();
      await page.getByRole('heading', { name: 'Pago con tarjeta', exact: true }).waitFor();
      const button = page.getByRole('button', { name: 'Continuar pago →', exact: true });
      assert.equal(await button.isDisabled(), true);
      await page.locator('.terms-check input').check();
      await page.waitForFunction(() => !document.querySelector('.checkout-form > .reserve-primary').disabled);
      assert.equal(await page.locator('.summary-total').count(), 1);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false);
      await page.screenshot({ path: `.data/issue32-evidence/compact-${viewport.width}.png`, fullPage: true });
      fs.writeFileSync(`.data/issue32-evidence/flow-${viewport.width}.json`, JSON.stringify({ disponibilidad: start, datos: dataUrl, pago: page.url() }, null, 2));
      console.log(`Recorrido válido ${viewport.width}px: ${dataUrl}`);
      await context.close();
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
