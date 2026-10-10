import { test, expect, viewports, expectNoOverflow } from './public-fixtures';

const scenarios = [
  { code: 'VS-DEMO01', title: 'Tu reserva está confirmada', retry: false },
  { code: 'VS-DEMO02', title: 'Pago en proceso', retry: true, actions: ['Consultar estado', 'Reintentar pago'] },
  { code: 'VS-DEMO03', title: 'Pago no completado', retry: true, actions: ['Reintentar pago', 'Consultar estado'] },
  { code: 'VS-DEMO04', title: 'Pago no completado', retry: false, actions: ['Hacer nueva reserva'] },
] as const;

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });
    for (const scenario of scenarios) {
      test(`${scenario.code}: estado real, acciones y reintento sin otra reserva`, async ({ page }, testInfo) => {
        await page.clock.install();
        const creates: string[] = [];
        page.on('request', request => {
          if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/publico/reservas') creates.push(request.url());
        });
        await page.goto(`/reserva/resultado?codigo=${scenario.code}&paid=true&success=true&estadoPago=APROBADO`);
        await expect(page.getByRole('heading', { name: scenario.title, exact: true })).toBeVisible();
        await expect(page.locator('.payment-result-summary > div')).toHaveCount(3);
        await expect(page.getByRole('button', { name: 'Reintentar pago', exact: true })).toHaveCount(scenario.retry ? 1 : 0);
        const summaryLink = page.getByRole('link', { name: 'Ver mi reserva', exact: true });
        await expect(summaryLink).toHaveCount(scenario.code === 'VS-DEMO01' ? 1 : 0);
        if (scenario.code === 'VS-DEMO01') await expect(summaryLink).toHaveAttribute('href', `/reserva/detalle?codigo=${scenario.code}`);
        if ('actions' in scenario) await expect(page.locator('.payment-status-actions button, .payment-status-actions a')).toHaveText([...scenario.actions]);
        if (scenario.code === 'VS-DEMO04') await expect(page.getByRole('link', { name: 'Hacer nueva reserva', exact: true })).toHaveAttribute('href', '/catalogo');
        await expect(page.locator('main')).not.toContainText(/PAGO DE PRUEBA|integración|simulación/i);
        await expectNoOverflow(page);
        if (scenario.code === 'VS-DEMO02') {
          await page.clock.fastForward(61_000);
          await expect(page.getByRole('heading', { name: 'Pago en proceso', exact: true })).toBeVisible();
          let release!: () => void;
          const gate = new Promise<void>(resolve => { release = resolve; });
          const routePattern = `**/api/publico/reservas/${scenario.code}/estado`;
          await page.route(routePattern, async route => { await gate; await route.continue(); });
          try {
            await page.getByRole('button', { name: 'Consultar estado', exact: true }).click();
            await expect(page.getByRole('button', { name: 'Consultando…', exact: true })).toBeVisible();
          } finally { release(); }
          await expect(page.getByRole('status').filter({ hasText: 'Estado actualizado.' })).toBeVisible();
          await page.unroute(routePattern);
        }
        await page.screenshot({ path: testInfo.outputPath('resultado.png'), fullPage: true });
        if (scenario.retry) {
          const payment = page.waitForRequest(request => request.method() === 'POST' && new URL(request.url()).pathname === `/api/publico/reservas/${scenario.code}/pago`);
          await page.getByRole('button', { name: 'Reintentar pago', exact: true }).click();
          await payment;
          await expect(page).toHaveURL(url => url.searchParams.get('codigo') === scenario.code && !url.searchParams.has('paid'));
          await expect(page.getByRole('heading', { name: scenario.title, exact: true })).toBeVisible();
        }
        expect(creates).toEqual([]);
      });
    }

    test('estado actualizado impide cobrar una reserva cancelada', async ({ page }) => {
      const statusRoute = '**/api/publico/reservas/VS-DEMO03/estado';
      await page.route(statusRoute, route => route.fulfill({ headers: { 'X-Villa-Serena-Mode': 'demo' }, json: { codigo: 'VS-DEMO03', estadoReserva: 'PENDIENTE_PAGO', estadoPago: 'FALLIDO', puedeReintentar: true } }));
      await page.goto('/reserva/resultado?codigo=VS-DEMO03');
      await expect(page.getByText('Venció el intento de pago.', { exact: false })).toBeVisible();
      await expect(page.locator('main')).not.toContainText(/rechazo bancario|banco rechaz/i);
      await page.unroute(statusRoute);
      await page.route(statusRoute, route => route.fulfill({ headers: { 'X-Villa-Serena-Mode': 'demo' }, json: { codigo: 'VS-DEMO03', estadoReserva: 'CANCELADA', estadoPago: 'FALLIDO', puedeReintentar: false } }));
      const mutations: string[] = [];
      page.on('request', request => { if (request.method() === 'POST') mutations.push(request.url()); });
      await page.getByRole('button', { name: 'Reintentar pago', exact: true }).click();
      await expect(page.getByRole('link', { name: 'Hacer nueva reserva', exact: true })).toBeVisible();
      expect(mutations).toEqual([]);
    });
  });
}
