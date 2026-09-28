import type { Huesped } from '@/lib/pms/types';
import { HUESPEDES_INICIALES } from '@/data/pms';
const KEY = 'vs-huespedes';
export const HUESPEDES_EVENT = 'vs-huespedes-updated';
export function leerHuespedes(): Huesped[] {
  if (typeof window === 'undefined')
    return HUESPEDES_INICIALES;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null)
      return HUESPEDES_INICIALES;
    const x = JSON.parse(raw);
    return Array.isArray(x) ? x : HUESPEDES_INICIALES;
  }
  catch {
    return HUESPEDES_INICIALES;
  }
}
export function guardarHuespedes(v: Huesped[]) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event(HUESPEDES_EVENT));
}
export function actualizarHuespedCentral(id: string, c: Partial<Huesped>) {
  const next = leerHuespedes().map(h => h.id === id ? { ...h, ...c } : h);
  guardarHuespedes(next);
  return next.find(h => h.id === id);
}
