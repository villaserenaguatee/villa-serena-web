import type { Reserva } from './types';

export function estanciaHabilitaChat(reserva: Reserva | undefined): boolean {
  return Boolean(reserva && reserva.estado === 'en-curso' && reserva.habitacionId &&
    reserva.checkInEn && Number.isFinite(Date.parse(reserva.checkInEn)) && !reserva.checkOutEn);
}
