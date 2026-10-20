import { test, expect, viewports, hotelDate, expectNoOverflow } from './public-fixtures';
import type { Page } from '@playwright/test';

async function checkArrow(page: Page) {
  const card = page.locator('.floating-login-card');
  const arrow = card.locator('.auth-card-back, .booking-verification-back');
  await expect(arrow).toBeVisible();
  await expect(arrow.locator('svg')).toHaveAttribute('width', '24');
  const a = (await arrow.boundingBox())!, c = (await card.boundingBox())!;
  expect(a.x).toBeGreaterThanOrEqual(c.x); expect(a.y).toBeGreaterThanOrEqual(c.y);
  expect(a.x + a.width).toBeLessThanOrEqual(c.x + c.width);
  const logo = (await card.locator('.villa-logo-image').boundingBox())!;
  expect(a.x + a.width).toBeLessThanOrEqual(logo.x + 1);
  await expectNoOverflow(page);
}

for (const { name, viewport } of [...viewports, { name: 'móvil estrecho', viewport: { width: 320, height: 740 } }]) test.describe(name, () => {
  test.use({ viewport });
  test('auth arrows stay in the card and preserve email without sending requests', async ({ page }, info) => {
    const mutations: string[] = [];
    await page.route(/\/api\/(auth|app\/acceso)\//, route => {
      if (route.request().method() === 'POST') { mutations.push(route.request().url()); return route.abort(); }
      return route.continue();
    });
    await page.goto('/login');
    const email = page.getByLabel('Correo electrónico', { exact: true });
    await email.fill('navigation@example.test');
    await checkArrow(page);
    for (const [button, heading] of [['Obtén tu código de acceso', 'Código de acceso'], ['¿Olvidaste tu contraseña?', 'Recuperar contraseña']]) {
      await page.getByRole('button', { name: button, exact: true }).click();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await expect(email).toHaveValue('navigation@example.test');
      await checkArrow(page);
      await page.screenshot({ path: info.outputPath(heading === 'Código de acceso' ? 'codigo.png' : 'recuperacion.png'), fullPage: true });
      await page.reload();
      await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Volver a iniciar sesión', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'Iniciar sesión', exact: true })).toBeVisible();
      await expect(email).toHaveValue('navigation@example.test');
    }
    // Only a format fixture for presentation: never submit or validate this token.
    await page.goto('/restablecer-contrasena#token=' + 'a'.repeat(43));
    await expect(page.getByLabel('Nueva contraseña', { exact: true })).toBeVisible();
    await checkArrow(page);
    await page.screenshot({ path: info.outputPath('nueva-contrasena.png'), fullPage: true });
    await page.getByRole('link', { name: 'Volver', exact: true }).click();
    await expect(page).toHaveURL(/\/login$/); await expect(page.getByRole('heading',{name:'Iniciar sesión',exact:true})).toBeVisible();
    await page.goto('/panel/login'); await checkArrow(page);
    await page.getByRole('link', { name: 'Volver', exact: true }).click(); await expect(page).toHaveURL(/\/$/);
    expect(mutations).toEqual([]);
  });

  test('booking verification returns to its own guest form with saved email', async ({ page }) => {
    await page.goto('/');
    const id = await page.evaluate(({ arrival, departure }) => {
      const id = crypto.randomUUID();
      sessionStorage.setItem('vs-public-booking-draft', JSON.stringify({ id, createdAt: Date.now(), params: new URLSearchParams({ slug: 'habitacion-estandar', tipoHabitacionId: '1', llegada: arrival, salida: departure, adultos: '2', ninos: '0', nombre: 'Navigation', apellidos: 'Fixture', correo: 'navigation@example.test', telefono: '+502 55555555', documento: '1234567890123', tipoDocumento: 'DPI' }).toString() }));
      return id;
    }, { arrival: hotelDate(14), departure: hotelDate(16) });
    await page.goto('/reservar/verificar?draft=' + id);
    await expect(page.getByRole('button', { name: 'Enviar código', exact: true })).toBeVisible();
    await checkArrow(page);
    await page.getByRole('button', { name: 'Volver', exact: true }).click();
    await expect(page).toHaveURL(/\/reservar\/datos\?/);
    await expect(page.getByLabel('Correo electrónico', { exact: true })).toHaveValue('navigation@example.test');
  });
});
