import { accountCode } from './account-api';
import { test, expect, viewports, login, expectNoDemoStorage, expectNoOverflow } from './account-fixtures';

const accountPath = `/panel/recepcion/reservas/${accountCode}/cuenta`;
const invoicePath = '/panel/recepcion/facturas/1';

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });

    test('cargos, anulación, fallo sin cobro, confirmación única y factura fiscal del servidor', async ({ page, context, baseURL, mock }, testInfo) => {
      await login(context, baseURL!);
      await page.goto(accountPath);
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      await expect(page.getByText('Anulado: Duplicado · Ana', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Agregar cargo', exact: true }).click();
      await page.getByLabel('Cantidad', { exact: true }).fill('2');
      await page.getByLabel('Precio unitario (Q)', { exact: true }).fill('25');
      await page.getByRole('button', { name: 'Guardar cargo', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 175.00');
      expect((await mock.state()).calls.find(call => call.method === 'POST' && call.path.endsWith('/cargos'))?.body).toEqual({ concepto: 'Restaurante', cantidad: 2, precioUnitario: 25 });
      await page.getByRole('button', { name: 'Anular Restaurante', exact: true }).last().click();
      await page.getByLabel('Motivo de anulación', { exact: true }).fill('Error de registro');
      await page.getByRole('button', { name: 'Confirmar anulación', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      await expect(page.getByText('Anulado: Error de registro · Ana', { exact: true })).toBeVisible();
      const before = (await mock.state()).account;
      await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Confirmar check-out', exact: true });
      await expect(dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true })).toBeEnabled();
      await dialog.getByLabel('Referencia (opcional)', { exact: true }).fill('REC-12');
      await mock.configure({ fail: true });
      await dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true }).click();
      await expect(dialog.getByRole('alert')).toContainText('No se pudo emitir la factura; no se cobró el pago.');
      const failed = await mock.state();
      expect(failed.account).toEqual(before); expect(failed.invoice).toBeNull(); expect(failed.checkoutCalls).toBe(1);
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      await expect(page.getByRole('link', { name: 'Ver factura e imprimir', exact: true })).toHaveCount(0);
      await mock.configure({ fail: false, checkoutDelayMs: 300 });
      await dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true }).dblclick();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 0.00');
      await expect(page.getByRole('link', { name: 'Ver factura e imprimir', exact: true })).toBeVisible();
      const closed = await mock.state();
      expect(closed.checkoutCalls).toBe(2);
      expect(closed.account).toMatchObject({ estadoCuenta: 'CERRADA', estadoReserva: 'FINALIZADA', saldo: 0, facturaId: 1 });
      expect(closed.account.pagos.filter(payment => payment.id === 3)).toEqual([
        { id: 3, fechaHora: '2026-10-08T16:00:00Z', metodo: 'EFECTIVO', monto: 125, estado: 'APROBADO', referencia: 'REC-12', responsable: 'Recepción' },
      ]);
      expect(closed.calls.filter(call => call.method === 'POST' && call.path.endsWith(`/checkout/${accountCode}`)).map(call => call.body)).toEqual([
        { comprador: { nombreComprador: 'Ana Morales', nit: 'CF' }, pago: { metodo: 'EFECTIVO', referencia: 'REC-12' } },
        { comprador: { nombreComprador: 'Ana Morales', nit: 'CF' }, pago: { metodo: 'EFECTIVO', referencia: 'REC-12' } },
      ]);
      await expectNoOverflow(page); await expectNoDemoStorage(page);
      await page.getByRole('link', { name: 'Ver factura e imprimir', exact: true }).click();
      const invoice = page.locator('main article');
      await expect(invoice.getByRole('heading', { name: 'Hotel del API', exact: true })).toBeVisible();
      for (const text of ['Empresa del API', 'Dirección fiscal de prueba', '1234567-9', 'hotel@example.test', '55550000', 'CF — Consumidor Final', 'Q 725.00']) await expect(invoice).toContainText(text);
      await expect(invoice.getByText('Lavandería', { exact: true })).toHaveCount(0);
      expect(closed.invoice?.cargos).toHaveLength(2);
      expect(closed.invoice?.pagos).toHaveLength(2);
      for (const format of ['ticket', 'letter'] as const) {
        await page.getByLabel('Formato de impresión', { exact: true }).selectOption(format);
        await page.screenshot({ path: testInfo.outputPath(`${format}.png`), fullPage: true });
        await page.emulateMedia({ media: 'print' });
        await expect(page.locator('main')).toBeHidden();
        const printed = page.locator('body > .invoice-print');
        await expect(printed).toBeVisible(); await expect(printed.getByRole('button')).toHaveCount(0);
        const layout = await printed.locator('article').evaluate(element => ({
          width: element.getBoundingClientRect().width, overflow: element.scrollWidth > element.clientWidth,
          fits: Array.from(element.querySelectorAll('.invoice-line')).every(line => {
            const parent = line.getBoundingClientRect();
            return Array.from(line.children).every(child => child.getBoundingClientRect().right <= parent.right + 1);
          }),
        }));
        expect(layout.overflow).toBe(false); expect(layout.fits).toBe(true);
        if (format === 'ticket') expect(Math.abs(layout.width - 72 * 96 / 25.4)).toBeLessThan(1);
        await page.pdf({ path: testInfo.outputPath(`${format}.pdf`), preferCSSPageSize: true });
        await page.emulateMedia({ media: 'screen' });
      }
      await page.reload(); await expect(invoice).toBeVisible();
      await expectNoDemoStorage(page);
      expect((await mock.state()).account).toEqual(closed.account);
      expect((await mock.state()).checkoutCalls).toBe(2);
      await page.getByRole('link', { name: 'Volver a la cuenta', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 0.00');
      await expect(page.getByRole('button', { name: 'Realizar check-out', exact: true })).toHaveCount(0);
      await expectNoOverflow(page);
    });

    test('pedido en camino y NIT inválido no envían confirmación', async ({ page, context, baseURL, mock }) => {
      await login(context, baseURL!); await page.goto(accountPath);
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      const original = (await mock.state()).account;
      await mock.configure({ block: true });
      await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
      let dialog = page.getByRole('dialog', { name: 'Confirmar check-out', exact: true });
      await expect(dialog.getByRole('alert')).toContainText('Hay un pedido en camino');
      await expect(dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true })).toBeDisabled();
      await dialog.getByRole('button', { name: 'Volver a la cuenta', exact: true }).click();
      await mock.configure({ block: false });
      await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Confirmar check-out', exact: true });
      await dialog.getByLabel('Consumidor Final', { exact: true }).uncheck();
      await dialog.getByLabel('NIT', { exact: true }).fill('14-1');
      await expect(dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true })).toBeDisabled();
      await expect(dialog.getByText(/NIT inválido/)).toBeVisible();
      const state = await mock.state(); expect(state.checkoutCalls).toBe(0); expect(state.account).toEqual(original);
      await expectNoDemoStorage(page); await expectNoOverflow(page);
    });

    test('saldo cero omite pago del contrato y conserva pagos anteriores', async ({ page, context, baseURL, mock }) => {
      await mock.configure({ paid: true });
      const before = (await mock.state()).account;
      await login(context, baseURL!); await page.goto(accountPath);
      await expect(page.getByTestId('account-balance')).toHaveText('Q 0.00');
      await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Confirmar check-out', exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByLabel('Método de pago', { exact: true })).toHaveCount(0);
      await dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true }).click();
      await expect(page.getByRole('link', { name: 'Ver factura e imprimir', exact: true })).toBeVisible();
      const closed = await mock.state(); expect(closed.checkoutCalls).toBe(1); expect(closed.account.pagos).toEqual(before.pagos);
      expect(closed.calls.find(call => call.method === 'POST' && call.path.endsWith(`/checkout/${accountCode}`))?.body).toEqual({ comprador: { nombreComprador: 'Ana Morales', nit: 'CF' } });
      await expectNoDemoStorage(page); await expectNoOverflow(page);
    });

    test('fallo del API no activa cuenta demo; código demo inválido tampoco permite check-out', async ({ page, context, baseURL, mock }) => {
      await mock.configure({ unavailable: true });
      await login(context, baseURL!); await page.goto(accountPath);
      await expect(page.getByRole('alert').filter({ hasText: 'Cuenta no disponible en el API de prueba.' })).toBeVisible();
      await expect(page.getByTestId('account-balance')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Realizar check-out', exact: true })).toHaveCount(0);
      await expectNoDemoStorage(page);
      const before = await mock.state();
      // Next may return HTTP 200 when streaming its not-found boundary in dev.
      await page.goto('/panel/recepcion/reservas/VS-DEMO-4C/cuenta');
      await expect(page.getByTestId('account-balance')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Realizar check-out', exact: true })).toHaveCount(0);
      await expectNoDemoStorage(page);
      const after = await mock.state(); expect(after.checkoutCalls).toBe(0); expect(after.account).toEqual(before.account); expect(after.calls).toEqual(before.calls);
    });

    test('factura inexistente no ofrece artículo ni impresión', async ({ page, context, baseURL, mock }) => {
      await login(context, baseURL!); await page.goto(invoicePath);
      await expect(page.getByRole('alert').filter({ hasText: 'Todavía no existe una factura emitida' })).toBeVisible();
      await expect(page.getByRole('article', { name: 'Factura emitida', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Imprimir', exact: true })).toHaveCount(0);
      expect((await mock.state()).checkoutCalls).toBe(0);
      await expectNoDemoStorage(page);
    });

    test('Administración recibe 403 sin llamadas de cuenta; Origin ajeno no confirma', async ({ page, context, browser, baseURL, mock }) => {
      await login(context, baseURL!, 'ADMIN');
      const before = await mock.state();
      for (const path of [`cuentas/${accountCode}`, `checkout/${accountCode}`, 'facturas/1']) expect((await context.request.get(`/api/${path}`)).status()).toBe(403);
      for (const path of [accountPath, invoicePath]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { name: 'Acceso denegado', exact: true })).toBeVisible();
        await expect(page.getByTestId('account-balance')).toHaveCount(0);
      }
      expect((await mock.state()).calls).toEqual(before.calls);
      await expectNoDemoStorage(page);
      const reception = await browser.newContext({ baseURL });
      try {
        await login(reception, baseURL!);
        expect((await reception.request.post(`/api/checkout/${accountCode}`, { headers: { Origin: 'https://ajeno.test' }, data: {} })).status()).toBe(403);
        const after = await mock.state(); expect(after.calls).toEqual(before.calls); expect(after.checkoutCalls).toBe(0);
      } finally { await reception.close(); }
    });
  });
}
