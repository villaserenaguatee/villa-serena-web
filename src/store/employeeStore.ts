import type { Empleado } from '@/lib/pms/types';
import { EMPLEADOS_INICIALES } from '@/data/pms';
export const EMPLEADOS_EVENT = 'vs-empleados-updated';
const KEY = 'vs-empleados';
export function leerEmpleados(): Empleado[] {
  if (typeof window === 'undefined')
    return EMPLEADOS_INICIALES;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw === null)
      return EMPLEADOS_INICIALES;
    const x = JSON.parse(raw);
    return Array.isArray(x) ? x : EMPLEADOS_INICIALES;
  }
  catch {
    return EMPLEADOS_INICIALES;
  }
}
export function guardarEmpleados(v: Empleado[]) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event(EMPLEADOS_EVENT));
}
