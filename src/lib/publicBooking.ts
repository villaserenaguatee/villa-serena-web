import { publicRooms } from '@/data/publicRoomSeed';
import { leerHuespedes, upsertHuesped } from '@/store/guestStore';
import { leerReservas, upsertReserva } from '@/store/reservationStore';
import { leerPromociones } from '@/store/promotionStore';
import { leerTarifas } from '@/store/tarifasStore';
import { readAvailability } from './publicAvailability';
import { bookingAttempt, BookingAttemptPendingError, finishBookingAttempt, readBookingDraft } from './bookingDraft';
import type { Reserva } from '@/lib/pms/types';
import type { BookingCreated, BookingInput, BookingResult } from './bff/contracts/booking';
export type BookingError = 'unavailable' | 'invalidGuest' | 'priceChanged' | 'invalidPromo' | 'paymentUnverified' | 'paymentUnavailable' | 'saveFailed' | 'requestUncertain';
export class PublicBookingError extends Error {
  constructor(public code: BookingError) { super(code); }
}
const errors: Record<string, BookingError> = { ROOM_UNAVAILABLE: 'unavailable', INVALID_AVAILABILITY_QUERY: 'unavailable',
  INVALID_BOOKING: 'invalidGuest', PRICE_CHANGED: 'priceChanged', INVALID_PROMO: 'invalidPromo', PAYMENT_UNAVAILABLE: 'paymentUnavailable' };
export function copyBookingToLocal(created: BookingCreated): Reserva {
  // Replaying creation must never overwrite later local check-in, payments or profile edits.
  const existing = leerReservas().find(r => r.id === created.compatibility.reservation.id || r.codigo === created.result.code);
  const incoming = created.compatibility.guest;
  if (existing) {
    if (!leerHuespedes().some(g => g.id === existing.huespedId)) upsertHuesped({ ...incoming, id: existing.huespedId });
    return existing;
  }
  const matching = leerHuespedes().find(g => g.id === incoming.id || (g.tipoDocumento === incoming.tipoDocumento && g.documento === incoming.documento));
  const guest = matching ?? upsertHuesped(incoming);
  return upsertReserva({ ...created.compatibility.reservation, huespedId: guest.id });
}
export async function getBookingResult(code: string, signal?: AbortSignal): Promise<BookingResult> {
  const response = await fetch(`/api/public/bookings/${encodeURIComponent(code)}`, { cache: 'no-store', signal });
  if (!response.ok) throw new PublicBookingError('saveFailed');
  const result: BookingResult = await response.json();
  if (result.mode !== 'demo' || result.code !== code || result.status !== 'confirmed' || result.paymentMethod !== 'hotel' ||
    result.paymentStatus !== 'unpaid' || !Number.isFinite(result.total) || result.total < 0) throw new PublicBookingError('saveFailed');
  return result;
}
export async function confirmarReservaPublica(params: URLSearchParams, promoCode = '', paymentMethod: BookingInput['paymentMethod'] = 'hotel', draftId = ''): Promise<BookingCreated> {
  const offer = publicRooms.find(r => params.get('slug') ? r.slug === params.get('slug') : r.name === params.get('habitacion'));
  if (!offer) throw new PublicBookingError('unavailable');
  const guest: BookingInput['guest'] = { name: `${params.get('nombre') || ''} ${params.get('apellidos') || ''}`.trim(),
    email: params.get('correo') || '', phone: params.get('telefono') || '', nationality: params.get('nacionalidad') || '',
    document: params.get('documento') || '', documentType: params.get('tipoDocumento') === 'Pasaporte' ? 'passport' : 'DPI' };
  const request = { slug: offer.slug, roomId: params.get('habitacionId') || '', arrival: params.get('llegada') || '',
    departure: params.get('salida') || '', adults: Number(params.get('adultos') || params.get('huespedes') || 1),
    children: Number(params.get('ninos') || 0), guest, paymentMethod, promoCode: promoCode.trim().toUpperCase(), expectedTotal: Number(params.get('total')) };
  let requestId: string;
  try { requestId = bookingAttempt(draftId, JSON.stringify(request)); }
  catch (error) { throw new PublicBookingError(error instanceof BookingAttemptPendingError ? 'requestUncertain' : 'saveFailed'); }
  return submitBooking(request, requestId, draftId, readBookingDraft(draftId)?.attempt?.code);
}
type BookingAttempt = Omit<BookingInput, 'requestId' | 'demo' | 'recoveryCode'>;
async function submitBooking(request: BookingAttempt, requestId: string, draftId: string, recoveryCode?: string): Promise<BookingCreated> {
  const inventory = readAvailability();
  const input: BookingInput = { ...request, requestId, recoveryCode, demo: { rooms: inventory.habitaciones,
    holds: inventory.reservas.map(r => ({ code: r.codigo, roomId: r.habitacionId, roomType: r.tipoHabitacion,
      arrival: r.fechaEntrada, departure: r.fechaSalida, status: r.estado })), rates: leerTarifas(), promotions: leerPromociones() } };
  // No automatic retry after an uncertain POST. Explicit retries retain the same attempt.
  let response: Response;
  try { response = await fetch('/api/public/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), cache: 'no-store' }); }
  catch { throw new PublicBookingError('requestUncertain'); }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const code = payload?.error?.code;
    if (!recoveryCode && response.status < 500 && ['ROOM_UNAVAILABLE', 'INVALID_AVAILABILITY_QUERY', 'INVALID_BOOKING', 'PRICE_CHANGED', 'INVALID_PROMO', 'INVALID_DEMO_CONTEXT', 'REQUEST_TOO_LARGE', 'ORIGIN_FORBIDDEN', 'INVALID_JSON'].includes(code)) {
      try { finishBookingAttempt(draftId, requestId); } catch { /* Keep the same attempt if session storage is unavailable. */ }
    }
    throw new PublicBookingError(errors[payload?.error?.code] ?? 'saveFailed');
  }
  const created: BookingCreated = await response.json();
  if (created.result?.mode !== 'demo' || created.result.status !== 'confirmed' || created.result.paymentStatus !== 'unpaid' ||
    created.result.paymentMethod !== 'hotel' || created.compatibility?.reservation?.solicitudPublicaId !== requestId ||
    created.compatibility.reservation.codigo !== created.result.code || !created.compatibility.guest?.id) throw new PublicBookingError('saveFailed');
  try { finishBookingAttempt(draftId, requestId, created.result.code); } catch { /* The immutable attempt still supports replay. */ }
  return created;
}

export async function retryBookingAttempt(draftId: string, code?: string): Promise<BookingCreated> {
  const draft = readBookingDraft(draftId);
  if (!draft?.attempt) throw new PublicBookingError('saveFailed');
  if (code && draft.attempt.code && draft.attempt.code !== code) throw new PublicBookingError('saveFailed');
  let attempt: BookingAttempt;
  try { attempt = JSON.parse(draft.attempt.fingerprint) as BookingAttempt; } catch { throw new PublicBookingError('saveFailed'); }
  const created = await submitBooking(attempt, draft.attempt.id, draftId, code ?? draft.attempt.code);
  if (code && created.result.code !== code) throw new PublicBookingError('saveFailed');
  return created;
}
export async function recoverBookingCopy(draftId: string, code: string): Promise<Reserva> {
  const created = await retryBookingAttempt(draftId, code);
  return copyBookingToLocal(created);
}
