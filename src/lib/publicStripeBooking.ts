import { createPublicReservation, startPublicPayment, PublicApiError } from '@/lib/api/public';
import { bookingAttempt, finishBookingAttempt, readBookingDraft } from '@/lib/bookingDraft';
import { publicSearchError } from '@/lib/publicStayValidation';
import type { CreatePublicDto } from '@/lib/bff/contracts/public';

export async function prepareStripeBooking(params: URLSearchParams, draftId: string, recover = false): Promise<string> {
  const previous = readBookingDraft(draftId)?.attempt;
  let input: CreatePublicDto;
  if (recover) {
    if (!previous) throw new Error('No se encontró el intento anterior.');
    const saved = JSON.parse(previous.fingerprint);
    if (saved.flow !== 'stripe') throw new Error('El intento anterior no admite pago con tarjeta. Vuelve al formulario de datos para iniciar una reserva nueva.');
    input = saved.input;
  } else {
    const reason = publicSearchError(params.get('llegada') || '', params.get('salida') || '', Number(params.get('adultos')), Number(params.get('ninos')), 5);
    if (reason) throw new Error(reason);
    input = { tipoHabitacionId: Number(params.get('tipoHabitacionId')), entrada: params.get('llegada') || '', salida: params.get('salida') || '',
      numeroHuespedes: Number(params.get('adultos')) + Number(params.get('ninos')), huesped: {
        nombreCompleto: `${params.get('nombre') || ''} ${params.get('apellidos') || ''}`.trim(), correo: params.get('correo') || '',
        telefono: params.get('telefono') || '', nacionalidad: params.get('nacionalidad') || '', tipoDocumento: params.get('tipoDocumento') === 'Pasaporte' ? 'PASAPORTE' : 'DPI',
        numeroDocumento: params.get('documento') || '',
      } };
  }
  const attempt = bookingAttempt(draftId, JSON.stringify({ flow: 'stripe', input }));
  // Reintento manual con la misma identidad. Un regreso al resumen nunca crea otra reserva por sí solo.
  let code = previous?.code;
  if (!code) {
    try {
      const created = await createPublicReservation(input, attempt);
      if (created.estado !== 'PENDIENTE_PAGO' || !Number.isFinite(created.total) || created.total <= 0) throw new Error('La reserva de prueba recibida no es válida.');
      code = created.codigo;
    } catch (error) {
      if (error instanceof PublicApiError && error.status && error.status < 500 && ['DATOS_INVALIDOS', 'SIN_DISPONIBILIDAD', 'ORIGIN_FORBIDDEN'].includes(error.code || ''))
        finishBookingAttempt(draftId, attempt);
      throw error;
    }
  }
  if (!/^VS-[A-Z0-9]{6}$/.test(code)) throw new Error('La respuesta de prueba no es válida.');
  finishBookingAttempt(draftId, attempt, code);
  const payment = await startPublicPayment(code);
  const url = new URL(payment.urlPago);
  // Solo admite la página local de simulación mientras la conexión real esté desactivada.
  if (url.origin !== window.location.origin || url.pathname !== '/reserva/resultado' || url.searchParams.get('codigo') !== code)
    throw new Error('La redirección real a Stripe está pendiente de validación.');
  return url.pathname + url.search;
}
