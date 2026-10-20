import type { Huesped } from '@/lib/pms/types';
import { HUESPEDES_INICIALES } from '@/data/pms';
import { migrateLegacyPortalReceptionData } from './portalReceptionMigration';
const KEY = 'vs-huespedes';
export const HUESPEDES_EVENT = 'vs-huespedes-updated';
export function leerHuespedes(): Huesped[] {
  if (typeof window === 'undefined')
    return HUESPEDES_INICIALES;
  migrateLegacyPortalReceptionData();
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
  migrateLegacyPortalReceptionData();
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event(HUESPEDES_EVENT));
}
export function upsertHuesped(huesped: Huesped) {
  const actuales = leerHuespedes();
  const index = actuales.findIndex(item =>
    item.id === huesped.id ||
    (Boolean(huesped.documento) &&
      item.tipoDocumento === huesped.tipoDocumento &&
      item.documento === huesped.documento),
  );
  const next = [...actuales];
  const guardado = index >= 0
    ? { ...next[index], ...huesped, id: next[index].id }
    : huesped;
  if (index >= 0)
    next[index] = guardado;
  else
    next.unshift(guardado);
  guardarHuespedes(next);
  return guardado;
}
export function actualizarHuespedCentral(id: string, c: Partial<Huesped>) {
  const next = leerHuespedes().map(h => h.id === id ? { ...h, ...c } : h);
  guardarHuespedes(next);
  return next.find(h => h.id === id);
}
