import { AvailabilityError } from '@/lib/bff/publicAvailability';
import { bookingEmailProof } from '@/lib/bff/bookingEmailVerification';
import { publicBookingAudit } from '@/lib/bff/publicBookingAudit';
import { creationResponse } from '@/lib/bff/bookingContext';
import { demoCatalog, demoCreate, demoHotel, demoOffers, demoOfferQuotes, demoPayment, demoQuotes, demoStatus, parseContractBooking } from '@/lib/bff/publicContract';

export const runtime = 'nodejs';
const headers = { 'Cache-Control': 'no-store', 'X-Villa-Serena-Mode': 'demo' };
const messages: Record<string, string> = {
  DATOS_INVALIDOS: 'Revisa las fechas, la cantidad de huéspedes y los datos obligatorios.',
  SIN_DISPONIBILIDAD: 'El tipo de habitación ya no está disponible para esta estancia.',
  RESERVA_NO_ENCONTRADA: 'No se encontró la reserva.',
  RESERVA_NO_PAGABLE: 'El plazo de pago de esta reserva venció.',
  BOOKING_REQUEST_CONFLICT: 'Ya existe un intento con otros datos. Recupera el intento anterior.',
  ORIGIN_FORBIDDEN: 'La petición debe proceder de este sitio.',
  API_NOT_READY: 'La conexión real está pendiente. No se sustituyó por datos de prueba.',
};
function failure(error: unknown) {
  const known = error instanceof AvailabilityError;
  const codigo = known ? error.code : 'SERVICIO_NO_DISPONIBLE';
  return Response.json({ codigo, mensaje: messages[codigo] ?? 'No se pudo completar la petición.', detalles: [] },
    { status: known ? error.status : 503, headers: { 'Cache-Control': 'no-store' } });
}
function demoOnly() {
  if ((process.env.VILLA_SERENA_BFF_MODE ?? 'demo') !== 'demo') throw new AvailabilityError('API_NOT_READY', 503);
}
function path(request: Request) { return new URL(request.url).pathname.slice('/api/publico/'.length).split('/').map(decodeURIComponent); }
export async function GET(request: Request) {
  try {
    if (process.env.VILLA_SERENA_BFF_MODE === 'api') {
      const route = path(request);
      const allowed = (route.length === 1 && ['hotel', 'tipos-habitacion', 'disponibilidad', 'ofertas'].includes(route[0])) ||
        (route.length === 2 && route[0] === 'ofertas' && route[1] === 'disponibilidad') ||
        (route.length === 2 && route[0] === 'tipos-habitacion' && /^\d+$/.test(route[1])) ||
        (route.length === 3 && route[0] === 'reservas' && route[2] === 'estado');
      if (!allowed) throw new AvailabilityError('RUTA_NO_ENCONTRADA', 404);
      if (!process.env.API_URL) throw new AvailabilityError('API_NOT_READY', 503);
      const query = new URL(request.url).searchParams;
      if ((route[0] === 'disponibilidad' || route[0] === 'ofertas') && query.has('numeroHuespedes')) {
        query.set('huespedes', query.get('numeroHuespedes')!);
        query.delete('numeroHuespedes');
      }
      let upstream: Response;
      try {
        upstream = await fetch(new URL(`/api/v1/publico/${route.map(encodeURIComponent).join('/')}?${query}`, process.env.API_URL), {
          cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { Accept: 'application/json' },
        });
      } catch { throw new AvailabilityError('API_NO_DISPONIBLE', 502); }
      const body = await upstream.json().catch(() => null);
      if (body === null) throw new AvailabilityError('RESPUESTA_API_INVALIDA', 502);
      return Response.json(body, { status: upstream.status, headers: { 'Cache-Control': 'no-store', 'X-Villa-Serena-Mode': 'spring' } });
    }
    demoOnly();
    const route = path(request), url = new URL(request.url);
    if (route.length === 1 && route[0] === 'hotel') return Response.json(demoHotel(), { headers });
    if (route.length === 1 && route[0] === 'ofertas') return Response.json(demoOffers(), { headers });
    if (route.length === 2 && route[0] === 'ofertas' && route[1] === 'disponibilidad') return Response.json(demoOfferQuotes(
      url.searchParams.get('entrada') ?? '', url.searchParams.get('salida') ?? '', Number(url.searchParams.get('numeroHuespedes'))), { headers });
    if (route[0] === 'tipos-habitacion' && route.length <= 2) {
      const catalog = demoCatalog();
      if (route.length === 1) return Response.json(catalog, { headers });
      const type = catalog.find(t => String(t.id) === route[1]);
      if (!type) throw new AvailabilityError('TIPO_NO_ENCONTRADO', 404);
      return Response.json(type, { headers });
    }
    if (route.length === 1 && route[0] === 'disponibilidad') return Response.json(demoQuotes(
      url.searchParams.get('entrada') ?? '', url.searchParams.get('salida') ?? '', Number(url.searchParams.get('numeroHuespedes'))), { headers });
    if (route.length === 3 && route[0] === 'reservas' && route[2] === 'estado') return Response.json(demoStatus(route[1]), { headers });
    throw new AvailabilityError('RUTA_NO_ENCONTRADA', 404);
  } catch (error) { return failure(error); }
}
export async function POST(request: Request) {
  try {
    if (request.headers.get('Origin') !== new URL(request.url).origin || request.headers.get('Sec-Fetch-Site') === 'cross-site')
      throw new AvailabilityError('ORIGIN_FORBIDDEN', 403);
    const route = path(request);
    if (process.env.VILLA_SERENA_BFF_MODE === 'api') {
      const creating = route.length === 1 && route[0] === 'reservas';
      const paying = route.length === 3 && route[0] === 'reservas' && /^VS-[A-Z0-9]{6}$/.test(route[1]) && route[2] === 'pago';
      if (!creating && !paying) throw new AvailabilityError('RUTA_NO_ENCONTRADA', 404);
      if (!process.env.API_URL) throw new AvailabilityError('API_NOT_READY', 503);
      const key = request.headers.get('Idempotency-Key');
      if (creating && (!key || !/^[a-zA-Z0-9_-]{16,100}$/.test(key))) throw new AvailabilityError('DATOS_INVALIDOS', 400);
      let body: string | undefined;
      let draftId = '';
      let target = route.map(encodeURIComponent).join('/');
      if (creating) {
        if (!request.body) throw new AvailabilityError('DATOS_INVALIDOS', 400);
        const reader = request.body.getReader(), chunks: Uint8Array[] = []; let size = 0;
        while (true) { const part = await reader.read(); if (part.done) break; size += part.value.length;
          if (size > 16384) { await reader.cancel(); throw new AvailabilityError('DATOS_INVALIDOS', 400); } chunks.push(part.value); }
        try { const parsed=JSON.parse(Buffer.concat(chunks).toString('utf8')); draftId=typeof parsed.borradorId==='string'?parsed.borradorId:''; delete parsed.borradorId; if(parsed.ofertaSlug){if(!/^[a-z0-9-]{1,80}$/.test(parsed.ofertaSlug)) throw new Error(); target=`ofertas/${parsed.ofertaSlug}/reservas`; delete parsed.ofertaSlug;} body=JSON.stringify(parsed); } catch { throw new AvailabilityError('DATOS_INVALIDOS', 400); }
      }
      const audit = publicBookingAudit(request, creating ? 'create' : 'checkout', creating ? key : null);
      let upstream: Response;
      try { upstream = await fetch(new URL(`/api/v1/publico/${target}`, process.env.API_URL), {
        method: 'POST', body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(30000),
        headers: { Accept: 'application/json', ...(creating ? { 'Content-Type': 'application/json', 'Idempotency-Key': key!, 'X-Booking-Draft': draftId, 'X-Booking-Email-Verification': bookingEmailProof(request, draftId) } : {}) },
      }); } catch { audit.finish(502); throw new AvailabilityError('API_NO_DISPONIBLE', 502); }
      const payload = await upstream.json().catch(() => null);
      if (payload === null) { audit.finish(502); throw new AvailabilityError('RESPUESTA_API_INVALIDA', 502); }
      audit.finish(upstream.status, payload);
      return Response.json(payload, {status: upstream.status, headers: {'Cache-Control':'no-store','X-Villa-Serena-Mode':'spring','X-Villa-Serena-Request-Id':audit.id}});
    }
    demoOnly();
    if (route.length === 1 && route[0] === 'reservas') {
      if (!request.body) throw new AvailabilityError('DATOS_INVALIDOS', 400);
      const reader = request.body.getReader(), chunks: Uint8Array[] = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.length;
        if (size > 16384) { await reader.cancel(); throw new AvailabilityError('DATOS_INVALIDOS', 400); }
        chunks.push(value);
      }
      let body: unknown;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AvailabilityError('DATOS_INVALIDOS', 400); }
      // Extensión de la simulación para recuperar un POST incierto; el contrato real no define esta cabecera.
      return creationResponse(demoCreate(parseContractBooking(body), request.headers.get('Idempotency-Key') ?? ''), request);
    }
    if (route.length === 3 && route[0] === 'reservas' && route[2] === 'pago') return Response.json(demoPayment(route[1], new URL(request.url).origin), { headers });
    throw new AvailabilityError('RUTA_NO_ENCONTRADA', 404);
  } catch (error) { return failure(error); }
}
