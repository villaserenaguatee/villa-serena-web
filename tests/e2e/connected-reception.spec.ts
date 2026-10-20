import { access } from 'node:fs/promises';
import { test, expect, viewports, hotelDate } from './reception-fixtures';

const message = 'No se pudo conectar con el servicio. Intenta nuevamente más tarde.';
for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('configuración mixta bloquea páginas y BFF sin activar datos demo', async ({ page, context, baseURL }) => {
      for (const path of ['/recepcion', '/recepcion/reservas', '/recepcion/reservas/VS-TEST01']) {
        const response = await page.goto(path);
        expect(response?.status()).toBe(503);
        await expect(page.locator('body')).toHaveText(message);
        await expect(page.getByRole('button')).toHaveCount(0);
      }
      const before = await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }));
      const query = `entrada=${hotelDate(1)}&salida=${hotelDate(3)}`;
      for (const route of ['/api/auth/yo', '/api/reservas', `/api/reservas/calendario?desde=${hotelDate()}&hasta=${hotelDate(3)}`, `/api/reservas/disponibilidad?${query}&huespedes=1`, '/api/reservas/VS-TEST01', '/api/reservas/VS-TEST01/cancelacion', '/api/habitaciones', `/api/habitaciones/disponibles?tipoHabitacionId=1&${query}`]) {
        const response = await context.request.get(route);
        expect(response.status(), route).toBe(503);
        expect(await response.json()).toMatchObject({ codigo: 'CONFIGURACION_INVALIDA', mensaje: message });
      }
      for (const [method, route, data] of [
        ['POST', '/api/reservas', {}], ['POST', '/api/huespedes', {}],
        ['POST', '/api/reservas/VS-TEST01/cancelar', { motivo: 'No debe ejecutarse' }],
        ['PUT', '/api/reservas/VS-TEST01/habitacion', { habitacionId: 102 }],
      ] as const) {
        const response = await context.request.fetch(route, { method, headers: { Origin: baseURL! }, data });
        expect(response.status(), `${method} ${route}`).toBe(503);
        expect(await response.json()).toMatchObject({ codigo: 'CONFIGURACION_INVALIDA', mensaje: message });
      }
      expect(await page.evaluate(() => ({ local: { ...localStorage }, session: { ...sessionStorage } }))).toEqual(before);
      await page.reload();
      await expect(page.locator('body')).toHaveText(message);
      const file = process.env.ISSUE48_RECEPTION_STATE_PATH;
      expect(file).toBeTruthy();
      await expect(access(file!)).rejects.toMatchObject({ code: 'ENOENT' });
    });
  });
}
