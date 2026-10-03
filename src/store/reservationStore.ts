import { leerHuespedes } from './guestStore';
import { leerHabitaciones, guardarHabitaciones } from './roomStore';
import { registrarLimpiezaDeSalida } from './cleaningEvents';
import type { Reserva } from '@/lib/pms/types';
import { RESERVAS_INICIALES } from '@/data/pms';
import { migrateLegacyPortalReceptionData } from './portalReceptionMigration';
const KEY = 'vs-reservas';
export const RESERVAS_EVENT = 'vs-reservas-updated';
function checkOutRealizado(reserva: Reserva): boolean {
  return Boolean(reserva.checkOutEn && Number.isFinite(Date.parse(reserva.checkOutEn)));
}
function normalizarReserva(reserva: Reserva): Reserva {
  return checkOutRealizado(reserva) && reserva.estado !== 'finalizada'
    ? { ...reserva, estado: 'finalizada' }
    : reserva;
}
export function leerReservas(): Reserva[] {
  if (typeof window === 'undefined')
    return RESERVAS_INICIALES;
  migrateLegacyPortalReceptionData();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null)
      return RESERVAS_INICIALES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return RESERVAS_INICIALES;
    const reservas: Reserva[] = parsed;
    const normalizadas = reservas.map(normalizarReserva);
    if (normalizadas.some((r, i) => r !== reservas[i])) {
      localStorage.setItem(KEY, JSON.stringify(normalizadas));
      const habitaciones = leerHabitaciones();
      const siguientes = habitaciones.map(h => {
        const salidaIncoherente = reservas.some(r => r.habitacionId === h.id &&
          r.estado === 'en-curso' && checkOutRealizado(r));
        if (!salidaIncoherente || h.estado !== 'ocupada' ||
            normalizadas.some(r => r.habitacionId === h.id && r.estado === 'en-curso')) return h;
        return { ...h, estado: 'en-limpieza' as const };
      });
      if (siguientes.some((h, i) => h !== habitaciones[i])) guardarHabitaciones(siguientes);
    }
    return normalizadas;
  }
  catch {
    return RESERVAS_INICIALES;
  }
}
export function guardarReservas(reservas: Reserva[]) {
  if (typeof window === 'undefined')
    return;
  migrateLegacyPortalReceptionData();
  const actuales = leerReservas();
  const normalizadas = reservas.map(r => {
    const anterior = actuales.find(a => a.id === r.id);
    return normalizarReserva(anterior && checkOutRealizado(anterior)
      ? { ...r, checkOutEn: anterior.checkOutEn, origenCheckOut: anterior.origenCheckOut }
      : r);
  });
  const next = JSON.stringify(normalizadas);
  if (localStorage.getItem(KEY) === next)
    return;
  localStorage.setItem(KEY, next);
  window.dispatchEvent(new Event(RESERVAS_EVENT));
}
export function upsertReserva(reserva: Reserva) {
  const actuales = leerReservas();
  const i = actuales.findIndex(r => r.id === reserva.id || r.codigo === reserva.codigo);
  const next = [...actuales];
  if (i >= 0)
    next[i] = { ...next[i], ...reserva };
  else
    next.unshift(reserva);
  guardarReservas(next);
  return leerReservas().find(r => r.id === reserva.id || r.codigo === reserva.codigo)!;
}

export function completarCheckInReserva(id: string, origen: 'portal' | 'recepcion'): Reserva | undefined {
  const reserva = leerReservas().find(r => r.id === id);
  if (!reserva?.habitacionId || checkInRealizado(reserva) || reserva.estado !== 'confirmada' ||
      (origen === 'portal' && reserva.checkInWeb?.estado !== 'pendiente')) return;
  if (!leerHuespedes().some(h => h.id === reserva.huespedId)) return;
  const habitaciones = leerHabitaciones();
  const habitacion = habitaciones.find(h => h.id === reserva.habitacionId);
  if (!habitacion || habitacion.estado === 'en-limpieza' || habitacion.estado === 'mantenimiento' ||
      leerReservas().some(r => r.id !== id && r.habitacionId === habitacion.id && r.estado === 'en-curso')) return;
  const ahora = new Date().toISOString();
  const actualizada: Reserva = { ...reserva, estado: 'en-curso', checkInEn: ahora, origenCheckIn: origen,
    ...(reserva.checkInWeb ? { checkInWeb: { ...reserva.checkInWeb, estado: 'aprobado', revisadoEn: ahora } } : {}),
  };
  guardarHabitaciones(habitaciones.map(h => h.id === habitacion.id ? { ...h, estado: 'ocupada' } : h));
  upsertReserva(actualizada);
  return actualizada;
}
export function completarCheckOutReserva(id: string, origen: 'portal' | 'recepcion'): Reserva | undefined {
  const reserva = leerReservas().find(r => r.id === id);
  if (!reserva || reserva.estado !== 'en-curso' || !reserva.habitacionId) return;
  const habitaciones = leerHabitaciones();
  const habitacion = habitaciones.find(h => h.id === reserva.habitacionId);
  if (!habitacion) return;
  const actualizada: Reserva = { ...reserva, estado: 'finalizada', checkOutEn: new Date().toISOString(), origenCheckOut: origen };
  const otraEstanciaActiva = leerReservas().some(r =>
    r.id !== id && r.habitacionId === habitacion.id && r.estado === 'en-curso',
  );
  guardarHabitaciones(habitaciones.map(h => h.id === habitacion.id
    ? { ...h, estado: otraEstanciaActiva ? 'ocupada' : h.estado === 'mantenimiento' ? 'mantenimiento' : 'en-limpieza' }
    : h));
  registrarLimpiezaDeSalida(habitacion.numero, reserva.id);
  upsertReserva(actualizada);
  return actualizada;
}

export function checkInRealizado(reserva: Reserva): boolean {
  return reserva.estado === 'en-curso' || Boolean(reserva.checkInEn && Number.isFinite(Date.parse(reserva.checkInEn)));
}
export function checkInWebPendiente(reserva: Reserva): boolean {
  return !checkInRealizado(reserva) && (reserva.estado === 'confirmada' || reserva.estado === 'pendiente') && reserva.checkInWeb?.estado === 'pendiente';
}
