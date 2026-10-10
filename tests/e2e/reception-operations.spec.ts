import { test, expect, login, openDetail, viewports } from './reception-fixtures';
import type { Page } from '@playwright/test';
import type { ReservationPage } from '@/lib/bff/contracts/reception';

async function search(page: Page, action: () => Promise<unknown>) {
  const result = page.waitForResponse(r => new URL(r.url()).pathname === '/api/reservas' && r.request().method() === 'GET' && r.status() === 200).then(r => r.json() as Promise<ReservationPage>);
  await action(); const data = await result;
  await expect(page.getByText(`${data.totalElementos} reservas`, { exact: true })).toBeVisible();
  return data;
}

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    test('búsqueda, validación sin peticiones, canal externo y puente a cuenta', async ({ page, context }) => {
      await page.goto('/recepcion/reservas'); await expect(page).toHaveURL(/\/panel\/login$/);
      await login(page); await page.goto('/recepcion/reservas');
      await expect(page.getByText('14 reservas', { exact: true })).toBeVisible();
      await page.getByLabel('Nombre o documento', { exact: true }).fill('Marta');
      await page.getByLabel('Canal de origen', { exact: true }).selectOption('BOOKING');
      const filtered = await search(page, () => page.getByRole('button', { name: 'Buscar', exact: true }).click());
      expect(filtered.totalElementos).toBe(1); expect(filtered.contenido[0].codigo).toBe('VS-CANA01');
      const detail = await openDetail(page, 'VS-CANA01');
      await expect(detail).toContainText('Identificador externo: BOOKING-PRUEBA');
      await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(0);
      expect((await context.request.post('/api/reservas/VS-CANA01/cancelar', { headers: { Origin: new URL(page.url()).origin }, data: { motivo: 'Prueba' } })).status()).toBe(409);
      await detail.getByRole('button', { name: 'Ver cuenta', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Cuenta y pagos', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Resumen', exact: true })).toHaveCount(0);
      await page.goto('/recepcion/reservas'); await expect(page.getByText('14 reservas', { exact: true })).toBeVisible();
      let requests = 0;
      page.on('request', r => { if (new URL(r.url()).pathname === '/api/reservas') requests++; });
      await page.getByLabel('Código de reserva', { exact: true }).fill('VS-INVALIDO');
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'Indica el código completo de reserva' })).toBeVisible(); expect(requests).toBe(0);
      await page.getByLabel('Código de reserva', { exact: true }).fill('');
      await page.getByLabel('Desde', { exact: true }).fill('2026-11-10'); await page.getByLabel('Hasta', { exact: true }).fill('2026-11-01');
      await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      await expect(page.getByRole('alert').filter({ hasText: 'Selecciona un rango de fechas válido.' })).toBeVisible(); expect(requests).toBe(0);
      await search(page, () => page.getByRole('button', { name: 'Limpiar filtros', exact: true }).click());
      for (const [label, state] of [['Llegan hoy', 'CONFIRMADA'], ['Salen hoy', 'EN_ESTADIA']]) {
        const result = await search(page, () => page.getByRole('button', { name: label, exact: true }).click());
        expect(result.contenido.length).toBeGreaterThan(0); expect(result.contenido.every(r => r.estado === state)).toBe(true);
      }
      expect(await page.evaluate(() => document.cookie.includes('vs_staff_'))).toBe(false);
    });
    test('acciones por estado, asignación y cancelación con los tres resultados de reembolso demo', async ({ page, context }) => {
      await login(page);
      let detail = await openDetail(page, 'VS-TEST01');
      for (const action of ['Cancelar reserva', 'Cambiar habitación']) await expect(detail.getByRole('button', { name: action, exact: true })).toHaveCount(0);
      await expect(detail.getByRole('button', { name: 'Ir a check-out', exact: true })).toBeVisible();
      detail = await openDetail(page, 'VS-TEST05');
      await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(0);
      await detail.getByRole('button', { name: /Asignar habitación|Cambiar habitación/ }).click();
      const select = detail.getByLabel('Habitación', { exact: true });
      await expect(select.locator('option').nth(1)).toBeAttached();
      const options = await select.locator('option').evaluateAll(elements => elements.map(e => (e as HTMLOptionElement).value).filter(Boolean));
      expect(options.length).toBeGreaterThan(0); await select.selectOption(options[0]);
      await detail.getByRole('button', { name: 'Guardar asignación', exact: true }).click();
      await expect(detail.getByRole('status')).toContainText('Habitación asignada en la simulación.');
      expect((await (await context.request.get('/api/reservas/VS-TEST05')).json()).habitacion).not.toBeNull();
      for (const [code, preview, rejected] of [['VS-PAGO03', 'Corresponde un reembolso total', true], ['VS-PAGO02', 'No corresponde reembolso', false], ['VS-PAGO01', 'Corresponde un reembolso total', false]] as const) {
        detail = await openDetail(page, code); await detail.getByRole('button', { name: 'Cancelar reserva', exact: true }).click();
        await expect(detail).toContainText(preview);
        const reason = `Prueba Issue48 ${code}`; await detail.getByLabel('Motivo de cancelación').fill(reason);
        await detail.getByRole('button', { name: 'Confirmar cancelación de prueba', exact: true }).click();
        if (rejected) await expect(detail.getByRole('alert')).toContainText('El reembolso de prueba fue rechazado');
        else {
          await expect(detail.getByRole('status')).toContainText('Reserva cancelada en la simulación.');
          await expect(detail.getByText(reason, { exact: true })).toBeVisible();
          await expect(detail.getByRole('button', { name: 'Cancelar reserva', exact: true })).toHaveCount(0);
        }
        expect((await (await context.request.get(`/api/reservas/${code}`)).json()).estado).toBe(rejected ? 'CONFIRMADA' : 'CANCELADA');
        await page.reload(); await expect(detail).toContainText(rejected ? 'Confirmada' : 'Cancelada');
      }
      await page.goto('/recepcion/reservas'); await expect(page.getByText('14 reservas', { exact: true })).toBeVisible();
      await page.getByLabel('Código de reserva', { exact: true }).fill('VS-PAGO01');
      const cancelled = await search(page, () => page.getByRole('button', { name: 'Buscar', exact: true }).click());
      expect(cancelled.contenido).toHaveLength(1); expect(cancelled.contenido[0].estado).toBe('CANCELADA');
    });
    test('habitaciones: permisos de acción, condición persistida y filtros combinados', async ({ page }) => {
      await login(page); await page.goto('/recepcion/habitaciones');
      await expect(page.locator('[data-room="101"]')).toBeVisible();
      for (const number of ['101', '104', '110', '209']) await expect(page.locator(`[data-room="${number}"]`).getByRole('button', { name: 'Marcar sucia', exact: true })).toHaveCount(0);
      const room = page.locator('[data-room="102"]'); await room.getByRole('button', { name: 'Marcar sucia', exact: true }).click();
      await expect(page.getByRole('status')).toContainText('Habitación 102 marcada sucia en la simulación.');
      await expect(room).toContainText('Sucia'); await expect(room.getByRole('button', { name: 'Marcar sucia', exact: true })).toHaveCount(0);
      await page.reload(); await expect(room).toContainText('Sucia');
      for (const [label, value] of [['Ocupación', 'LIBRE'], ['Condición', 'SUCIA'], ['Tipo', '1'], ['Piso', '2']]) await page.getByLabel(label, { exact: true }).selectOption(value);
      await expect(page.locator('[data-room]')).toHaveCount(1); await expect(page.locator('[data-room="209"]')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
    });
  });
}

test('administrador no puede acceder a páginas ni API de Recepción', async ({ page, context }) => {
  await login(page, 'admin@villaserena.gt'); await page.goto('/recepcion/reservas');
  await expect(page.getByRole('heading', { name: 'Acceso denegado' })).toBeVisible();
  for (const path of ['habitaciones', 'reservas', 'reservas/VS-TEST01']) expect((await context.request.get(`/api/${path}`)).status()).toBe(403);
});

test('login espera la consulta inicial de sesión antes de permitir enviar credenciales', async ({ page }) => {
  let release!: () => void;
  const ready = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/api/auth/yo', async route => { await ready; await route.continue(); });
  try {
    await page.goto('/panel/login');
    await page.getByLabel('Correo electrónico', { exact: true }).fill('recepcion@villaserena.gt');
    await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
    const submit = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
    await expect(submit).toBeDisabled(); release(); await expect(submit).toBeEnabled();
    await submit.click(); await expect(page).toHaveURL(/\/recepcion$/);
  } finally { release(); }
});
