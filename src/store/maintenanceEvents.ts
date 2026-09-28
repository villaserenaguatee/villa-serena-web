import type { Incidencia } from '@/lib/pms/types';
export const CLAVE_INCIDENCIAS_MANTENIMIENTO = 'vs-incidencias-mantenimiento';
export const EVENTO_INCIDENCIAS_MANTENIMIENTO = 'vs-incidencias-mantenimiento-actualizadas';
export function leerIncidenciasMantenimiento(): Incidencia[] {
  if (typeof window === 'undefined')
    return [];
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_INCIDENCIAS_MANTENIMIENTO) || '[]');
    return Array.isArray(datos) ? datos : [];
  }
  catch {
    return [];
  }
}
export function guardarIncidenciasMantenimiento(incidencias: Incidencia[]) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(CLAVE_INCIDENCIAS_MANTENIMIENTO, JSON.stringify(incidencias));
  window.dispatchEvent(new CustomEvent(EVENTO_INCIDENCIAS_MANTENIMIENTO));
}
export function reportarIncidenciaMantenimiento(incidencia: Incidencia) {
  const actuales = leerIncidenciasMantenimiento();
  guardarIncidenciasMantenimiento([incidencia, ...actuales.filter(i => i.id !== incidencia.id)]);
}
