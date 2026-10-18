import { test as base, expect, type Page, type WebError } from '@playwright/test';
import { readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { basename, dirname, join } from 'node:path';

export { hotelDate, viewports } from './reception-fixtures';
export { expect };
export async function resetPublicState() {
  for (const [key, filename] of [['ISSUE48_PUBLIC_CONTRACT_PATH', 'public-contract.json'], ['ISSUE48_BOOKING_STATE_PATH', 'bookings.json']] as const) {
    const file = process.env[key];
    if (!file || basename(file) !== filename || !basename(dirname(file)).startsWith('issue48-e2e-')) throw new Error(`Missing isolated ${filename}`);
    await rm(file, { force: true });
  }
}
// Only the external booking-email provider is simulated. Reservations, inventory,
// payment state, cookies and guest OTP still pass through the real demo BFF.
export const test = base.extend<{ isolatedPublic: void; bookingEmailProvider: void; browserErrors: string[] }>({
  bookingEmailProvider: [async ({ context }, use) => {
    const drafts = new Map<string, { requested: boolean; verified: boolean }>();
    await context.route('**/api/publico/correo/*', async route => {
      const input = route.request().postDataJSON();
      const key = `${input.borrador}:${input.correo}`;
      const state = drafts.get(key) ?? { requested: false, verified: false };
      const action = new URL(route.request().url()).pathname.split('/').at(-1);
      if (action === 'solicitar') { state.requested = true; state.verified = false; }
      if (action === 'verificar') {
        if (!state.requested || input.codigo !== '123456') { await route.fulfill({ status: 400, json: { codigo: 'VERIFICACION_INVALIDA' } }); return; }
        state.verified = true;
      }
      drafts.set(key, state);
      await route.fulfill({ json: { verificado: state.verified, solicitado: state.requested, envio: state.requested ? 'ENVIADO' : 'NINGUNO', reenviarEn: 0 } });
    });
    await use();
  }, { auto: true }],
  isolatedPublic: [async ({}, use) => {
    await resetPublicState();
    await use();
  }, { auto: true }],
  browserErrors: [async ({ context }, use) => {
    const errors: string[] = [];
    const record = (event: WebError) => errors.push(`${event.page()?.url()}: ${event.error().message}`);
    context.on('weberror', record);
    await use(errors);
    context.off('weberror', record);
    expect(errors).toEqual([]);
  }, { auto: true }],
});

export async function expectNoOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
}

export async function fillGuest(page: Page, email = 'issue48@example.test', firstName = 'Prueba') {
  await page.getByLabel('Nombre', { exact: true }).fill(firstName);
  await page.getByLabel('Apellidos', { exact: true }).fill('Reserva');
  await page.getByLabel('Número de documento', { exact: true }).fill('1234567890123');
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await page.locator('.phone-number-input').fill('55555555');
}

export async function reviewGuest(page: Page) {
  await page.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Revisa tus datos', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await verifyBookingEmail(page);
  await expect(page.getByRole('heading', { name: 'Pago con tarjeta', exact: true })).toBeVisible();
}

export async function verifyBookingEmail(page: Page) {
  await expect(page).toHaveURL(/\/reservar\/verificar\?/);
  await page.getByRole('button', { name: 'Enviar código', exact: true }).click();
  const digits = page.locator('input[autocomplete="one-time-code"]');
  await expect(digits).toHaveCount(1);
  await digits.fill('123456');
  await page.getByRole('button', { name: 'Verificar y continuar', exact: true }).click();
  await expect(page).toHaveURL(/\/reservar\/pago\?/);
}

export async function enterSelectedPortal(page: Page, code: string, email: string) {
  await page.getByRole('link', { name: 'Acceder al portal del huésped', exact: true }).click();
  await page.getByLabel('Correo electrónico', { exact: true }).fill(email);
  await expect(page).toHaveURL(url => url.searchParams.get('codigo') === code);
  const requested = page.waitForResponse(response => response.url().endsWith('/acceso/solicitar-codigo') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Solicitar código de acceso', exact: true }).click();
  await page.getByRole('button', { name: 'Enviar código', exact: true }).click();
  expect((await requested).ok()).toBe(true);
  await page.getByRole('button', { name: 'Volver a iniciar sesión', exact: true }).last().click();
  await page.getByLabel(/^Contraseña o código de acceso/).fill(await readGuestCode(email));
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(url => url.pathname === '/portal' && url.searchParams.get('codigo') === code);
  await expect(page.getByRole('heading', { name: /Habitación\s+Pendiente de asignación/ })).toBeVisible();
  await expect(page.locator('body')).toContainText(code);
  await expect(page.locator('body')).not.toContainText('VS-2026-01042');
}

export async function readGuestCode(email: string): Promise<string> {
  const folder = process.env.ISSUE48_GUEST_OUTBOX_PATH;
  if (!folder || basename(folder) !== 'guest-outbox' || !basename(dirname(folder)).startsWith('issue48-e2e-')) throw new Error('Missing isolated guest outbox');
  const outbox = JSON.parse(await readFile(join(folder, `${createHash('sha256').update(email).digest('hex')}.json`), 'utf8')) as { correo: string; codigo: string };
  expect(outbox.correo).toBe(email);
  return outbox.codigo;
}
