import 'server-only';
import type { PaymentDto, PublicStatusDto } from './contracts/public';
// Reservas sembradas: ningún regreso del navegador confirma un pago.
const fixtures: Record<string, PublicStatusDto> = {
  'VS-DEMO01': { codigo: 'VS-DEMO01', estadoReserva: 'CONFIRMADA', estadoPago: 'APROBADO', puedeReintentar: false },
  'VS-DEMO02': { codigo: 'VS-DEMO02', estadoReserva: 'PENDIENTE_PAGO', estadoPago: 'PENDIENTE', puedeReintentar: true },
  'VS-DEMO03': { codigo: 'VS-DEMO03', estadoReserva: 'PENDIENTE_PAGO', estadoPago: null, puedeReintentar: true },
  'VS-DEMO04': { codigo: 'VS-DEMO04', estadoReserva: 'CANCELADA', estadoPago: 'FALLIDO', puedeReintentar: false },
};
export function paymentResultFixture(code: string): PublicStatusDto | undefined {
  const result = Object.hasOwn(fixtures, code) ? fixtures[code] : undefined;
  return result ? { ...result } : undefined;
}
export function fixturePayment(code: string, origin: string): PaymentDto | undefined {
  if (!paymentResultFixture(code)?.puedeReintentar) return undefined;
  return { urlPago: new URL(`/reserva/resultado?codigo=${code}`, origin).href, expiraEn: new Date(Date.now() + 30 * 60000).toISOString() };
}
