import type { Reserva, TipoHabitacion } from '@/lib/pms/types';
import { fechaHoyISO, fechaRelativaISO, generarId, siguienteCodigoReserva } from '@/data/pms';
import { habitacionesDisponibles } from '@/features/recepcion/pages/recUtils';
import { leerReservas, upsertReserva } from './reservationStore';
import { leerHuespedes } from './guestStore';
import { leerHabitaciones, guardarHabitaciones } from './roomStore';

export type ReceptionReservationInput = {
  huespedId: string; tipoHabitacion: TipoHabitacion; fechaEntrada: string; fechaSalida: string;
  personas: number; adultos?: number; ninos?: number; habitacionId: string | null;
};
export function crearReservaRecepcionDemo(input: ReceptionReservationInput): Reserva {
  const nights = (Date.parse(`${input.fechaSalida}T00:00:00Z`) - Date.parse(`${input.fechaEntrada}T00:00:00Z`)) / 86400000;
  if (!Number.isInteger(nights) || nights < 1 || nights > 30 || input.fechaEntrada < fechaHoyISO() || input.fechaEntrada > fechaRelativaISO(365)) {
    throw new Error('Revisa las fechas de entrada y salida.');
  }
  if (!Number.isInteger(input.personas) || input.personas < 1 || !leerHuespedes().some(h => h.id === input.huespedId)) {
    throw new Error('Revisa el huésped y el número de personas.');
  }
  const rooms = leerHabitaciones();
  const reservations = leerReservas();
  const available = habitacionesDisponibles(input.fechaEntrada, input.fechaSalida, rooms, reservations, { personas: input.personas, tipo: input.tipoHabitacion });
  // Las reservas sin asignación también apartan una unidad del tipo en cada noche.
  for (let day = input.fechaEntrada; day < input.fechaSalida;) {
    const unassigned = reservations.filter(r => !r.habitacionId && r.tipoHabitacion === input.tipoHabitacion &&
      !['cancelada', 'finalizada'].includes(r.estado) && r.fechaEntrada <= day && day < r.fechaSalida).length;
    if (available.length <= unassigned) throw new Error('Ya no hay disponibilidad para esas fechas y capacidad.');
    const next = new Date(`${day}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + 1); day = next.toISOString().slice(0, 10);
  }
  if (input.habitacionId && !available.some(h => h.id === input.habitacionId)) throw new Error('La habitación seleccionada ya no está disponible.');
  let code = siguienteCodigoReserva();
  while (reservations.some(r => r.codigo === code)) code = siguienteCodigoReserva();
  const reservation = upsertReserva({ ...input, id: generarId(), codigo: code, estado: 'confirmada',
    acompanantes: [], servicios: [], pagos: [], descuento: 0, creadoEn: new Date().toISOString() });
  if (input.habitacionId) guardarHabitaciones(rooms.map(h => h.id === input.habitacionId && h.estado === 'disponible' ? { ...h, estado: 'reservada' } : h));
  return reservation;
}
