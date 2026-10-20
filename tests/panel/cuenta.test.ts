import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  accountTotals, addDemoCharge, checkoutBlock, confirmDemoCheckout,
  initialDemoAccount, validGuatemalaNit, voidDemoCharge,
} from '../../src/lib/mocks/cuenta';

const date = '2026-10-08T16:00:00.000Z';
const checkout = { buyer: 'Ana Morales', nit: 'CF', method: 'Efectivo' as const };

test('saldo: cargos vigentes menos pagos aprobados; no cuenta anulados ni fallidos', () => {
  const account = initialDemoAccount();
  account.payments.push({ id: 'pending', date, method: 'Tarjeta', cents: 5000, status: 'PENDIENTE' }, { id: 'refunded', date, method: 'Tarjeta', cents: 5000, status: 'REEMBOLSADO' });
  assert.deepEqual(accountTotals(account), { charges: 192500, payments: 180000, balance: 12500 });
});
test('NIT con dígito y K, guion, sin guion; rechaza cero, texto y dígito incorrecto', () => {
  // 1×3 + 4×2 = 11, cuyo verificador es 0; 1×2 = 2, cuyo verificador es 9.
  assert.equal(validGuatemalaNit('14-0'), true);
  assert.equal(validGuatemalaNit('140'), true);
  assert.equal(validGuatemalaNit('19'), true);
  assert.equal(validGuatemalaNit('6-k'), true);
  for (const nit of ['14-1', '6-0', '0000', 'CF', '123ABC', '1', '', '1234567890123']) assert.equal(validGuatemalaNit(nit), false, nit);
});
test('agregar cargo calcula monto, registra responsable y no modifica el original', () => {
  const account = initialDemoAccount();
  const snapshot = JSON.stringify(account);
  const next = addDemoCharge(account, { concept: 'Lavandería', quantity: 2, unitCents: 1500 }, 'new', date);
  assert.equal(accountTotals(next).balance, 15500);
  assert.equal(next.charges.at(-1)?.responsible, 'Recepción (demo)');
  assert.equal(JSON.stringify(account), snapshot);
});
test('no agrega cargos en cuenta cerrada o fuera de estadía ni con valores inválidos', () => {
  const account = initialDemoAccount();
  const input = { concept: 'Otro', quantity: 1, unitCents: 100 };
  for (const state of [{ ...account, status: 'CERRADA' as const }, { ...account, reservation: 'CONFIRMADA' as const }]) assert.throws(() => addDemoCharge(state, input, 'new', date));
  for (const change of [{ quantity: 0 }, { quantity: NaN }, { unitCents: 0 }, { unitCents: 1.5 }, { concept: ' ' }]) assert.throws(() => addDemoCharge(account, { ...input, ...change }, 'new', date));
});
test('anulación conserva el cargo, su motivo y responsable; alojamiento no se anula', () => {
  const account = initialDemoAccount();
  assert.throws(() => voidDemoCharge(account, 'restaurant', ' '));
  assert.throws(() => voidDemoCharge(account, 'night-0', 'Error'));
  const next = voidDemoCharge(account, 'restaurant', 'Registrado por error');
  assert.equal(next.charges.length, account.charges.length);
  assert.equal(accountTotals(next).balance, 0);
  assert.equal(next.charges.find(c => c.id === 'restaurant')?.voidReason, 'Registrado por error');
  assert.equal(next.charges.find(c => c.id === 'restaurant')?.voidResponsible, 'Recepción (demo)');
  assert.throws(() => voidDemoCharge({ ...account, status: 'CERRADA' }, 'restaurant', 'Error'));
});
test('check-out bloquea pedido en camino, cuenta cerrada, fuera de estadía y saldo negativo', () => {
  const account = initialDemoAccount();
  const states = [
    { ...account, orders: [{ id: 'delivery', status: 'EN_CAMINO' as const }] },
    { ...account, status: 'CERRADA' as const }, { ...account, reservation: 'CONFIRMADA' as const },
    { ...account, payments: [{ id: 'overpaid', date, method: 'Tarjeta', cents: 200000, status: 'APROBADO' as const }] },
  ];
  for (const state of states) {
    const before = JSON.stringify(state);
    assert.ok(checkoutBlock(state));
    assert.throws(() => confirmDemoCheckout(state, checkout, date));
    assert.equal(JSON.stringify(state), before);
  }
});
test('error de NIT, comprador o método no registra pago ni cambia estados', () => {
  const account = initialDemoAccount();
  const before = JSON.stringify(account);
  for (const change of [{ nit: '14-1' }, { buyer: ' ' }, { method: undefined }]) assert.throws(() => confirmDemoCheckout(account, { ...checkout, ...change }, date));
  assert.equal(JSON.stringify(account), before);
  assert.equal(account.invoice, undefined);
});
test('check-out: pago exacto, factura única, cierre y cancelación de pendientes', () => {
  const account = initialDemoAccount();
  account.orders.push({ id: 'delivered', status: 'ENTREGADO' });
  account.requests.push({ id: 'done', status: 'ATENDIDA' });
  const result = confirmDemoCheckout(account, { ...checkout, reference: ' REC-123 ' }, date);
  assert.equal(result.payments.at(-1)?.cents, 12500);
  assert.equal(result.payments.at(-1)?.reference, 'REC-123');
  assert.equal(accountTotals(result).balance, 0);
  assert.equal(result.status, 'CERRADA');
  assert.equal(result.reservation, 'FINALIZADA');
  assert.equal(result.room, 'LIBRE_SUCIA');
  assert.deepEqual(result.orders.map(o => o.status), ['CANCELADO', 'ENTREGADO']);
  assert.deepEqual(result.requests.map(r => r.status), ['CANCELADA', 'ATENDIDA']);
  assert.equal(result.invoice?.totalCents, 192500);
  assert.equal(result.invoice?.charges.length, 4);
  assert.equal(result.invoice?.payments.length, 2);
  assert.equal(result.invoice?.nit, 'CF');
  assert.equal(confirmDemoCheckout(result, checkout, date), result);
  assert.equal(result.payments.filter(p => p.id === 'checkout-demo').length, 1);
});
test('saldo cero: no pide método ni crea pago; NIT válido y habitación fuera de servicio', () => {
  const account = voidDemoCharge(initialDemoAccount(), 'restaurant', 'Error');
  account.room = 'FUERA_SERVICIO';
  const result = confirmDemoCheckout(account, { buyer: 'Ana', nit: '6-k' }, date);
  assert.equal(result.payments.length, account.payments.length);
  assert.equal(result.invoice?.nit, '6-K');
  assert.equal(result.room, 'FUERA_SERVICIO');
  assert.throws(() => addDemoCharge(result, { concept: 'Otro', quantity: 1, unitCents: 100 }, 'new', date));
  assert.throws(() => voidDemoCharge(result, 'restaurant', 'Error'));
});
test('factura es snapshot: mutar el origen no altera cargos ni pagos emitidos', () => {
  const account = initialDemoAccount();
  const result = confirmDemoCheckout(account, checkout, date);
  account.charges[0].concept = 'Cambió';
  account.payments[0].cents = 1;
  assert.notEqual(result.invoice?.charges[0].concept, 'Cambió');
  assert.equal(result.invoice?.payments[0].cents, 180000);
});
