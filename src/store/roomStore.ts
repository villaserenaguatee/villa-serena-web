import type { Habitacion, HabitacionHotel, Tarea } from '@/lib/pms/types';
import { HABITACIONES_CENTRALES, FOTO_STANDARD, FOTO_SUPERIOR, FOTO_DELUXE, FOTO_SUITE } from '@/data/pms';
const KEY = 'vs-habitaciones';
const CLEAN_KEY = 'vs-habitaciones-limpieza';
export const HABITACIONES_EVENT = 'vs-habitaciones-updated';
const tareasBase = (): Tarea[] => [
  { id: 't1', nombre: 'Retirar basura y residuos', completada: false },
  { id: 't2', nombre: 'Cambiar ropa de cama', completada: false },
  { id: 't3', nombre: 'Cambiar toallas', completada: false },
  { id: 't4', nombre: 'Limpiar y desinfectar baño', completada: false },
  { id: 't5', nombre: 'Limpiar espejos', completada: false },
  { id: 't6', nombre: 'Limpiar muebles y superficies', completada: false },
  { id: 't7', nombre: 'Aspirar piso o alfombra', completada: false },
  { id: 't8', nombre: 'Trapear piso', completada: false },
  { id: 't9', nombre: 'Reponer papel higiénico', completada: false },
  { id: 't10', nombre: 'Reponer amenidades', completada: false },
  { id: 't11', nombre: 'Realizar inspección final', completada: false },
];
export function leerHabitaciones(): HabitacionHotel[] {
  if (typeof window === 'undefined')
    return HABITACIONES_CENTRALES;
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(x) && x.length ? x : HABITACIONES_CENTRALES;
  }
  catch {
    return HABITACIONES_CENTRALES;
  }
}
export function guardarHabitaciones(v: HabitacionHotel[]) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event(HABITACIONES_EVENT));
}
export function fotoHabitacion(numero: string): string {
  const h = leerHabitaciones().find(x => x.numero === numero);
  if (!h)
    return '';
  return h.tipo === 'Standard' ? FOTO_STANDARD : h.tipo === 'Superior' ? FOTO_SUPERIOR : h.tipo === 'Deluxe' ? FOTO_DELUXE : FOTO_SUITE;
}
function leerEstadoLimpieza(): Record<string, Partial<Habitacion>> {
  if (typeof window === 'undefined')
    return {};
  try {
    return JSON.parse(localStorage.getItem(CLEAN_KEY) || '{}') || {};
  }
  catch {
    return {};
  }
}
export function guardarEstadoLimpieza(habitaciones: Habitacion[]) {
  if (typeof window === 'undefined')
    return;
  const datos = Object.fromEntries(habitaciones.map(h => [h.numero,
  { estado: h.estado, personal: h.personal, proximaLlegada: h.proximaLlegada, tareas: h.tareas, observaciones: h.observaciones, finalizadaEn: h.finalizadaEn }]));
  localStorage.setItem(CLEAN_KEY, JSON.stringify(datos));
}
export function leerHabitacionesLimpieza(): Habitacion[] {
  const estadoLimpieza = leerEstadoLimpieza();
  return leerHabitaciones().map(h => {
    const extra = estadoLimpieza[h.numero] || {};
    const estado: Habitacion['estado'] = h.estado === 'mantenimiento' ? 'fuera-servicio' : h.estado === 'en-limpieza' ? 'en-limpieza' : (extra.estado as Habitacion['estado'] | undefined) ?? 'limpia';
    return {
      id: `h${h.numero}`,
      numero: h.numero,
      piso: h.piso,
      tipo: h.tipo,
      estado,
      personal: extra.personal ?? null,
      proximaLlegada: extra.proximaLlegada ?? null,
      tareas: (extra.tareas as Tarea[] | undefined) ?? tareasBase(),
      observaciones: extra.observaciones ?? '',
      foto: fotoHabitacion(h.numero),
      finalizadaEn: extra.finalizadaEn
    };
  });
}
