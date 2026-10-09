import { validGuatemalaNit } from '@/lib/pms/nit';
export { validGuatemalaNit } from '@/lib/pms/nit';
// OBJ-4C: datos de prueba aislados. No representan reservas ni pagos del servidor.
export const DEMO_RESERVATION_CODE = 'VS-DEMO-4C';
export const DEMO_ACCOUNT_KEY = 'vs-demo-cuenta-obj4c';
export const DEMO_NOW = '2026-10-08T16:00:00.000Z';
export type Charge = {
  id: string; concept: string; quantity: number; unitCents: number;
  kind: 'ALOJAMIENTO' | 'ADICIONAL'; status: 'VIGENTE' | 'ANULADO';
  date: string; responsible: string; voidReason?: string; voidResponsible?: string;
};
export type AccountPayment = {
  id: string; date: string; method: string; cents: number;
  status: 'APROBADO' | 'PENDIENTE' | 'FALLIDO' | 'REEMBOLSADO'; reference?: string;
};
export type DemoInvoice = {
  id: string; series: string; number: number; date: string; reservationCode: string;
  buyer: string; nit: string; charges: Charge[]; payments: AccountPayment[]; totalCents: number;
};
export type DemoAccount = {
  code: string; guest: string; status: 'ABIERTA' | 'CERRADA';
  reservation: 'EN_ESTADIA' | 'FINALIZADA' | 'CONFIRMADA';
  room: 'OCUPADA' | 'LIBRE_SUCIA' | 'FUERA_SERVICIO';
  charges: Charge[]; payments: AccountPayment[];
  orders: { id: string; status: 'NUEVO' | 'EN_PREPARACION' | 'EN_CAMINO' | 'ENTREGADO' | 'CANCELADO' }[];
  requests: { id: string; status: 'PENDIENTE' | 'EN_PROCESO' | 'ATENDIDA' | 'CANCELADA' }[];
  invoice?: DemoInvoice;
};
export function initialDemoAccount(): DemoAccount {
  const date = DEMO_NOW;
  const lodging: Charge[] = ['2026-10-05', '2026-10-06', '2026-10-07'].map((night, index) => ({
    id: `night-${index}`, concept: `Alojamiento · noche ${night}`, quantity: 1, unitCents: 60000,
    kind: 'ALOJAMIENTO', status: 'VIGENTE', date, responsible: 'Sistema de demostración',
  }));
  return {
    code: DEMO_RESERVATION_CODE, guest: 'Ana Morales (demostración)', status: 'ABIERTA',
    reservation: 'EN_ESTADIA', room: 'OCUPADA',
    charges: [...lodging,
      { id: 'restaurant', concept: 'Restaurante', quantity: 1, unitCents: 12500, kind: 'ADICIONAL', status: 'VIGENTE', date, responsible: 'Recepción (demo)' },
      { id: 'voided', concept: 'Lavandería', quantity: 1, unitCents: 5000, kind: 'ADICIONAL', status: 'ANULADO', date, responsible: 'Recepción (demo)', voidReason: 'Cargo duplicado', voidResponsible: 'Recepción (demo)' },
    ],
    payments: [
      { id: 'approved', date, method: 'Tarjeta', cents: 180000, status: 'APROBADO' },
      { id: 'failed', date, method: 'Tarjeta', cents: 10000, status: 'FALLIDO' },
    ],
    orders: [{ id: 'order-demo', status: 'EN_PREPARACION' }],
    requests: [{ id: 'request-demo', status: 'PENDIENTE' }],
  };
}
export const chargeCents = (charge: Charge) => Math.round(charge.quantity * charge.unitCents);
export function accountTotals(account: DemoAccount) {
  const charges = account.charges.filter(c => c.status === 'VIGENTE').reduce((sum, c) => sum + chargeCents(c), 0);
  const payments = account.payments.filter(p => p.status === 'APROBADO').reduce((sum, p) => sum + p.cents, 0);
  return { charges, payments, balance: charges - payments };
}
export function addDemoCharge(account: DemoAccount, input: { concept: string; quantity: number; unitCents: number }, id: string, date: string): DemoAccount {
  if (account.status !== 'ABIERTA' || account.reservation !== 'EN_ESTADIA') throw new Error('Solo se agregan cargos durante la estadía y con la cuenta abierta.');
  if (!input.concept.trim() || !Number.isFinite(input.quantity) || input.quantity <= 0 || !Number.isSafeInteger(input.unitCents) || input.unitCents <= 0 || !Number.isSafeInteger(Math.round(input.quantity * input.unitCents))) throw new Error('Concepto, cantidad y precio deben ser válidos y mayores que cero.');
  return { ...account, charges: [...account.charges, { ...input, concept: input.concept.trim(), id, date, kind: 'ADICIONAL', status: 'VIGENTE', responsible: 'Recepción (demo)' }] };
}
export function voidDemoCharge(account: DemoAccount, id: string, reason: string): DemoAccount {
  const charge = account.charges.find(c => c.id === id);
  if (account.status !== 'ABIERTA' || !charge || charge.kind !== 'ADICIONAL' || charge.status !== 'VIGENTE') throw new Error('Este cargo no se puede anular.');
  if (!reason.trim()) throw new Error('Indica el motivo de la anulación.');
  return { ...account, charges: account.charges.map(c => c.id === id ? { ...c, status: 'ANULADO', voidReason: reason.trim(), voidResponsible: 'Recepción (demo)' } : c) };
}
export function checkoutBlock(account: DemoAccount): string | null {
  if (account.status !== 'ABIERTA' || account.reservation !== 'EN_ESTADIA') return 'El check-out requiere una reserva en estadía y una cuenta abierta.';
  if (account.orders.some(o => o.status === 'EN_CAMINO')) return 'Hay un pedido en camino. Espera su entrega antes de realizar el check-out.';
  if (accountTotals(account).balance < 0) return 'El saldo es negativo. Revisa la cuenta antes de realizar el check-out.';
  return null;
}
export function confirmDemoCheckout(account: DemoAccount, input: { buyer: string; nit: string; method?: 'Efectivo' | 'Tarjeta' | 'Otro'; reference?: string }, date: string): DemoAccount {
  // Una sola factura y un solo pago, incluso si se repite la confirmación.
  if (account.invoice && account.status === 'CERRADA') return account;
  const blocked = checkoutBlock(account);
  if (blocked) throw new Error(blocked);
  if (!input.buyer.trim()) throw new Error('Indica el nombre del comprador.');
  const nit = input.nit.trim().toUpperCase();
  if (nit !== 'CF' && !validGuatemalaNit(nit)) throw new Error('El NIT no es válido. Revisa su dígito verificador.');
  const { charges, balance } = accountTotals(account);
  if (balance > 0 && !['Efectivo', 'Tarjeta', 'Otro'].includes(input.method ?? '')) throw new Error('Selecciona el método del pago único.');
  const payments: AccountPayment[] = [...account.payments, ...(balance > 0 ? [{
    id: 'checkout-demo', date, method: input.method!, cents: balance, status: 'APROBADO' as const,
    ...(input.reference?.trim() ? { reference: input.reference.trim() } : {}),
  }] : [])];
  const invoice: DemoInvoice = {
    id: 'DEMO-000001', series: 'DEMO', number: 1, date, reservationCode: account.code,
    buyer: input.buyer.trim(), nit,
    charges: account.charges.filter(c => c.status === 'VIGENTE').map(c => ({ ...c })),
    payments: payments.filter(p => p.status === 'APROBADO').map(p => ({ ...p })), totalCents: charges,
  };
  return {
    ...account, status: 'CERRADA', reservation: 'FINALIZADA',
    room: account.room === 'FUERA_SERVICIO' ? 'FUERA_SERVICIO' : 'LIBRE_SUCIA', payments, invoice,
    orders: account.orders.map(o => o.status === 'NUEVO' || o.status === 'EN_PREPARACION' ? { ...o, status: 'CANCELADO' } : o),
    requests: account.requests.map(r => r.status === 'PENDIENTE' || r.status === 'EN_PROCESO' ? { ...r, status: 'CANCELADA' } : r),
  };
}
