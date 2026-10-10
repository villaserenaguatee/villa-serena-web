import type { DocumentoCargado, EstadoHabHotel, HabitacionHotel, Huesped, Reserva } from '@/lib/pms/types';
import { requireReadyCheckInRoom } from '@/features/recepcion/checkInRoom';
import { leerHuespedes } from './guestStore';
import { leerHabitaciones } from './roomStore';
import { completarCheckInReserva, errorActivacionCheckInPortal, errorCheckInRecepcion, leerReservas, upsertReserva } from './reservationStore';

export type DocumentosCheckInPortal = {
  documento: DocumentoCargado; documentos: DocumentoCargado[]; peticiones: string[]; notaPeticiones: string;
};

export function enviarCheckInPortal(reservaId: string, huespedId: string, datos: DocumentosCheckInPortal) {
  const canonica = leerReservas().find(r => r.id === reservaId && r.huespedId === huespedId);
  if (!canonica || canonica.estado !== 'confirmada' || canonica.checkInEn ||
      canonica.checkInWeb?.estado === 'pendiente' || canonica.checkInWeb?.estado === 'aprobado') return;
  const actualizada: Reserva = {
    ...canonica, estado: 'confirmada',
    checkInWeb: { estado: 'pendiente', documento: datos.documento, documentos: datos.documentos,
      peticiones: datos.peticiones, notaPeticiones: datos.notaPeticiones, terminosAceptados: true, enviadoEn: new Date().toISOString() },
  };
  upsertReserva(actualizada);
  return actualizada;
}

export function rechazarCheckInPortal(reservaId: string, motivo: string, huespedes: Huesped[] = leerHuespedes()) {
  const r = leerReservas().find(x => x.id === reservaId);
  if (!r || !huespedes.some(h => h.id === r.huespedId) || r.estado !== 'confirmada' || r.checkInWeb?.estado !== 'pendiente') return;
  const rechazada: Reserva = { ...r, estado: 'confirmada', checkInWeb: {
    ...r.checkInWeb, estado: 'rechazado', revisadoEn: new Date().toISOString(), motivoRevision: motivo,
  } };
  upsertReserva(rechazada);
  return rechazada;
}

export async function activarCheckInConHabitacionLista(reservaId: string, origin: 'recepcion' | 'portal') {
  const validate = origin === 'recepcion' ? errorCheckInRecepcion : errorActivacionCheckInPortal;
  const error = validate(reservaId);
  if (error) throw new Error(error);
  const reservation = leerReservas().find(r => r.id === reservaId)!;
  const room = leerHabitaciones().find(r => r.id === reservation.habitacionId)!;
  await requireReadyCheckInRoom(room.numero);
  const currentError = validate(reservaId);
  if (currentError) throw new Error(currentError);
  if (leerReservas().find(r => r.id === reservaId)?.habitacionId !== reservation.habitacionId) {
    throw new Error('La habitación asignada cambió. Revisa la reserva antes del check-in.');
  }
  return completarCheckInReserva(reservaId, origin);
}

export function reconciliarHabitacionesReservadas(actuales: HabitacionHotel[], reservas: Reserva[]) {
  let cambio = false;
  const siguientes = actuales.map(h => {
    if (h.estado === 'mantenimiento' || h.estado === 'en-limpieza') return h;
    const asignadas = reservas.filter(r => r.habitacionId === h.id && ['en-curso', 'confirmada', 'pendiente'].includes(r.estado));
    const estado: EstadoHabHotel = asignadas.some(r => r.estado === 'en-curso') ? 'ocupada' : asignadas.length ? 'reservada' : 'disponible';
    if (estado === h.estado) return h;
    cambio = true;
    return { ...h, estado };
  });
  return cambio ? siguientes : actuales;
}
