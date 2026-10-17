import type { ReservationPage, ReservationDetail, CancellationPreview, RoomReference, RoomState } from '@/lib/bff/contracts/reception';
import type { ReceptionCreation, ReceptionCalendar, GuestData, RegisteredGuest } from '@/lib/bff/contracts/reception';
export class ReceptionRequestError extends Error {
  constructor(message: string, public status: number, public codigo?: string, public detalles: {campo:string;mensaje:string}[] = []) { super(message); }
}
export function receptionFieldErrors(error: unknown): Record<string,string> {
  if (!(error instanceof ReceptionRequestError)) return {};
  const names:Record<string,string>={nombreCompleto:'nombre',numeroDocumento:'documento',documentoValido:'documento',telefonoValido:'telefono',paisEmisorValido:'paisEmisorPasaporte',entrada:'fechas',salida:'fechas',numeroHuespedes:'habitacion'};
  const result:Record<string,string>={};
  for(const d of error.detalles){const field=d.campo.split('.').at(-1)??'';const key=names[field]??field;if(['paisEmisorPasaporte','nombre','documento','telefono','correo','nacionalidad','fechas','habitacion'].includes(key))result[key]=d.mensaje;}
  return result;
}
async function call<T>(route: string, method = 'GET', body?: unknown, signal?: AbortSignal, attempt?: string): Promise<T> {
  const response = await fetch(`/api/${route}`, { method, signal, cache: 'no-store', ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json', ...(attempt ? {'Idempotency-Key': attempt} : {}) }, body: JSON.stringify(body) }) });
  const value = await response.json().catch(() => null);
  if (!response.ok) throw new ReceptionRequestError(value?.mensaje ?? 'No se pudo completar la operación.', response.status, value?.codigo, Array.isArray(value?.detalles) ? value.detalles.filter((d:unknown):d is {campo:string;mensaje:string}=>!!d&&typeof d==='object'&&'campo' in d&&typeof d.campo==='string'&&'mensaje' in d&&typeof d.mensaje==='string') : []);
  if (!['demo', 'spring'].includes(response.headers.get('X-Villa-Serena-Mode') ?? '')) throw new Error('El servidor devolvió una respuesta sin modo de conexión válido.');
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
export const registerGuest = (input: GuestData) => call<RegisteredGuest>('huespedes', 'POST', input);
export const createReservation = (input: ReceptionCreation, attempt?: string) => call<ReservationDetail>('reservas', 'POST', input, undefined, attempt);
export const getCalendar = (desde: string, hasta: string, signal?: AbortSignal) => call<ReceptionCalendar>(`reservas/calendario?${new URLSearchParams({ desde, hasta })}`, 'GET', undefined, signal);
export const getReceptionAvailability = (entrada: string, salida: string, huespedes: number, signal?: AbortSignal) => call<import('@/lib/api/schema').components['schemas']['OpcionDisponibleRecepcion'][]>(`reservas/disponibilidad?${new URLSearchParams({ entrada, salida, huespedes: String(huespedes) })}`, 'GET', undefined, signal);
export const getAvailableRoomReferences = (tipoHabitacionId: number, entrada: string, salida: string, signal?: AbortSignal) => call<RoomReference[]>(`habitaciones/disponibles?${new URLSearchParams({ tipoHabitacionId: String(tipoHabitacionId), entrada, salida })}`, 'GET', undefined, signal);

export const searchGuests = (q: string, signal?: AbortSignal) => call<import("./schema").components["schemas"]["Huesped"][]>(`huespedes?${new URLSearchParams({ q })}`, "GET", undefined, signal);

export const checkInReservation = (code: string) => call<ReservationDetail>(`reservas/${encodeURIComponent(code)}/check-in`, 'POST');
export const addReservationGuest = (code: string, input: import('./schema').components['schemas']['HuespedAdicionalDatos']) => call(`reservas/${encodeURIComponent(code)}/huespedes-adicionales`, 'POST', input);
