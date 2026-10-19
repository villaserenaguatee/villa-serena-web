import { createPublicReservation, startPublicPayment, PublicApiError } from '@/lib/api/public';
import { bookingAttempt, finishBookingAttempt, readBookingDraft, BookingAttemptPendingError } from '@/lib/bookingDraft';
import { publicSearchError } from '@/lib/publicStayValidation';
import type { CreatePublicDto } from '@/lib/bff/contracts/public';
import { stripeCheckoutUrl } from '@/lib/stripeCheckoutUrl';

export async function prepareStripeBooking(params: URLSearchParams, draftId: string, recover = false): Promise<string> {
  const previous = readBookingDraft(draftId)?.attempt;
  let input: CreatePublicDto & {ofertaSlug?:string};
  if (recover && previous && !previous.flow && previous.fingerprint.startsWith('{')) {
    if(JSON.parse(previous.fingerprint).flow!=='stripe') throw new Error('El intento anterior no admite pago con tarjeta.');
  }
  if (recover && (!previous || (previous.flow && previous.flow!=='stripe'))) {
    throw new Error('El intento anterior no admite pago con tarjeta.');
  }
  /* Recovery uses the same active form; SHA-256 below rejects any changed payload. */
  {
    const reason = publicSearchError(params.get('llegada') || '', params.get('salida') || '', Number(params.get('adultos')), Number(params.get('ninos')), 5);
    if (reason) throw new Error(reason);
    input = { ofertaSlug: params.get('slug') || undefined, tipoHabitacionId: Number(params.get('tipoHabitacionId')), entrada: params.get('llegada') || '', salida: params.get('salida') || '',
      numeroHuespedes: Number(params.get('adultos')) + Number(params.get('ninos')), huesped: {
        nombreCompleto: `${params.get('nombre') || ''} ${params.get('apellidos') || ''}`.trim(), correo: params.get('correo') || '',
        telefono: params.get('telefono') || '', tipoDocumento: 'DPI',
        numeroDocumento: params.get('documento') || '',
      } };
  }
  const attempt = await bookingAttempt(draftId, JSON.stringify({ flow: 'stripe', input }));
  const action = recover ? 'recover-payment' : 'continue-payment';
  // Reintento manual con la misma identidad. Un regreso al resumen nunca crea otra reserva por sí solo.
  let code = previous?.code;
  if (!code) {
    try {
      const created = await createPublicReservation(input, attempt, draftId, action);
      if (created.estado !== 'PENDIENTE_PAGO' || !Number.isFinite(created.total) || created.total <= 0) throw new Error('La reserva recibida no es válida.');
      code = created.codigo;
    } catch (error) {
      if (error instanceof PublicApiError && error.status && error.status < 500 && ['DATOS_INVALIDOS', 'SIN_DISPONIBILIDAD', 'ORIGIN_FORBIDDEN', 'CORREO_NO_VERIFICADO'].includes(error.code || ''))
        finishBookingAttempt(draftId, attempt);
      throw error;
    }
  }
  if (!/^VS-[A-Z0-9]{6}$/.test(code)) throw new Error('La respuesta de reserva no es válida.');
  finishBookingAttempt(draftId, attempt, code);
  if(readBookingDraft(draftId)?.attempt?.id!==attempt) throw new BookingAttemptPendingError('The draft was discarded; consult the existing request');
  const payment = await startPublicPayment(code, action);
  if(readBookingDraft(draftId)?.attempt?.id!==attempt) throw new BookingAttemptPendingError('The draft was discarded; consult the existing request');
  return stripeCheckoutUrl(payment.urlPago, payment.mode, window.location.origin, code);
}
