import { readFile } from 'node:fs/promises';
import { test as base, expect, viewports, login, hotelDate, expectNoOverflow } from './channel-fixtures';

// Chromium discards response bodies across navigation. HAR records them as they arrive.
const test = base.extend({
  contextOptions: async ({}, use, testInfo) => {
    await use({ recordHar: { path: testInfo.outputPath('canal.har'), content: 'embed', mode: 'full' } });
  },
});

const privateMarkers = ['issue48-booking-private-marker', 'issue48-expedia-private-marker', 'CANAL_BOOKING_CLAVE', 'CANAL_EXPEDIA_CLAVE'];
for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('permisos, Booking/Expedia 201 y repetición 200 sin claves en navegador', async ({ page, context, baseURL }, testInfo) => {
      const sends: string[] = [];
      page.on('request', request => {
        if (new URL(request.url()).origin !== baseURL) return;
        if (request.method() === 'POST' && request.url().endsWith('/api/admin/canal-simulado/reservas')) sends.push(request.postData()!);
      });
      await login(page);
      await page.goto('/panel/cambiar-contrasena');
      await expect(page.getByRole('navigation', { name: 'Menú de mi rol' }).getByRole('link', { name: 'Canal simulado', exact: true })).toHaveCount(0);
      await page.goto('/panel/admin/canal-simulado');
      await expect(page.getByRole('heading', { name: 'Acceso denegado', exact: true })).toBeVisible();
      const denied = await context.request.post('/api/admin/canal-simulado/reservas', { headers: { Origin: baseURL! }, data: {} });
      expect(denied.status()).toBe(403);
      await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
      await expect(page).toHaveURL(/\/panel\/login$/);
      await login(page, 'admin@villaserena.gt');
      await page.goto('/panel/cambiar-contrasena');
      await page.getByRole('link', { name: 'Canal simulado', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Canal simulado', exact: true })).toBeVisible();
      for (const channel of ['BOOKING', 'EXPEDIA']) {
        await page.getByRole('button', { name: 'Llenar al azar', exact: true }).click();
        await page.getByLabel('Canal', { exact: true }).selectOption(channel);
        await page.getByLabel('Tipo de habitación', { exact: true }).selectOption('1');
        await page.getByLabel('Entrada', { exact: true }).fill(hotelDate(80));
        await page.getByLabel('Salida', { exact: true }).fill(hotelDate(82));
        await page.getByLabel('Identificador externo', { exact: true }).fill(`ISSUE48-${channel}`);
        const sent = page.waitForResponse(response => response.url().endsWith('/api/admin/canal-simulado/reservas') && response.request().method() === 'POST');
        await page.getByRole('button', { name: 'Enviar reserva de prueba', exact: true }).click();
        const accepted = await sent; expect(accepted.status()).toBe(200);
        expect(await accepted.json()).toMatchObject({ codigoHttp: 201, respuesta: { canal: channel, estado: 'CONFIRMADA' } });
        const captured = JSON.parse(accepted.request().postData()!);
        await expect(page.getByRole('heading', { name: 'Solicitud aceptada · HTTP 201 del canal', exact: true })).toBeVisible();
        const code = await page.locator('[role="status"] strong').innerText(); expect(code).toMatch(/^VS-[A-Z0-9]{6}$/);
        await page.getByLabel('Monto total (Q)', { exact: true }).fill('1234');
        const repeated = page.waitForResponse(response => response.url().endsWith('/api/admin/canal-simulado/reservas') && response.request().method() === 'POST');
        await page.getByRole('button', { name: 'Repetir último envío', exact: true }).click();
        const replay = await repeated;
        expect(JSON.parse(replay.request().postData()!)).toEqual(captured);
        expect(await replay.json()).toMatchObject({ codigoHttp: 200, respuesta: { codigo: code } });
        await expect(page.getByRole('heading', { name: 'Solicitud aceptada · HTTP 200 del canal', exact: true })).toBeVisible();
        await expect(page.locator('[role="status"] strong')).toHaveText(code);
        await expectNoOverflow(page);
        await page.screenshot({ path: testInfo.outputPath(`${channel}.png`), fullPage: true });
        const before = sends.length;
        await page.getByLabel('Salida', { exact: true }).fill(hotelDate(80));
        await page.getByRole('button', { name: 'Enviar reserva de prueba', exact: true }).click();
        await expect(page.getByRole('alert').filter({ hasText: 'La salida debe ser posterior' })).toBeVisible();
        expect(sends).toHaveLength(before);
      }
      expect(sends).toHaveLength(4);
      const browserState = await page.evaluate(() => ({ html: document.documentElement.outerHTML, cookie: document.cookie, local: { ...localStorage }, session: { ...sessionStorage } }));
      for (const marker of privateMarkers) expect(JSON.stringify(browserState)).not.toContain(marker);
      expect(browserState.cookie).not.toContain('vs_staff_access=');
      await context.close(); // Flush the HAR before inspecting it; fixture closure is idempotent.
      const har = JSON.parse(await readFile(testInfo.outputPath('canal.har'), 'utf8')) as { log: { entries: { request: { url: string; headers: { name: string }[] }; response: { content: { text?: string; encoding?: string } } }[] } };
      expect(har.log.entries.length).toBeGreaterThan(0);
      for (const entry of har.log.entries) {
        const body = entry.response.content.text ?? '';
        const decoded = entry.response.content.encoding === 'base64' ? Buffer.from(body, 'base64').toString('utf8') : body;
        for (const marker of privateMarkers) {
          expect(JSON.stringify(entry.request), entry.request.url).not.toContain(marker);
          expect(decoded, entry.request.url).not.toContain(marker);
        }
        expect(entry.request.headers.some(header => header.name.toLowerCase().startsWith('x-canal-'))).toBe(false);
      }
    });
  });
}
