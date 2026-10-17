import type { Page } from '@playwright/test';
import { DEMO_ACCOUNT_KEY, DEMO_NOW, initialDemoAccount, type DemoAccount } from '@/lib/mocks/cuenta';
import { test, expect, viewports, login } from './reception-fixtures';
import { expectNoOverflow } from './public-fixtures';

const accountPath = '/panel/recepcion/reservas/VS-DEMO-4C/cuenta';
const invoicePath = '/panel/recepcion/facturas/DEMO-000001';

async function storedAccount(page: Page): Promise<DemoAccount> {
  return page.evaluate(key => JSON.parse(localStorage.getItem(key)!), DEMO_ACCOUNT_KEY);
}

async function openAccount(page: Page, account = initialDemoAccount()) {
  await login(page);
  // Seed only this context's local demonstration account, never the server's data.
  await page.evaluate(({ key, account }) => localStorage.setItem(key, JSON.stringify(account)), { key: DEMO_ACCOUNT_KEY, account });
  await page.goto(accountPath);
  await expect(page.getByRole('heading', { name: 'Cuenta de VS-DEMO-4C', exact: true })).toBeVisible();
  await expect(page.getByTestId('account-balance')).toBeVisible();
}

async function checkoutDialog(page: Page) {
  await page.getByRole('button', { name: 'Realizar check-out', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Confirmar check-out', exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
}

for (const { name, viewport } of viewports) {
  test.describe(name, () => {
    test.use({ viewport });

    test('cargos y anulación, NIT inválido/CF, pago único y factura persistente con impresión', async ({ page }, testInfo) => {
      await openAccount(page);
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      await expect(page.getByText('Anulado: Cargo duplicado · Recepción (demo)', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Agregar cargo', exact: true }).click();
      await page.getByLabel('Concepto', { exact: true }).selectOption('Estacionamiento');
      await page.getByLabel('Cantidad', { exact: true }).fill('2');
      await page.getByLabel('Precio unitario (Q)', { exact: true }).fill('25');
      await page.getByRole('button', { name: 'Guardar cargo', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 175.00');
      await page.getByRole('button', { name: 'Anular Estacionamiento', exact: true }).click();
      await page.getByLabel('Motivo de anulación', { exact: true }).fill('Registrado por error');
      await page.getByRole('button', { name: 'Confirmar anulación', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      await expect(page.getByText('Anulado: Registrado por error · Recepción (demo)', { exact: true })).toBeVisible();
      const open = await storedAccount(page);
      expect(open.charges.find(charge => charge.concept === 'Estacionamiento')).toMatchObject({ status: 'ANULADO', quantity: 2, unitCents: 2500 });

      const dialog = await checkoutDialog(page);
      await dialog.getByLabel('Consumidor Final', { exact: true }).uncheck();
      await dialog.getByLabel('NIT', { exact: true }).fill('14-1');
      await expect(dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true })).toBeDisabled();
      await expect(dialog.getByText(/NIT inválido/)).toBeVisible();
      expect(await storedAccount(page)).toEqual(open);
      await dialog.getByLabel('Consumidor Final', { exact: true }).check();
      await dialog.getByLabel('Referencia (opcional)', { exact: true }).fill('REC-TEST');
      await dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 0.00');
      await expect(page.getByRole('link', { name: 'Ver factura e imprimir', exact: true })).toBeVisible();
      const closed = await storedAccount(page);
      expect(closed).toMatchObject({ status: 'CERRADA', reservation: 'FINALIZADA', room: 'LIBRE_SUCIA' });
      expect(closed.payments.filter(payment => payment.id === 'checkout-demo')).toEqual([
        { id: 'checkout-demo', date: DEMO_NOW, method: 'Efectivo', cents: 12500, status: 'APROBADO', reference: 'REC-TEST' },
      ]);
      expect(closed.orders).toEqual([{ id: 'order-demo', status: 'CANCELADO' }]);
      expect(closed.requests).toEqual([{ id: 'request-demo', status: 'CANCELADA' }]);
      await page.reload();
      await expect(page.getByRole('link', { name: 'Ver factura e imprimir', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Realizar check-out', exact: true })).toHaveCount(0);
      expect(await storedAccount(page)).toEqual(closed);
      await expectNoOverflow(page);
      await page.screenshot({ path: testInfo.outputPath('account-closed.png'), fullPage: true });
      await page.getByRole('link', { name: 'Ver factura e imprimir', exact: true }).click();
      const invoice = page.locator('main').getByRole('article', { name: 'Factura emitida', exact: true });
      await expect(invoice).toBeVisible();
      await expect(invoice.getByText('Lavandería', { exact: true })).toHaveCount(0);
      await expect(invoice.getByText('Estacionamiento', { exact: true })).toHaveCount(0);
      await expect(invoice).toContainText('CF — Consumidor Final');
      await expect(invoice).toContainText('Q 1,925.00');
      await expect(invoice.getByText('REC-TEST', { exact: false })).toBeVisible();
      for (const format of ['ticket', 'letter'] as const) {
        await page.getByLabel('Formato de impresión', { exact: true }).selectOption(format);
        await page.screenshot({ path: testInfo.outputPath(`${format}-screen.png`), fullPage: true });
        await page.emulateMedia({ media: 'print' });
        const printed = page.locator('body > .invoice-print');
        await expect(printed).toBeVisible();
        await expect(page.locator('main')).toBeHidden();
        await expect(printed.getByRole('button')).toHaveCount(0);
        const layout = await printed.locator('article').evaluate(element => ({
          width: element.getBoundingClientRect().width,
          fits: Array.from(element.querySelectorAll('.invoice-line')).every(line => {
            const parent = line.getBoundingClientRect();
            return Array.from(line.children).every(child => child.getBoundingClientRect().right <= parent.right + 1);
          }),
          overflow: element.scrollWidth > element.clientWidth,
        }));
        expect(layout.fits, `${format}: montos dentro del ancho`).toBe(true);
        expect(layout.overflow, `${format}: sin desbordamiento`).toBe(false);
        if (format === 'ticket') expect(Math.abs(layout.width - 72 * 96 / 25.4)).toBeLessThan(1);
        await page.pdf({ path: testInfo.outputPath(`${format}.pdf`), preferCSSPageSize: true, displayHeaderFooter: false, printBackground: true });
        await page.emulateMedia({ media: 'screen' });
      }
      await page.reload(); await expect(invoice).toBeVisible();
      expect(await storedAccount(page)).toEqual(closed);
      await page.getByRole('link', { name: 'Volver a la cuenta', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 0.00');
      await expectNoOverflow(page);
    });

    test('factura no emitida no permite imprimir', async ({ page }) => {
      await openAccount(page);
      const original = await storedAccount(page);
      await page.goto(invoicePath);
      await expect(page.getByRole('alert').filter({ hasText: 'Todavía no existe una factura emitida' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Imprimir', exact: true })).toHaveCount(0);
      await expect(page.getByRole('article', { name: 'Factura emitida', exact: true })).toHaveCount(0);
      expect(await storedAccount(page)).toEqual(original);
      await page.getByRole('link', { name: 'Volver a la cuenta', exact: true }).click();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
    });

    test('pedido en camino bloquea check-out sin cambiar cuenta', async ({ page }) => {
      const account: DemoAccount = { ...initialDemoAccount(), orders: [{ id: 'delivery', status: 'EN_CAMINO' }] };
      await openAccount(page, account);
      await expect(page.getByRole('button', { name: 'Realizar check-out', exact: true })).toBeDisabled();
      await expect(page.getByRole('status').filter({ hasText: 'Hay un pedido en camino' })).toBeVisible();
      await expect(page.getByRole('dialog', { name: 'Confirmar check-out', exact: true })).toHaveCount(0);
      expect(await storedAccount(page)).toEqual(account);
      await expectNoOverflow(page);
    });

    test('saldo cero acepta NIT con K, emite factura y no agrega pago', async ({ page }) => {
      const account: DemoAccount = { ...initialDemoAccount(), payments: [{ id: 'approved', date: DEMO_NOW, method: 'Tarjeta', cents: 192500, status: 'APROBADO' }] };
      await openAccount(page, account);
      await expect(page.getByTestId('account-balance')).toHaveText('Q 0.00');
      const dialog = await checkoutDialog(page);
      await expect(dialog.getByLabel('Método de pago', { exact: true })).toHaveCount(0);
      await dialog.getByLabel('Consumidor Final', { exact: true }).uncheck();
      await dialog.getByLabel('NIT', { exact: true }).fill('6-K');
      await expect(dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true })).toBeEnabled();
      await dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true }).click();
      await expect(page.getByRole('link', { name: 'Ver factura e imprimir', exact: true })).toBeVisible();
      const closed = await storedAccount(page);
      expect(closed.payments).toEqual(account.payments);
      expect(closed.invoice).toMatchObject({ nit: '6-K', totalCents: 192500 });
      await page.getByRole('link', { name: 'Ver factura e imprimir', exact: true }).click();
      await expect(page.locator('main article')).toContainText('NIT: 6-K');
    });

    test('fallo de almacenamiento mantiene saldo, cuenta y ausencia de factura', async ({ page }) => {
      await openAccount(page);
      const original = await storedAccount(page);
      await page.evaluate(key => {
        const write = Storage.prototype.setItem;
        Storage.prototype.setItem = function (name, value) {
          if (name === key) throw new Error('No se pudo guardar la operación de prueba.');
          return write.call(this, name, value);
        };
      }, DEMO_ACCOUNT_KEY);
      const dialog = await checkoutDialog(page);
      await dialog.getByRole('button', { name: 'Confirmar y emitir factura', exact: true }).click();
      await expect(dialog.getByRole('alert')).toHaveText('No se pudo guardar la operación de prueba.');
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      await expect(page.getByRole('link', { name: 'Ver factura e imprimir', exact: true })).toHaveCount(0);
      expect(await storedAccount(page)).toEqual(original);
      await page.reload();
      await expect(page.getByTestId('account-balance')).toHaveText('Q 125.00');
      expect(await storedAccount(page)).toEqual(original);
    });

    test('sin sesión redirige al login y Mantenimiento no ve cuenta ni factura', async ({ page }) => {
      await page.goto(accountPath);
      await expect(page).toHaveURL(/\/panel\/login$/);
      const session = page.waitForResponse(response => new URL(response.url()).pathname === '/api/auth/yo');
      await page.reload(); await (await session).finished();
      await page.getByLabel('Correo electrónico', { exact: true }).fill('mantenimiento@villaserena.gt');
      await page.getByLabel('Contraseña', { exact: true }).fill('VillaSerena26');
      await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
      await expect(page).toHaveURL(/\/mantenimiento$/);
      for (const path of [accountPath, invoicePath]) {
        await page.goto(path);
        await expect(page.getByRole('heading', { name: 'Acceso denegado', exact: true })).toBeVisible();
        await expect(page.getByTestId('account-balance')).toHaveCount(0);
        await expect(page.getByRole('button', { name: 'Realizar check-out', exact: true })).toHaveCount(0);
        await expect(page.getByRole('article', { name: 'Factura emitida', exact: true })).toHaveCount(0);
        expect(await page.evaluate(key => localStorage.getItem(key), DEMO_ACCOUNT_KEY)).toBeNull();
      }
    });
  });
}
