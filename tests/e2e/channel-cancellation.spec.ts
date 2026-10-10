import type { Page } from '@playwright/test';
import type { ReservationDetail } from '@/lib/bff/contracts/reception';
import { test, expect, viewports, login, calendar, openDetail, expectNoOverflow } from './channel-fixtures';

async function calendarDetail(page: Page, code: string, entry: string) {
  const region = await calendar(page, entry);
  await region.locator(`[data-reservation-code="${code}"]`).first().click();
  const detail = page.getByRole('dialog', { name: 'Detalle de reserva', exact: true });
  await expect(detail.getByRole('heading', { name: 'Historial de estados' })).toBeVisible();
  await expect(detail.getByRole('heading', { name: code, exact: true })).toBeVisible();
  return detail;
}

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    for (const [code, channel, canCancel] of [['VS-CANA01', 'BOOKING', false], ['VS-CANA02', 'EXPEDIA', false], ['VS-TEST04', 'RECEPCION', true], ['VS-PAGO01', 'DIRECTO_WEB', true]] as const) {
      test(`${channel}: cancelación en detalle, cuenta y calendario tras recarga y copia antigua`, async ({ page, context, baseURL }, testInfo) => {
        await login(page);
        let detail = await openDetail(page, code);
        await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(canCancel ? 1 : 0);
        // These seeded reservations are unassigned. Assign through the real UI to exercise calendar entry.
        await detail.getByRole('button', { name: /Asignar habitación|Cambiar habitación/ }).click();
        const select = detail.getByLabel('Habitación', { exact: true });
        await expect(select.locator('option').nth(1)).toBeAttached();
        const room = await select.locator('option').nth(1).getAttribute('value');
        expect(room).toBeTruthy(); await select.selectOption(room!);
        await detail.getByRole('button', { name: 'Guardar asignación', exact: true }).click();
        await expect(detail.getByRole('status')).toContainText('Habitación asignada en la simulación.');
        const response = await context.request.get(`/api/reservas/${code}`); expect(response.status()).toBe(200);
        const stored = await response.json() as ReservationDetail;
        expect(stored.canal).toBe(channel); expect(stored.habitacion).not.toBeNull();
        await detail.getByRole('button', { name: 'Ver cuenta', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Cuenta y pagos', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(0);
        await page.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
        detail = await calendarDetail(page, code, stored.entrada);
        await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(canCancel ? 1 : 0);
        await page.reload(); detail = await calendarDetail(page, code, stored.entrada);
        await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(canCancel ? 1 : 0);
        const copied = await page.evaluate(code => {
          const records = JSON.parse(localStorage.getItem('vs-reservas') ?? '[]') as { codigo: string; canal?: string }[];
          const record = records.find(record => record.codigo === code);
          if (!record) return false;
          delete record.canal; localStorage.setItem('vs-reservas', JSON.stringify(records)); return true;
        }, code);
        expect(copied).toBe(true);
        await page.reload(); detail = await calendarDetail(page, code, stored.entrada);
        await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(canCancel ? 1 : 0);
        if (!canCancel) {
          const rejected = await context.request.post(`/api/reservas/${code}/cancelar`, { headers: { Origin: baseURL! }, data: { motivo: 'Comprobación issue48' } });
          expect(rejected.status()).toBe(409); expect(await rejected.json()).toMatchObject({ codigo: 'CANAL_NO_CANCELABLE' });
          expect(await (await context.request.get(`/api/reservas/${code}`)).json()).toMatchObject({ estado: 'CONFIRMADA', canal: channel });
        }
        await expectNoOverflow(page);
        await page.screenshot({ path: testInfo.outputPath('cancelacion.png'), fullPage: true });
      });
    }
  });
}
