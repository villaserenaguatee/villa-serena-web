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
  if (response.headers.get('X-Villa-Serena-Mode') !== 'demo') throw new PublicApiError('La conexión real está pendiente de validación.');
  return response.json();
}
export const getPublicHotel = (signal?: AbortSignal) => request<HotelDto>('hotel', { signal });
export const getPublicCatalog = (signal?: AbortSignal) => request<RoomTypeDto[]>('tipos-habitacion', { signal });
export const getPublicType = (id: number, signal?: AbortSignal) => request<RoomTypeDto>(`tipos-habitacion/${id}`, { signal });
export const getPublicQuotes = (entrada: string, salida: string, numeroHuespedes: number, signal?: AbortSignal) =>
  request<QuoteDto[]>(`disponibilidad?${new URLSearchParams({ entrada, salida, numeroHuespedes: String(numeroHuespedes) })}`, { signal });
export const createPublicReservation = (input: CreatePublicDto, attempt: string) => request<CreatedPublicDto>('reservas', {
  method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt }, body: JSON.stringify(input),
});
export const startPublicPayment = (code: string) => request<PaymentDto>(`reservas/${encodeURIComponent(code)}/pago`, { method: 'POST' });
export const getPublicStatus = (code: string, signal?: AbortSignal) => request<PublicStatusDto>(`reservas/${encodeURIComponent(code)}/estado`, { signal });
