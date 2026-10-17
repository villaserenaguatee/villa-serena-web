import { test, expect, viewports, login, calendar, hotelDate, openDetail, prepareCreation, confirmCreation, expectCalendarReservation } from './reception-fixtures';
import type { ReservationDetail, ReservationPage } from '@/lib/bff/contracts/reception';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('crear con/sin habitación: detalle, filtros, calendario, recarga y navegador sin copia local', async ({ page, context, browser, baseURL, browserErrors }, testInfo) => {
      await login(page);
      const originals = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas')!));
      const created: ReservationDetail[] = [];
      for (const assigned of [true, false]) {
        await test.step(assigned ? 'reserva asignada' : 'reserva sin asignar', async () => {
          const form = await prepareCreation(page, { assigned }); let posts = 0;
          const count = (request: import('@playwright/test').Request) => { if (new URL(request.url()).pathname === '/api/reservas' && request.method() === 'POST') posts++; };
          page.on('request', count); const detail = await confirmCreation(page, form); created.push(detail);
          expect(Boolean(detail.habitacion)).toBe(assigned); expect(detail.saldoPendiente).toBe(detail.total); expect(detail.canal).toBe('RECEPCION');
          await page.screenshot({ path: testInfo.outputPath(`${assigned ? 'assigned' : 'unassigned'}-confirmation.png`) });
          if (assigned) await form.getByRole('button', { name: 'Ver reserva / realizar check-in', exact: true }).click();
          else {
            await form.getByRole('button', { name: 'Hacer otra reserva', exact: true }).click();
            await expect(form).toHaveCount(0);
            await openDetail(page, detail.codigo);
          }
          const dialog = page.getByRole('dialog', { name: 'Detalle de reserva' });
          await expect(dialog.getByRole('heading', { name: 'Historial de estados' })).toBeVisible();
          await expect(dialog).toContainText(detail.huesped.nombreCompleto); await expect(dialog).toContainText(detail.tipoHabitacion.nombre);
          await expect(dialog).toContainText(detail.habitacion?.numero ?? 'Sin asignar');
          expect(await (await context.request.get(`/api/reservas/${detail.codigo}`)).json()).toEqual(detail);
          await dialog.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
          const region = await calendar(page, detail.entrada);
          const event = region.locator(`[data-reservation-code="${detail.codigo}"]`);
          await expectCalendarReservation(region, detail);
          if (assigned) {
            await event.first().click(); await expect(dialog).toContainText(detail.codigo);
            await dialog.getByRole('button', { name: 'Cerrar detalle de reserva' }).click();
          }
          await region.getByRole('button', { name: 'Habitaciones', exact: true }).click();
          await expectCalendarReservation(region, detail);
          await page.goto('/recepcion/reservas');
          for (const [field, value] of [['Nombre o documento', 'Ana'], ['Código de reserva', detail.codigo]]) {
            await page.getByLabel('Nombre o documento', { exact: true }).fill(field === 'Nombre o documento' ? value : '');
            await page.getByLabel('Código de reserva', { exact: true }).fill(field === 'Código de reserva' ? value : '');
            const search = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'GET' &&
              new URL(r.url()).searchParams.get(field === 'Nombre o documento' ? 'texto' : 'codigo') === value);
            await page.getByRole('button', { name: 'Buscar', exact: true }).click();
            const result: ReservationPage = await (await search).json(); expect(result.contenido.filter(r => r.codigo === detail.codigo)).toHaveLength(1);
            await expect(page.getByRole('button').filter({ hasText: detail.codigo })).toBeVisible();
          }
          await page.getByRole('button').filter({ hasText: detail.codigo }).click(); await expect(dialog).toContainText(detail.huesped.nombreCompleto);
          await page.reload(); await openDetail(page, detail.codigo);
          expect(await (await context.request.get(`/api/reservas/${detail.codigo}`)).json()).toEqual(detail);
          const local = await page.evaluate(() => JSON.parse(localStorage.getItem('vs-reservas')!));
          expect(local.filter((r: { codigo: string }) => r.codigo === detail.codigo)).toHaveLength(1);
          for (const original of originals) expect(local.find((r: { id: string }) => r.id === original.id)).toEqual(original);
          expect(local.find((r: { codigo: string }) => r.codigo === detail.codigo).pagos).toEqual([]);
          expect(posts).toBe(1); page.off('request', count);
        });
      }
      const fresh = await browser.newContext({ baseURL, viewport, timezoneId: 'America/Guatemala', locale: 'es-GT' });
      try {
        const other = await fresh.newPage(); other.on('pageerror', e => browserErrors.push(e.message)); await login(other);
        for (const expected of created) {
          expect(await other.evaluate(code => JSON.parse(localStorage.getItem('vs-reservas')!).some((r: { codigo: string }) => r.codigo === code), expected.codigo)).toBe(false);
          const dialog = await openDetail(other, expected.codigo); await expect(dialog).toContainText(expected.huesped.nombreCompleto);
          expect(await (await fresh.request.get(`/api/reservas/${expected.codigo}`)).json()).toEqual(expected);
          const region = await calendar(other, expected.entrada);
          await expectCalendarReservation(region, expected);
          await region.getByRole('button', { name: 'Habitaciones', exact: true }).click();
          await expectCalendarReservation(region, expected);
        }
      } finally { await fresh.close(); }
    });

    test('huésped nuevo, respuesta perdida y doble clic: una reserva recuperable sin repetir POST', async ({ page, context }) => {
      await login(page); const form = await prepareCreation(page, { newGuest: true, offset: 15 });
      let lost: ReservationDetail | undefined, posts = 0;
      await page.route('**/api/reservas', async route => {
        if (route.request().method() !== 'POST') return route.continue();
        posts++; const response = await route.fetch(); expect(response.status()).toBe(201);
        lost = await response.json(); await route.abort('failed');
      });
      await form.getByRole('button', { name: 'Confirmar reserva', exact: true }).dblclick();
      await expect(form.getByRole('alert')).toContainText('No se pudo comprobar el resultado');
      await expect(form.getByRole('button', { name: 'Confirmar reserva', exact: true })).toBeDisabled();
      expect(posts).toBe(1); expect(lost).toBeDefined(); await page.unroute('**/api/reservas');
      const results: ReservationPage = await (await context.request.get(`/api/reservas?codigo=${lost!.codigo}`)).json();
      expect(results.contenido.filter(r => r.codigo === lost!.codigo)).toHaveLength(1);
      const dialog = await openDetail(page, lost!.codigo); await expect(dialog).toContainText('Prueba Persistencia Issue48');
      expect(await (await context.request.get(`/api/reservas/${lost!.codigo}`)).json()).toEqual(lost);
      const region = await calendar(page, hotelDate(15));
      await expect(region.locator(`[data-reservation-code="${lost!.codigo}"]`)).toHaveCount(0);
    });

    test('cuenta de reserva existente conserva identidad y código local sin duplicar huésped/estancia', async ({ page }) => {
      await login(page); const detail = await openDetail(page, 'VS-TEST04');
      const before = await page.evaluate(() => ({ reservations: JSON.parse(localStorage.getItem('vs-reservas')!), guests: JSON.parse(localStorage.getItem('vs-huespedes')!) }));
      await detail.getByRole('button', { name: 'Ver cuenta', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Cuenta y pagos', exact: true })).toBeVisible();
      const after = await page.evaluate(() => ({ reservations: JSON.parse(localStorage.getItem('vs-reservas')!), guests: JSON.parse(localStorage.getItem('vs-huespedes')!) }));
      expect(after.reservations).toHaveLength(before.reservations.length); expect(after.guests).toHaveLength(before.guests.length);
      const linked = after.reservations.find((r: { codigoBff?: string }) => r.codigoBff === 'VS-TEST04');
      expect(linked).toBeDefined(); expect(linked.codigo).toBe(before.reservations.find((r: { id: string }) => r.id === linked.id).codigo);
    });
  });
}
