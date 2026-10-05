import { habitacionesDisponibles } from '@/features/recepcion/pages/recUtils';
import { leerReservas, upsertReserva } from './reservationStore';
import { leerHabitaciones, guardarHabitaciones } from './roomStore';
import { leerHuespedes } from './guestStore';

export function asignarHabitacionReserva(reservaId: string, habitacionId: string) {
  const reservas = leerReservas();
  const reserva = reservas.find(r => r.id === reservaId);
  if (!reserva || reserva.estado === 'finalizada' || reserva.estado === 'cancelada' ||
      !leerHuespedes().some(h => h.id === reserva.huespedId)) return;
  const habitaciones = leerHabitaciones();
  if (!habitacionesDisponibles(reserva.fechaEntrada, reserva.fechaSalida, habitaciones, reservas,
      { personas: reserva.personas, ignorarReservaId: reserva.id }).some(h => h.id === habitacionId)) return;
  const actualizada = upsertReserva({ ...reserva, habitacionId,
    estado: reserva.estado === 'pendiente' ? 'confirmada' : reserva.estado });
  guardarHabitaciones(habitaciones.map(h => {
    if (h.id === habitacionId) return { ...h, estado: actualizada.estado === 'en-curso' ? 'ocupada' as const :
      h.estado === 'disponible' ? 'reservada' as const : h.estado };
    if (h.id === reserva.habitacionId && h.id !== habitacionId && h.estado !== 'mantenimiento' && h.estado !== 'en-limpieza') {
      const otras = leerReservas().filter(r => r.habitacionId === h.id && ['pendiente', 'confirmada', 'en-curso'].includes(r.estado));
      return { ...h, estado: otras.some(r => r.estado === 'en-curso') ? 'ocupada' as const : otras.length ? 'reservada' as const : 'disponible' as const };
    }
    return h;
  }));
  return actualizada;
}
