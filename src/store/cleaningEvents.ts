import type { Solicitud } from '@/lib/pms/types';
export const CLAVE_TAREAS_SALIDA = 'vs-tareas-limpieza-salida';
export function leerTareasLimpiezaSalida(): Solicitud[] {
  if (typeof window === 'undefined')
    return [];
  try {
    return JSON.parse(localStorage.getItem(CLAVE_TAREAS_SALIDA) || '[]');
  }
  catch {
    return [];
  }
}
export function registrarLimpiezaDeSalida(habitacionNumero: string, reservaId?: string) {
  if (typeof window === 'undefined')
    return;
  const existentes = leerTareasLimpiezaSalida();
  const tareaId = reservaId ? `salida-reserva-${reservaId}` : undefined;
  if (tareaId && existentes.some(s => s.id === tareaId)) return;
  const activa = existentes.some(s => s.habitacionNumero === habitacionNumero && s.estado !== 'finalizada');
  if (activa)
    return;
  const ahora = new Date();
  const tarea: Solicitud = {
    id: tareaId ?? `salida-${habitacionNumero}-${ahora.getTime()}`,
    habitacionNumero,
    tipo: 'limpieza',
    descripcion: 'Habitación liberada · limpieza de salida',
    hora: ahora.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }),
    estado: 'pendiente',
    observaciones: 'Aviso automático del sistema después del check-out. Prioridad alta.',
  };
  const siguientes = [tarea, ...existentes];
  localStorage.setItem(CLAVE_TAREAS_SALIDA, JSON.stringify(siguientes));
  window.dispatchEvent(new CustomEvent('vs-limpieza-salida', { detail: tarea }));
}
export function actualizarTareaLimpiezaSalida(tarea: Solicitud) {
  if (typeof window === 'undefined' || !tarea.id.startsWith('salida-'))
    return;
  const siguientes = leerTareasLimpiezaSalida().map(s => s.id === tarea.id ? tarea : s);
  localStorage.setItem(CLAVE_TAREAS_SALIDA, JSON.stringify(siguientes));
}
