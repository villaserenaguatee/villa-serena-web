import { test, expect, login, prepareCreation, confirmCreation, openDetail, viewports } from './reception-fixtures';
import type { RoomState } from '@/lib/bff/contracts/reception';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('check-in consulta BFF: caída y habitación ensuciada no mutan estado; limpia permite entrada y recarga', async ({ page, context }) => {
      await login(page);
      const form = await prepareCreation(page, { room: '201', offset: 0 });
      const created = await confirmCreation(page, form);
      const detail = await openDetail(page, created.codigo);
      await detail.getByRole('button', { name: 'Ir a check-in', exact: true }).click();
      const checkIn = page.getByRole('button', { name: 'Realizar check-in', exact: true });
      await expect(checkIn).toBeVisible();
      const snapshot = () => page.evaluate(() => ({ reservations: localStorage.getItem('vs-reservas'), rooms: localStorage.getItem('vs-habitaciones') }));
      const before = await snapshot();
      const alerts: string[] = [];
      page.on('dialog', async dialog => { alerts.push(dialog.message()); await dialog.accept(); });
      await page.route('**/api/habitaciones?*', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ mensaje: 'Consulta de habitaciones no disponible' }) }));
      await checkIn.click(); await expect.poll(() => alerts.length).toBe(1); expect(alerts[0]).toMatch(/no disponible/);
      expect(await snapshot()).toEqual(before); await page.unroute('**/api/habitaciones?*');
      await checkIn.click();
      await expect.poll(() => page.evaluate(code => JSON.parse(localStorage.getItem('vs-reservas')!).find((r: { codigo: string }) => r.codigo === code).estado, created.codigo)).toBe('en-curso');
      expect(alerts).toHaveLength(1);
      await page.reload();
      expect(await page.evaluate(code => JSON.parse(localStorage.getItem('vs-reservas')!).find((r: { codigo: string }) => r.codigo === code).estado, created.codigo)).toBe('en-curso');
      // A second reservation bridges while clean, then its room changes in the BFF.
      const secondForm = await prepareCreation(page, { room: '102', offset: 0 });
      const second = await confirmCreation(page, secondForm);
      const secondDetail = await openDetail(page, second.codigo);
      await secondDetail.getByRole('button', { name: 'Ir a check-in', exact: true }).click();
      await expect(checkIn).toBeVisible();
      const rooms: RoomState[] = await (await context.request.get('/api/habitaciones')).json();
      const room = rooms.find(r => r.numero === '102')!;
      const dirty = await context.request.post(`/api/habitaciones/${room.id}/marcar-sucia`, { headers: { Origin: new URL(page.url()).origin } });
      expect(dirty.status()).toBe(200);
      const unchanged = await snapshot(); await checkIn.click();
      await expect.poll(() => alerts.length).toBe(2); expect(alerts[1]).toMatch(/sucia/i);
      expect(await snapshot()).toEqual(unchanged);
      await page.reload();
      const dirtyDetail = await openDetail(page, second.codigo);
      await expect(dirtyDetail.getByRole('button', { name: 'Ir a check-in', exact: true })).toHaveCount(0);
      await expect(dirtyDetail).toContainText('El check-in requiere una habitación libre y limpia.');
      expect((await (await context.request.get(`/api/reservas/${second.codigo}`)).json()).estado).toBe('CONFIRMADA');
    });
  });
}
