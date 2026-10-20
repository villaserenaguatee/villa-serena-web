import type { Reserva } from '@/lib/pms/types';
import { leerReservas, upsertReserva } from './reservationStore';

export type CambiosReservaRecepcion = Pick<Reserva, 'fechaEntrada' | 'fechaSalida' | 'personas' | 'habitacionId'> & {
  adultos: number; ninos: number;
};

export function modificarReservaRecepcion(reservaId: string, cambios: CambiosReservaRecepcion) {
  const anterior = leerReservas().find(r => r.id === reservaId);
  if (!anterior || anterior.estado === 'finalizada' || anterior.estado === 'cancelada') return;
  let estado = anterior.estado;
  if (cambios.habitacionId && estado === 'pendiente') estado = 'confirmada';
  if (!cambios.habitacionId && estado === 'confirmada') estado = 'pendiente';
  const reserva = upsertReserva({ ...anterior, ...cambios, estado });
  return { reserva, habitacionAnterior: anterior.habitacionId ?? null };
}
