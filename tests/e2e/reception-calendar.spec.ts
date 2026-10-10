import { test, expect, viewports, login, calendarRegion } from './reception-fixtures';
import type { ReceptionCalendar } from '@/lib/bff/contracts/reception';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('calendario: datos BFF, mes/habitaciones, filtros, detalle y períodos', async ({ page }, testInfo) => {
      await login(page);
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      const start = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
      const end = new Date(`${today.slice(0, 7)}-01T12:00:00Z`);
      end.setUTCMonth(end.getUTCMonth() + 1); end.setUTCDate(0);
      const response = await page.request.get(`/api/reservas/calendario?desde=${start.toISOString().slice(0, 10)}&hasta=${end.toISOString().slice(0, 10)}`);
      expect(response.status()).toBe(200);
      const data: ReceptionCalendar = await response.json();
      const monthName = (date: Date) => new Intl.DateTimeFormat('es-GT', { month: 'long', timeZone: 'UTC' }).format(date).replace(/^./, letter => letter.toLocaleUpperCase('es-GT'));
      const calendar = calendarRegion(page);
      const codes = () => calendar.locator('[data-reservation-code]').evaluateAll(nodes => [...new Set(nodes.map(n => n.getAttribute('data-reservation-code')))].sort());
      const expected = data.reservas.filter(r => r.habitacionId).map(r => r.codigo).sort();
      await expect.poll(codes).toEqual(expected);
      await expect(calendar.getByRole('region', { name: 'Reservas sin habitación asignada' })).toHaveCount(0);
      const first = data.reservas.find(r => r.habitacionId)!;
      await calendar.locator(`[data-reservation-code="${first.codigo}"]`).first().click();
      const detail = page.getByRole('dialog', { name: 'Detalle de reserva' });
      await expect(detail.getByRole('heading', { name: 'Historial de estados' })).toBeVisible();
      await expect(detail).toContainText(first.huespedPrincipal);
      await detail.getByRole('button', { name: 'Cerrar detalle de reserva', exact: true }).click();
      await calendar.getByRole('button', { name: 'Habitaciones', exact: true }).click();
      const table = calendar.getByRole('table', { name: 'Reservas por habitación y día' });
      await expect.poll(codes).toEqual(expected); await expect(table).toContainText('Piso 1');
      const from = new Date(`${data.desde}T12:00:00Z`);
      await expect(table.getByRole('columnheader', { name: `${['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][from.getUTCDay()]} ${from.getUTCDate()}`, exact: true })).toBeVisible();
      await expect(table.locator('[colspan]')).toHaveCount(new Set(data.grupos.flatMap(g => g.habitaciones.map(h => h.piso))).size);
      await expect(table.locator('.ec-event')).toHaveCount(0);
      const group = data.grupos.find(g => g.habitaciones.some(h => h.id === first.habitacionId))!;
      const room = group.habitaciones.find(h => h.id === first.habitacionId)!;
      await calendar.getByLabel('Piso del calendario').selectOption(String(room.piso));
      await calendar.getByLabel('Categoría del calendario').selectOption(group.tipoHabitacion.nombre);
      const rooms = group.habitaciones.filter(h => h.piso === room.piso).sort((a, b) => a.numero.localeCompare(b.numero));
      await expect(table.locator('tbody tr th[scope="row"]')).toHaveText(rooms.map(h => `Hab. ${h.numero}`));
      await expect(table.locator('[colspan]')).toHaveCount(0);
      const filtered = data.reservas.filter(r => r.tipoHabitacionId === group.tipoHabitacion.id && rooms.some(h => h.id === r.habitacionId)).map(r => r.codigo).sort();
      await expect.poll(codes).toEqual(filtered);
      await calendar.locator(`[data-reservation-code="${first.codigo}"]`).first().click();
      await expect(detail).toContainText(first.codigo); await detail.getByRole('button', { name: 'Cerrar detalle de reserva' }).click();
      await calendar.getByRole('button', { name: 'Mes', exact: true }).click();
      await expect(calendar.getByLabel('Piso del calendario')).toHaveValue(String(room.piso));
      await expect(calendar.getByLabel('Categoría del calendario')).toHaveValue(group.tipoHabitacion.nombre);
      await expect.poll(codes).toEqual(filtered);
      await calendar.getByLabel('Piso del calendario').selectOption(''); await calendar.getByLabel('Categoría del calendario').selectOption('');
      for (const view of ['Mes', 'Habitaciones']) {
        await calendar.getByRole('button', { name: view, exact: true }).click();
        const period = calendar.locator('p[aria-live]'); const current = await period.innerText();
        await expect(period).toHaveText(monthName(new Date(`${today}T12:00:00Z`)));
        for (const direction of ['Período siguiente', 'Período anterior']) {
          const next = new Date(`${today.slice(0, 7)}-01T12:00:00Z`); next.setUTCMonth(next.getUTCMonth() + (direction === 'Período siguiente' ? 1 : -1));
          await calendar.getByRole('button', { name: direction }).click(); await expect(period).toHaveText(monthName(next));
          await calendar.getByRole('button', { name: direction === 'Período siguiente' ? 'Período anterior' : 'Período siguiente' }).click();
          await expect(period).toHaveText(current);
        }
        await page.screenshot({ path: testInfo.outputPath(`${view}.png`) });
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  });
}
