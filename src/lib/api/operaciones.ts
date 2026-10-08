import type { components } from './schema';
export type PedidoRS = components['schemas']['PedidoRoomService'];
export type MenuRS = components['schemas']['MenuApp'];
export type IncidenciaAPI = components['schemas']['IncidenciaResumen'];
export type HabitacionLimpiezaAPI = components['schemas']['HabitacionLimpieza'];
export type SolicitudLimpiezaAPI = components['schemas']['SolicitudLimpieza'];
export type ResultadoCondicionHabitacionAPI = components['schemas']['ResultadoCondicionHabitacion'];

export class OperationError extends Error {
  constructor(message: string, public status: number, public data?: unknown) { super(message); }
}

export async function operacion<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const multipart = body instanceof FormData;
  const response = await fetch(`/api/${path}`, { method, cache: 'no-store', signal,
    ...(body === undefined ? {} : multipart ? { body } : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const value = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const errorMsg = value?.mensaje ?? value?.error ?? (typeof value?.motivo === 'string' ? value.motivo : 'No se pudo completar la operación.');
    throw new OperationError(errorMsg, response.status, value);
  }
  return value as T;
}

export const colaPedidos = (signal?: AbortSignal) => operacion<PedidoRS[]>('room-service/pedidos', 'GET', undefined, signal);
export const detallePedido = (id: number) => operacion<PedidoRS>(`room-service/pedidos/${id}`);
export const menuOperativo = (signal?: AbortSignal) => operacion<MenuRS>('room-service/menu', 'GET', undefined, signal);

export const habitacionesLimpieza = (signal?: AbortSignal) => operacion<HabitacionLimpiezaAPI[]>('limpieza/habitaciones', 'GET', undefined, signal);
export const iniciarLimpieza = (id: number) => operacion<ResultadoCondicionHabitacionAPI>(`limpieza/habitaciones/${id}/iniciar`, 'POST');
export const interrumpirLimpieza = (id: number) => operacion<ResultadoCondicionHabitacionAPI>(`limpieza/habitaciones/${id}/interrumpir`, 'POST');
export const terminarLimpieza = (id: number) => operacion<ResultadoCondicionHabitacionAPI>(`limpieza/habitaciones/${id}/terminar`, 'POST');

export const colaSolicitudes = (signal?: AbortSignal) => operacion<SolicitudLimpiezaAPI[]>('limpieza/solicitudes', 'GET', undefined, signal);
export const tomarSolicitud = (id: number) => operacion<SolicitudLimpiezaAPI>(`limpieza/solicitudes/${id}/tomar`, 'POST');
export const atenderSolicitud = (id: number) => operacion<SolicitudLimpiezaAPI>(`limpieza/solicitudes/${id}/atender`, 'POST');

