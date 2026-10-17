const { chromium } = require('playwright');
const { readFileSync } = require('node:fs');
const { createHash } = require('node:crypto');
const assert = require('node:assert/strict');
const base = 'http://localhost:3035';
(async () => {
 const browser = await chromium.launch();
 try { for (const width of [1440, 390]) {
  const context = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await context.newPage(); page.setDefaultTimeout(60000);
  await page.goto(`${base}/reservar/habitaciones?llegada=2027-04-20&salida=2027-04-22&adultos=2&ninos=0&huespedes=2`);
  await page.getByRole('link', { name: 'Ver habitación', exact: true }).first().click();
  await page.getByRole('button', { name: 'Reservar habitación', exact: true }).click();
  await page.getByLabel('Nombre', { exact: true }).fill('Ana');
  await page.getByLabel('Apellidos', { exact: true }).fill('Morales');
  await page.getByLabel('Número de documento', { exact: true }).fill('1234567890101');
  await page.getByLabel('Correo electrónico', { exact: true }).fill('ana.morales@correo.com');
  await page.locator('.phone-number-input').fill('55555555');
  await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.locator('.terms-check input').check();
  await page.getByRole('button', { name: 'Continuar pago →', exact: true }).click();
  try { await page.getByRole('heading', { name: 'Pago en proceso', exact: true }).waitFor({ timeout: 15000 }); } catch (e) { console.error(page.url(), await page.locator('main').innerText()); throw e; }
  const code = new URL(page.url()).searchParams.get('codigo'); assert.match(code, /^VS-[A-Z0-9]{6}$/);
  // La simulación no confirma reservas nuevas. No se falsifica el resultado para probar el acceso.
  await page.goto(`${base}/reserva/detalle?codigo=${code}`);
  await page.getByRole('heading', { name: 'Gestiona tu estancia' }).waitFor();
  assert.equal(await page.getByLabel('Correo de la reserva', { exact: true }).count(), 0);
  await page.getByRole('link', { name: 'Acceder al portal del huésped' }).click();
  await page.getByLabel('Correo de la reserva', { exact: true }).fill('ana.morales@correo.com');
  await page.getByRole('button', { name: 'Solicitar código', exact: true }).click();
  await page.getByLabel('Código de acceso').waitFor();
  const file = `.data/guest-outbox/${createHash('sha256').update('ana.morales@correo.com').digest('hex')}.json`;
  await page.getByLabel('Código de acceso').fill(JSON.parse(readFileSync(file, 'utf8')).codigo);
  await page.getByRole('button', { name: 'Verificar código', exact: true }).click();
  await page.waitForURL(`**/portal?codigo=${code}`);
  await page.getByText('Habitación pendiente de asignación.', { exact: false }).waitFor();
  assert.ok((await page.locator('body').innerText()).includes(code));
  assert.ok(!(await page.locator('body').innerText()).includes('VS-2026-01042'));
  await page.reload(); await page.getByText('Habitación pendiente de asignación.', { exact: false }).waitFor();
  await page.screenshot({ path: `.data/issue35-evidence/selected-portal-${width}.png`, fullPage: true });
  console.log(`${width}px: disponibilidad → datos → pago pendiente → resumen autorizado → OTP → portal de ${code}; recarga sin otra estancia.`);
  await context.close();
 } } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
