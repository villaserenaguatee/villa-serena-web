import type { Reserva } from '@/lib/pms/types';
import { RESERVAS_INICIALES } from '@/data/pms';
const KEY = 'vs-reservas';
export const RESERVAS_EVENT = 'vs-reservas-updated';
export function leerReservas(): Reserva[] {
  if (typeof window === 'undefined')
    return RESERVAS_INICIALES;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null)
      return RESERVAS_INICIALES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : RESERVAS_INICIALES;
  }
  catch {
    return RESERVAS_INICIALES;
  }
}
export function guardarReservas(reservas: Reserva[]) {
  if (typeof window === 'undefined')
    return;
  const next = JSON.stringify(reservas);
  if (localStorage.getItem(KEY) === next)
    return;
  localStorage.setItem(KEY, next);
  window.dispatchEvent(new Event(RESERVAS_EVENT));
}
export function upsertReserva(reserva: Reserva) {
  const actuales = leerReservas();
  const i = actuales.findIndex(r => r.id === reserva.id);
  const next = [...actuales];
  if (i >= 0)
    next[i] = { ...next[i], ...reserva };
  else
    next.unshift(reserva);
  guardarReservas(next);
  return reserva;
}
