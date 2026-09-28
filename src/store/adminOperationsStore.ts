import type { ActivoHotel, CompraHotel, GastoHotel, Insumo, MovimientoInsumo } from '@/lib/pms/types';
import { ACTIVOS_HOTEL_INICIALES, INSUMOS_INICIALES } from '@/data/pms';
const KEYS = {
  insumos: 'vs-admin-insumos',
  movimientos: 'vs-admin-movimientos',
  compras: 'vs-admin-compras',
  gastos: 'vs-admin-gastos',
  activos: 'vs-admin-activos',
} as const;
export const ADMIN_OPERATIONS_EVENT = 'vs-admin-operations-updated';
function leer<T>(key: string,
  fallback: T): T {
  if (typeof window === 'undefined')
    return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw) as T;
  }
  catch {
    return fallback;
  }
}
function guardar<T>(key: string, value: T) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(ADMIN_OPERATIONS_EVENT));
}
export const leerInsumosAdmin = () => leer<Insumo[]>(KEYS.insumos, INSUMOS_INICIALES);
export const guardarInsumosAdmin = (value: Insumo[]) => guardar(KEYS.insumos, value);
export const leerMovimientosAdmin = () => leer<MovimientoInsumo[]>(KEYS.movimientos, []);
export const guardarMovimientosAdmin = (value: MovimientoInsumo[]) => guardar(KEYS.movimientos, value);
export const leerComprasAdmin = () => leer<CompraHotel[]>(KEYS.compras, []);
export const guardarComprasAdmin = (value: CompraHotel[]) => guardar(KEYS.compras, value);
export const leerGastosAdmin = () => leer<GastoHotel[]>(KEYS.gastos, []);
export const guardarGastosAdmin = (value: GastoHotel[]) => guardar(KEYS.gastos, value);
export const leerActivosAdmin = () => leer<ActivoHotel[]>(KEYS.activos, ACTIVOS_HOTEL_INICIALES);
export const guardarActivosAdmin = (value: ActivoHotel[]) => guardar(KEYS.activos, value);
