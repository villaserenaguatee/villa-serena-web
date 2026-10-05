import { publicRooms } from '@/data/publicRooms';
import { leerHuespedes, upsertHuesped } from '@/store/guestStore';
import { upsertReserva } from '@/store/reservationStore';
import { leerPromociones } from '@/store/promotionStore';
import { leerTarifas, tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { nochesEntre, siguienteCodigoReservaWeb } from '@/data/pms';
import type { Huesped, Pago, Reserva } from '@/lib/pms/types';
import { availableRoom, readAvailability, validGuests } from './publicAvailability';
import { fechaHotel } from './hotel';

export type BookingError =
  | 'unavailable'
  | 'invalidGuest'
  | 'priceChanged'
  | 'invalidPromo'
  | 'paymentUnverified'
  | 'paymentUnavailable'
  | 'saveFailed';

export class PublicBookingError extends Error {
  constructor(public code: BookingError) {
    super(code);
  }
}

interface PublicBookingRequest {
  id: string;
  params: URLSearchParams;
  promoCode: string;
}

interface PreparedBooking {
  guest: Huesped;
  reservation: Omit<Reserva, 'pagos'>;
  amount: number;
}

interface PaymentApproval {
  transactionId: string;
  amount: number;
  method: 'tarjeta';
  approved: true;
}

function requestId(params: URLSearchParams): string {
  const fingerprint = JSON.stringify(
    ['slug', 'habitacion', 'habitacionId', 'llegada', 'salida', 'adultos', 'ninos', 'correo', 'documento']
      .map(key => params.get(key)),
  );
  const key = 'vs-public-booking-request';
  const previous = JSON.parse(sessionStorage.getItem(key) || 'null');
  if (previous?.fingerprint === fingerprint)
    return previous.id as string;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, JSON.stringify({ fingerprint, id }));
  return id;
}

function prepareBooking({ id, params, promoCode }: PublicBookingRequest): PreparedBooking {
  const inventory = readAvailability();
  const arrival = params.get('llegada') || '';
  const departure = params.get('salida') || '';
  const adults = Number(params.get('adultos') || params.get('huespedes') || 1);
  const children = Number(params.get('ninos') || 0);
  const guestsCount = adults + children;
  const offer = publicRooms.find(room =>
    params.get('slug') ? room.slug === params.get('slug') : room.name === params.get('habitacion'),
  );
  if (!offer || !validGuests(adults, children))
    throw new PublicBookingError('unavailable');

  const physical = availableRoom(
    offer,
    arrival,
    departure,
    guestsCount,
    inventory,
    params.get('habitacionId') || undefined,
  );
  if (!physical)
    throw new PublicBookingError('unavailable');

  const price = leerTarifas()[tipoPublicoATipoHotel(offer.type)];
  const nights = nochesEntre(arrival, departure);
  const subtotal = price * nights;
  if (!Number.isFinite(subtotal) || subtotal <= 0)
    throw new PublicBookingError('unavailable');

  const promotion = promoCode
    ? leerPromociones().find(item =>
      item.activa &&
      item.codigo.toUpperCase() === promoCode.trim().toUpperCase() &&
      item.desde <= fechaHotel() &&
      item.hasta >= fechaHotel(),
    )
    : undefined;
  if (promoCode && !promotion)
    throw new PublicBookingError('invalidPromo');

  const discount = Math.round(subtotal * (promotion?.descuentoPct || 0)) / 100;
  const amount = Math.max(0, Math.round((subtotal - discount) * 100) / 100);
  const submittedTotal = Number(params.get('total'));
  if (!Number.isFinite(submittedTotal) || Math.abs(submittedTotal - subtotal) > 0.01)
    throw new PublicBookingError('priceChanged');

  const name = `${params.get('nombre') || ''} ${params.get('apellidos') || ''}`.trim();
  const email = params.get('correo')?.trim() || '';
  const document = params.get('documento')?.trim() || '';
  if (!name || !email || !document)
    throw new PublicBookingError('invalidGuest');

  const documentType = params.get('tipoDocumento') === 'Pasaporte' ? 'Pasaporte' : 'DPI';
  const existing = leerHuespedes()
    .find(guest => guest.tipoDocumento === documentType && guest.documento === document);
  const now = new Date().toISOString();
  const guest: Huesped = {
    id: existing?.id || `hu-${id}`,
    nombre: name,
    tipoDocumento: documentType,
    documento: document,
    correo: email,
    telefono: params.get('telefono') || '',
    nacionalidad: params.get('nacionalidad') || '',
    creadoEn: existing?.creadoEn || now,
  };

  const code = siguienteCodigoReservaWeb(inventory.reservas.map(reservation => reservation.codigo));

  const reservation: Omit<Reserva, 'pagos'> = {
    id: `web-${id}`,
    codigo: code,
    origenReserva: 'publica',
    solicitudPublicaId: id,
    precioNoche: price,
    habitacionPublica: offer.name,
    huespedId: guest.id,
    habitacionId: physical.id,
    tipoHabitacion: physical.tipo,
    fechaEntrada: arrival,
    fechaSalida: departure,
    personas: guestsCount,
    adultos: adults,
    ninos: children,
    estado: 'confirmada',
    acompanantes: [],
    servicios: [],
    descuento: discount,
    creadoEn: now,
  };

  return { guest, reservation, amount };
}

async function processCardPayment(
  amount: number,
  idempotencyKey: string,
): Promise<PaymentApproval> {
  void amount;
  void idempotencyKey;
  throw new PublicBookingError('paymentUnavailable');
}

export async function confirmarReservaPublica(
  params: URLSearchParams,
  promoCode = '',
): Promise<Reserva> {
  const id = requestId(params);
  const previous = readAvailability().reservas.find(reservation => reservation.solicitudPublicaId === id);
  if (previous?.estado === 'confirmada' && previous.pagos.some(payment => payment.metodo === 'tarjeta'))
    return previous;

  const prepared = prepareBooking({ id, params, promoCode });
  const approval = await processCardPayment(prepared.amount, id);
  if (
    approval.approved !== true ||
    approval.method !== 'tarjeta' ||
    !approval.transactionId ||
    !Number.isFinite(approval.amount) ||
    Math.abs(approval.amount - prepared.amount) > 0.01
  )
    throw new PublicBookingError('paymentUnverified');

  const payment: Pago = {
    destino: 'alojamiento',
    id: approval.transactionId,
    fecha: new Date().toISOString(),
    monto: prepared.amount,
    metodo: 'tarjeta',
    comprobante: approval.transactionId,
  };
  const guest = upsertHuesped(prepared.guest);
  const reservation: Reserva = {
    ...prepared.reservation,
    huespedId: guest.id,
    pagos: [payment],
  };
  upsertReserva(reservation);
  return reservation;
}
