import { test, expect, viewports, expectNoOverflow, readGuestCode } from './channel-fixtures';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('personal rechaza demo123 y acepta VillaSerena26 con cookies HttpOnly y rol correcto', async ({ page, context }) => {
      const session = page.waitForResponse(response => response.url().endsWith('/api/auth/yo'));
      await page.goto('/panel/login'); await (await session).finished();
      await page.getByLabel('Correo electrónico', { exact: true }).fill('recepcion@villaserena.gt');
      await page.getByLabel('Contraseña', { exact: true }).fill('demo123');
      const rejected = page.waitForResponse(response => response.url().endsWith('/api/auth/login'));
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      expect((await rejected).status()).toBe(401);
      await expect(page.getByRole('alert').filter({ hasText: 'Correo o contraseña incorrectos.' })).toBeVisible();
      expect((await context.cookies()).filter(cookie => cookie.name.startsWith('vs_staff_'))).toHaveLength(0);
      await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
      const accepted = page.waitForResponse(response => response.url().endsWith('/api/auth/login'));
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      expect((await accepted).status()).toBe(200);
      await expect(page).toHaveURL(/\/recepcion$/);
      await expect(page.getByRole('heading', { name: 'Calendario de reservas', exact: true })).toBeVisible();
      const employee = await context.request.get('/api/auth/yo'); expect(employee.status()).toBe(200);
      expect(await employee.json()).toMatchObject({ rol: 'RECEPCION', correo: 'recepcion@villaserena.gt' });
      const cookies = (await context.cookies()).filter(cookie => cookie.name.startsWith('vs_staff_'));
      expect(cookies).toHaveLength(2); expect(cookies.every(cookie => cookie.httpOnly)).toBe(true);
      expect(await page.evaluate(() => document.cookie.includes('vs_staff_'))).toBe(false);
    });

    test('huésped entra desde inicio con OTP, sin contraseña ni sesión local de personal', async ({ page, context }, testInfo) => {
      test.setTimeout(60_000);
      const email = 'ana.morales@correo.com';
      await page.goto('/login');
      await expect(page.getByRole('tab', { name: 'Huésped', exact: true })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByLabel('Contraseña', { exact: true })).toHaveCount(0);
      await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
      const sent = page.waitForResponse(response => response.url().endsWith('/acceso/solicitar-codigo'), { timeout: 15_000 });
      await page.getByRole('button', { name: 'Solicitar código', exact: true }).click();
      const response = await sent; expect(response.status()).toBe(200);
      await expect(page.getByRole('status').filter({ hasText: 'Si el correo tiene una reserva' })).toBeVisible();
      const code = await readGuestCode(email);
      await page.getByLabel('Código de acceso', { exact: true }).fill(code);
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      await expect(page).toHaveURL(/\/portal$/);
      await expect(page.locator('body')).toContainText('VS-DEMO01');
      expect((await context.cookies()).find(cookie => cookie.name === 'vs_guest_access')?.httpOnly).toBe(true);
      expect((await context.cookies()).filter(cookie => cookie.name.startsWith('vs_staff_'))).toHaveLength(0);
      expect(await page.evaluate(() => document.cookie.includes('vs_guest_access='))).toBe(false);
      expect(await page.evaluate(() => localStorage.getItem('villa-serena-session'))).toBeNull();
      await expectNoOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('portal-otp.png'), fullPage: true });
    });
  });
}
