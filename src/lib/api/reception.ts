import type { ReservationPage, ReservationDetail, CancellationPreview, RoomReference, RoomState } from '@/lib/bff/contracts/reception';
export class ReceptionRequestError extends Error {
  constructor(message: string, public status: number, public codigo?: string) { super(message); }
}
async function call<T>(route: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/api/${route}`, { method, signal, cache: 'no-store', ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new ReceptionRequestError(value?.mensaje ?? 'No se pudo completar la operación.', response.status, value?.codigo);
  if (response.headers.get('X-Villa-Serena-Mode') !== 'demo') throw new Error('La conexión real está pendiente de validación.');
  return value as T;
}
export const searchReservations = (query: URLSearchParams, signal?: AbortSignal) => call<ReservationPage>(`reservas?${query}`, 'GET', undefined, signal);
export const getReservation = (code: string, signal?: AbortSignal) => call<ReservationDetail>(`reservas/${encodeURIComponent(code)}`, 'GET', undefined, signal);
export const getCancellationPreview = (code: string) => call<CancellationPreview>(`reservas/${encodeURIComponent(code)}/cancelacion`);
export const cancelReservation = (code: string, motivo: string) => call<ReservationDetail>(`reservas/${encodeURIComponent(code)}/cancelar`, 'POST', { motivo });
export const getRooms = (query = new URLSearchParams(), signal?: AbortSignal) => call<RoomState[]>(`habitaciones?${query}`, 'GET', undefined, signal);
export const getAssignableRooms = (reservation: ReservationDetail) => call<RoomReference[]>(`habitaciones/disponibles?${new URLSearchParams({ tipoHabitacionId: String(reservation.tipoHabitacion.id), entrada: reservation.entrada, salida: reservation.salida })}`);
export const assignRoom = (code: string, habitacionId: number) => call<ReservationDetail>(`reservas/${encodeURIComponent(code)}/habitacion`, 'PUT', { habitacionId });
export const markRoomDirty = (id: number) => call<RoomState>(`habitaciones/${id}/marcar-sucia`, 'POST');
