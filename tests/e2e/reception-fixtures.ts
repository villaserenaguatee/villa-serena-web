import { test as base, expect, type Page, type Locator } from '@playwright/test';
import { rm } from 'node:fs/promises';
import { basename, dirname } from 'node:path';
import type { ReservationDetail } from '@/lib/bff/contracts/reception';

export const test = base.extend<{ isolatedReception: void; browserErrors: string[] }>({
  isolatedReception: [async ({}, use) => {
    const file = process.env.ISSUE48_RECEPTION_STATE_PATH;
    if (!file || basename(file) !== 'reception.json' || !basename(dirname(file)).startsWith('issue48-e2e-')) throw new Error('Missing isolated reception database');
    await rm(file, { force: true });
    await use();
  }, { auto: true }],
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    const record = (error: Error) => errors.push(`${page.url()}: ${error.message}`);
    page.on('pageerror', record); await use(errors); page.off('pageerror', record);
    expect(errors).toEqual([]);
  }, { auto: true }],
});
export { expect };
export const viewports = [
  { name: 'computadora', viewport: { width: 1440, height: 1000 } },
  { name: 'móvil', viewport: { width: 390, height: 844 } },
] as const;

export function hotelDate(offset = 0) {
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  return new Date(Date.parse(today) + offset * 86400000).toISOString().slice(0, 10);
}
export async function login(page: Page, correo = 'recepcion@villaserena.gt') {
  const initialSession = page.waitForResponse(r => new URL(r.url()).pathname === '/api/auth/yo');
  await page.goto('/panel/login');
  await (await initialSession).finished();
  await page.getByLabel('Correo electrónico', { exact: true }).fill(correo);
  await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(correo === 'recepcion@villaserena.gt' ? /\/recepcion$/ : /\/admin$/);
  if (correo === 'recepcion@villaserena.gt') {
    await expect(calendarRegion(page).getByRole('heading', { name: 'Calendario de reservas', exact: true })).toBeVisible();
    await page.waitForFunction(() => localStorage.getItem('vs-reservas') !== null);
  }
}
export const calendarRegion = (page: Page) => page.getByRole('region', { name: 'Calendario de reservas', exact: true });
export async function calendar(page: Page, entry = hotelDate()) {
  await page.goto('/recepcion'); const region = calendarRegion(page);
  await expect(region.getByRole('heading', { name: 'Calendario de reservas', exact: true })).toBeVisible();
  if (entry.slice(0, 7) !== hotelDate().slice(0, 7)) await region.getByRole('button', { name: 'Período siguiente' }).click();
  return region;
}
export async function openDetail(page: Page, code: string) {
  await page.goto(`/recepcion/reservas/${code}`);
  const dialog = page.getByRole('dialog', { name: 'Detalle de reserva', exact: true });
  await expect(dialog.getByRole('heading', { name: 'Historial de estados' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: code, exact: true })).toBeVisible();
  return dialog;
}
export async function prepareCreation(page: Page, options: { assigned?: boolean; offset?: number; room?: string; newGuest?: boolean } = {}) {
  const entry = hotelDate(options.offset ?? 5); const region = await calendar(page, entry);
  await region.getByRole('button', { name: '+ Nueva reserva', exact: true }).click();
  const form = page.getByRole('dialog', { name: 'Nueva reserva' });
  if (options.newGuest) {
    await form.getByRole('button', { name: 'Registrar nuevo huésped', exact: true }).click();
    await form.getByLabel('Nombre', { exact: true }).fill('Prueba');
    await form.getByLabel('Apellidos', { exact: true }).fill('Persistencia Issue48');
    await form.getByLabel('Número de documento', { exact: true }).fill('1234567890123');
    await form.getByLabel('Correo electrónico', { exact: true }).fill('issue48@example.test');
    await form.getByLabel('Teléfono', { exact: true }).fill('55551234');
  } else {
    await form.getByPlaceholder('Buscar por nombre…').fill('Ana');
    await form.getByRole('button', { name: /^Ana Morales/ }).click();
  }
  await form.getByLabel('Entrada', { exact: true }).fill(entry);
  await form.getByLabel('Salida', { exact: true }).fill(hotelDate((options.offset ?? 5) + 2));
  if (options.assigned || options.room) await form.getByRole('button', { name: options.room ? new RegExp(`^Habitación ${options.room}`) : /^Habitación \d{3}/ }).first().click();
  await form.getByRole('button', { name: 'Revisar datos', exact: true }).click();
  return form;
}
export async function confirmCreation(page: Page, form: Locator): Promise<ReservationDetail> {
  const response = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'POST');
  await form.getByRole('button', { name: 'Confirmar reserva', exact: true }).click();
  const created = await response; expect(created.status()).toBe(201);
  await expect(form.getByRole('heading', { name: 'Reserva confirmada', exact: true })).toBeVisible();
  return created.json();
}

export async function expectCalendarReservation(region: Locator, detail: ReservationDetail) {
  // Both presentations render one button per occupied night in the selected month.
  const days = [];
  for (let time = Date.parse(detail.entrada); time < Date.parse(detail.salida); time += 86400000) {
    const day = new Date(time).toISOString().slice(0, 10);
    if (day.slice(0, 7) === detail.entrada.slice(0, 7)) days.push(day);
  }
  await expect(region.locator(`[data-reservation-code="${detail.codigo}"]`)).toHaveCount(detail.habitacion ? days.length : 0);
}
