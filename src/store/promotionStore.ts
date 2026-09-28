import type { Promocion } from '@/lib/pms/types';
import { PROMOCIONES_INICIALES } from '@/data/pms';
const KEY = 'vs-promociones';
export function leerPromociones(): Promocion[] {
  if (typeof window === 'undefined')
    return PROMOCIONES_INICIALES;
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(x) && x.length ? x : PROMOCIONES_INICIALES;
  }
  catch {
    return PROMOCIONES_INICIALES;
  }
}
export function guardarPromociones(v: Promocion[]) {
  if (typeof window !== 'undefined')
    localStorage.setItem(KEY, JSON.stringify(v));
}
