import { AvailabilityError } from '@/lib/bff/publicAvailability';
import { demoCatalog, demoCreate, demoHotel, demoPayment, demoQuotes, demoStatus, parseContractBooking } from '@/lib/bff/publicContract';

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
    demoOnly();
    const route = path(request), url = new URL(request.url);
    if (route.length === 1 && route[0] === 'hotel') return Response.json(demoHotel(), { headers });
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
    demoOnly();
    const route = path(request);
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
      return Response.json(demoCreate(parseContractBooking(body), request.headers.get('Idempotency-Key') ?? ''), { status: 201, headers });
    }
    if (route.length === 3 && route[0] === 'reservas' && route[2] === 'pago') return Response.json(demoPayment(route[1], new URL(request.url).origin), { headers });
    throw new AvailabilityError('RUTA_NO_ENCONTRADA', 404);
  } catch (error) { return failure(error); }
}
