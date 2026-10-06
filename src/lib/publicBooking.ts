import { publicRooms } from '@/data/publicRoomSeed';
import { leerHuespedes, upsertHuesped } from '@/store/guestStore';
import { leerReservas, upsertReserva } from '@/store/reservationStore';
import { leerPromociones } from '@/store/promotionStore';
import { leerTarifas } from '@/store/tarifasStore';
import { readAvailability } from './publicAvailability';
import { bookingAttempt, readBookingDraft } from './bookingDraft';
import type { Reserva } from '@/lib/pms/types';
import type { BookingCreated, BookingInput, BookingResult } from './bff/contracts/booking';
export type BookingError = 'unavailable' | 'invalidGuest' | 'priceChanged' | 'invalidPromo' | 'paymentUnverified' | 'paymentUnavailable' | 'saveFailed';
export class PublicBookingError extends Error {
  constructor(public code: BookingError) { super(code); }
}
const errors: Record<string, BookingError> = { ROOM_UNAVAILABLE: 'unavailable', INVALID_AVAILABILITY_QUERY: 'unavailable',
  INVALID_BOOKING: 'invalidGuest', PRICE_CHANGED: 'priceChanged', INVALID_PROMO: 'invalidPromo', PAYMENT_UNAVAILABLE: 'paymentUnavailable' };
export function copyBookingToLocal(created: BookingCreated): Reserva {
  // Replaying creation must never overwrite later local check-in, payments or profile edits.
  const existing = leerReservas().find(r => r.id === created.compatibility.reservation.id || r.codigo === created.result.code);
  if (existing) return existing;
  const incoming = created.compatibility.guest;
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
  const inventory = readAvailability();
  const guest: BookingInput['guest'] = { name: `${params.get('nombre') || ''} ${params.get('apellidos') || ''}`.trim(),
    email: params.get('correo') || '', phone: params.get('telefono') || '', nationality: params.get('nacionalidad') || '',
    document: params.get('documento') || '', documentType: params.get('tipoDocumento') === 'Pasaporte' ? 'passport' : 'DPI' };
  const request = { slug: offer.slug, roomId: params.get('habitacionId') || '', arrival: params.get('llegada') || '',
    departure: params.get('salida') || '', adults: Number(params.get('adultos') || params.get('huespedes') || 1),
    children: Number(params.get('ninos') || 0), guest, paymentMethod, promoCode: promoCode.trim().toUpperCase(), expectedTotal: Number(params.get('total')) };
  let requestId: string;
  try { requestId = bookingAttempt(draftId, JSON.stringify(request)); } catch { throw new PublicBookingError('saveFailed'); }
  const input: BookingInput = { ...request, requestId, demo: { rooms: inventory.habitaciones,
    holds: inventory.reservas.map(r => ({ code: r.codigo, roomId: r.habitacionId, roomType: r.tipoHabitacion,
      arrival: r.fechaEntrada, departure: r.fechaSalida, status: r.estado })), rates: leerTarifas(), promotions: leerPromociones() } };
  // No automatic retry after an uncertain POST. Explicit retries retain the same attempt.
  let response: Response;
  try { response = await fetch('/api/public/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), cache: 'no-store' }); }
  catch { throw new PublicBookingError('saveFailed'); }
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new PublicBookingError(errors[payload?.error?.code] ?? 'saveFailed');
  }
  const created: BookingCreated = await response.json();
  if (created.result?.mode !== 'demo' || created.result.status !== 'confirmed' || created.result.paymentStatus !== 'unpaid' ||
    created.result.paymentMethod !== 'hotel' || created.compatibility?.reservation?.solicitudPublicaId !== requestId ||
    created.compatibility.reservation.codigo !== created.result.code || !created.compatibility.guest?.id) throw new PublicBookingError('saveFailed');
  return created;
}

export async function recoverBookingCopy(draftId: string, code: string): Promise<Reserva> {
  const draft = readBookingDraft(draftId);
  if (!draft?.attempt) throw new PublicBookingError('saveFailed');
  const attempt = JSON.parse(draft.attempt.fingerprint) as Pick<BookingInput, 'expectedTotal' | 'promoCode' | 'paymentMethod'>;
  const params = new URLSearchParams(draft.params);
  params.set('total', String(attempt.expectedTotal));
  const created = await confirmarReservaPublica(params, attempt.promoCode, attempt.paymentMethod, draftId);
  if (created.result.code !== code) throw new PublicBookingError('saveFailed');
  return copyBookingToLocal(created);
}
