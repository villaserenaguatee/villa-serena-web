import type { CreatePublicDto, CreatedPublicDto, HotelDto, PaymentDto, PublicStatusDto, QuoteDto, RoomTypeDto } from '@/lib/bff/contracts/public';

export class PublicApiError extends Error {
  constructor(message: string, public status?: number, public code?: string) { super(message); }
}
async function request<T>(route: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api/publico/${route}`, { ...init, cache: 'no-store' });
  if (!response.ok) {
    const error = await response.json().catch(() => null);
    throw new PublicApiError(error?.mensaje ?? 'No se pudo consultar el servicio. Intenta nuevamente.', response.status, error?.codigo);
  }
  // Esta etapa admite solamente el BFF de prueba. La activación real requiere validar el adaptador.
  if (!['demo', 'spring'].includes(response.headers.get('X-Villa-Serena-Mode') ?? '')) throw new PublicApiError('La conexión real está pendiente de validación.');
  return response.json();
}
export const getPublicHotel = (signal?: AbortSignal) => request<HotelDto>('hotel', { signal });
export const getPublicCatalog = (signal?: AbortSignal) => request<RoomTypeDto[]>('tipos-habitacion', { signal });
export async function getPublicCatalogWithMode(signal?: AbortSignal) {
  const response = await fetch('/api/publico/ofertas', {signal, cache:'no-store'});
  const data = await response.json();
  if (!response.ok) throw new PublicApiError(data?.mensaje ?? 'No se pudo cargar el catálogo.', response.status);
  const mode = response.headers.get('X-Villa-Serena-Mode');
  if (!['spring','demo'].includes(mode ?? '') || !Array.isArray(data)) throw new PublicApiError('Respuesta de catálogo inválida.');
  return {data: data as import('@/lib/usePublicCatalog').CatalogRoom[], connected: mode === 'spring'};
}
export const getPublicType = (id: number, signal?: AbortSignal) => request<RoomTypeDto>(`tipos-habitacion/${id}`, { signal });
export const getPublicQuotes = (entrada: string, salida: string, numeroHuespedes: number, signal?: AbortSignal) =>
  request<(QuoteDto & {ofertaSlug?:string})[]>(`ofertas/disponibilidad?${new URLSearchParams({ entrada, salida, numeroHuespedes: String(numeroHuespedes) })}`, { signal });
export type BookingAction = 'continue-payment' | 'recover-payment';
export const createPublicReservation = (input: CreatePublicDto & {ofertaSlug?:string}, attempt: string, draftId?: string, action?: BookingAction) => request<CreatedPublicDto>('reservas', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt, ...(action ? { 'X-Villa-Serena-Booking-Action': action } : {}) }, body: JSON.stringify({ ...input, borradorId: draftId }),
});
export async function startPublicPayment(code: string, action?: BookingAction): Promise<PaymentDto & {mode:string}> {
  const response = await fetch(`/api/publico/reservas/${encodeURIComponent(code)}/pago`, {method:'POST',cache:'no-store',headers:action ? {'X-Villa-Serena-Booking-Action':action} : {}});
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new PublicApiError(body?.mensaje ?? 'No se pudo iniciar el pago.', response.status, body?.codigo);
  const mode = response.headers.get('X-Villa-Serena-Mode') ?? '';
  if (!['spring','demo'].includes(mode) || !body?.urlPago) throw new PublicApiError('Respuesta de pago inválida.');
  return {...body,mode};
}
export const getPublicStatus = (code: string, signal?: AbortSignal) => request<PublicStatusDto>(`reservas/${encodeURIComponent(code)}/estado`, { signal });
