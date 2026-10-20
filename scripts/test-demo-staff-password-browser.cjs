const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const base = process.env.STAFF_TEST_URL ?? 'http://localhost:3028';
(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    for (const width of [1440, 390]) {
      const context = await browser.newContext({ viewport: { width, height: 844 } });
      const page = await context.newPage();
      const initialSession = page.waitForResponse(r => r.url().endsWith('/api/auth/yo'));
      await page.goto(`${base}/panel/login`, { waitUntil: 'domcontentloaded' });
      await initialSession;
      await page.getByLabel('Correo', { exact: true }).fill('recepcion@villaserena.gt');
      await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
      let result = page.waitForResponse(r => r.url().endsWith('/api/auth/login'));
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      assert.equal((await result).status(), 401);
      await page.getByRole('alert').getByText('Correo o contraseña incorrectos.', { exact: true }).waitFor();
      assert.equal((await context.cookies()).filter(c => c.name.startsWith('vs_staff_')).length, 0);
      await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
      result = page.waitForResponse(r => r.url().endsWith('/api/auth/login'));
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      assert.equal((await result).status(), 200);
      await page.getByRole('heading', { name: 'Panel del personal' }).waitFor();
      const employee = await (await context.request.get(`${base}/api/auth/yo`)).json();
      assert.equal(employee.rol, 'RECEPCION');
      assert.ok((await context.cookies()).filter(c => c.name.startsWith('vs_staff_')).every(c => c.httpOnly));
      await context.close();
      const guestContext = await browser.newContext({ viewport: { width, height: 844 } });
      const guestPage = await guestContext.newPage();
      const guestSession = guestPage.waitForResponse(r => r.url().endsWith('/api/auth/yo'));
      await guestPage.goto(`${base}/login`, { waitUntil: 'domcontentloaded' });
      await guestSession;
      await guestPage.getByPlaceholder('Correo electrónico').fill('anamorales@gmail.com');
      await guestPage.getByPlaceholder('Contraseña', { exact: true }).fill('demo123');
      await guestPage.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      await guestPage.waitForURL('**/huesped');
      const guest = await guestPage.evaluate(() => JSON.parse(localStorage.getItem('villa-serena-session')));
      assert.equal(guest.role, 'huesped'); assert.equal(guest.email, 'anamorales@gmail.com');
      await guestContext.close();
      console.log(`PASS ${width}: personal acepta VillaSerena26, rechaza demo123; huésped conserva demo123`);
    }
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
