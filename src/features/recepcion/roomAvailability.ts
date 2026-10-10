import type { EstadoReserva, HabitacionHotel, Reserva } from '@/lib/pms/types';

export function rangosSeSolapan(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && bIn < aOut;
}

const ESTADOS_BLOQUEANTES: EstadoReserva[] = ['pendiente', 'confirmada', 'en-curso'];

export function habitacionTieneConflicto(habitacionId: string,
  entrada: string,
  salida: string,
  reservas: Reserva[],
  ignorarReservaId?: string): boolean {
  return reservas.some(r => r.id !== ignorarReservaId &&
    r.habitacionId === habitacionId &&
    ESTADOS_BLOQUEANTES.includes(r.estado) &&
    rangosSeSolapan(entrada, salida, r.fechaEntrada, r.fechaSalida));
}

export function habitacionesDisponibles(entrada: string,
  salida: string,
  habitaciones: HabitacionHotel[],
  reservas: Reserva[],
  opciones?: { personas?: number; tipo?: string; ignorarReservaId?: string }): HabitacionHotel[] {
  const { personas, tipo, ignorarReservaId } = opciones ?? {};
  return habitaciones.filter(h => {
    if (h.estado === 'mantenimiento') return false;
    if (tipo && h.tipo !== tipo) return false;
    if (personas && h.capacidad < personas) return false;
    return !habitacionTieneConflicto(h.id, entrada, salida, reservas, ignorarReservaId);
  });
}
