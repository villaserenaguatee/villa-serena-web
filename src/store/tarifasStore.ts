import type { HabitacionHotel, TipoHabitacion } from '@/lib/pms/types';
export const TARIFAS_STORAGE_KEY = 'villa-serena-tarifas';
export const TARIFAS_EVENT = 'villa-serena:tarifas-actualizadas';
export const TARIFAS_PREDETERMINADAS: Record<TipoHabitacion, number> = {
  Standard: 420,
  Superior: 500,
  Deluxe: 580,
  'Suite Deluxe': 720,
  Suite: 790,
};
export function leerTarifas(): Record<TipoHabitacion, number> {
  if (typeof window === 'undefined')
    return { ...TARIFAS_PREDETERMINADAS };
  try {
    const guardadas = JSON.parse(localStorage.getItem(TARIFAS_STORAGE_KEY) || '{}');
    return { ...TARIFAS_PREDETERMINADAS, ...guardadas };
  }
  catch {
    return { ...TARIFAS_PREDETERMINADAS };
  }
}
export function guardarTarifas(tarifas: Record<TipoHabitacion, number>) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(TARIFAS_STORAGE_KEY, JSON.stringify(tarifas));
  window.dispatchEvent(new CustomEvent(TARIFAS_EVENT, { detail: tarifas }));
}
export function aplicarTarifasHabitaciones(habitaciones: HabitacionHotel[], tarifas = leerTarifas()): HabitacionHotel[] {
  return habitaciones.map(h => ({ ...h, precioNoche: tarifas[h.tipo] }));
}
export function tipoPublicoATipoHotel(tipo: string): TipoHabitacion {
  if (tipo === 'Estándar')
    return 'Standard';
  if (tipo === 'Superior')
    return 'Superior';
  if (tipo === 'Deluxe')
    return 'Deluxe';
  if (tipo === 'Familiar')
    return 'Suite Deluxe';
  return 'Suite';
}
