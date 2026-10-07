import type { components } from './schema';
export type PedidoRS = components['schemas']['PedidoRoomService'];
export type MenuRS = components['schemas']['MenuApp'];
export type IncidenciaAPI = components['schemas']['IncidenciaResumen'];
export class OperationError extends Error { constructor(message: string, public status: number) { super(message); } }
export async function operacion<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const multipart = body instanceof FormData;
  const response = await fetch(`/api/${path}`, { method, cache: 'no-store', signal,
    ...(body === undefined ? {} : multipart ? { body } : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  });
  const value = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new OperationError(value?.mensaje ?? 'No se pudo completar la operación.', response.status);
  return value as T;
}
export const colaPedidos = (signal?: AbortSignal) => operacion<PedidoRS[]>('room-service/pedidos', 'GET', undefined, signal);
export const detallePedido = (id: number) => operacion<PedidoRS>(`room-service/pedidos/${id}`);
export const menuOperativo = (signal?: AbortSignal) => operacion<MenuRS>('room-service/menu', 'GET', undefined, signal);
