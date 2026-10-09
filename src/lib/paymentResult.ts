import type { PublicStatusDto } from './bff/contracts/public';
export type PaymentView = 'confirmed' | 'processing' | 'incomplete';
export function paymentView(result: PublicStatusDto, code: string, _timedOut = false): PaymentView {
  if (result.codigo !== code || typeof result.puedeReintentar !== 'boolean') throw new Error('El estado recibido no corresponde a esta reserva.');
  if (result.estadoReserva === 'CONFIRMADA' && result.estadoPago === 'APROBADO' && !result.puedeReintentar) return 'confirmed';
  if (result.estadoReserva === 'CANCELADA' && !result.puedeReintentar && ['FALLIDO', null].includes(result.estadoPago)) return 'incomplete';
  if (result.estadoReserva === 'PENDIENTE_PAGO' && [null, 'PENDIENTE', 'FALLIDO'].includes(result.estadoPago))
    return result.estadoPago === 'PENDIENTE' ? 'processing' : 'incomplete';
  throw new Error('No se pudo interpretar el estado de la reserva. Consulta nuevamente.');
}
