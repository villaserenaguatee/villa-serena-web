import { publicRooms } from '@/data/publicRooms';
import { leerHuespedes } from '@/store/guestStore';
import { guardarReservaDelPortal, leerPortalRecepcion } from '@/store/portalReceptionSync';
import { leerPromociones } from '@/store/promotionStore';
import { leerTarifas, tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { nochesEntre, siguienteCodigoReservaWeb } from '@/data/pms';
import type { Huesped, Reserva } from '@/lib/pms/types';
import { availableRoom, readAvailability, validGuests } from './publicAvailability';
import { fechaHotel } from './hotel';
export type BookingError = 'unavailable' | 'invalidGuest' | 'priceChanged' | 'invalidPromo' | 'paymentUnverified' | 'saveFailed';
export class PublicBookingError extends Error {
  constructor(public code: BookingError) { super(code); }
}
function requestId(params: URLSearchParams) {
  const fingerprint = JSON.stringify(['slug', 'habitacion', 'habitacionId', 'llegada', 'salida', 'adultos', 'ninos', 'correo', 'documento'].map(k => params.get(k)));
  const key = 'vs-public-booking-request';
  const previous = JSON.parse(sessionStorage.getItem(key) || 'null');
  if (previous?.fingerprint === fingerprint)
    return previous.id as string;
  const id = crypto.randomUUID();
  sessionStorage.setItem(key, JSON.stringify({ fingerprint, id }));
  return id;
}
export async function confirmarReservaPublica(params: URLSearchParams,
  method: 'hotel' | 'card',
  promoCode = ''): Promise<Reserva> {
  if (method === 'card')
    throw new PublicBookingError('paymentUnverified');
  const id = requestId(params);
  const save = () => {
    const inventory = readAvailability();
    const previous = inventory.reservas.find(r => r.solicitudPublicaId === id);
    if (previous)
      return previous;
    const arrival = params.get('llegada') || '', departure = params.get('salida') || '';
    const adults = Number(params.get('adultos') || params.get('huespedes') || 1);
    const children = Number(params.get('ninos') || 0);
    const offer = publicRooms.find(r => params.get('slug') ? r.slug === params.get('slug') : r.name === params.get('habitacion'));
    if (!offer || !validGuests(adults, children))
      throw new PublicBookingError('unavailable');
    const physical = availableRoom(offer, arrival, departure, adults + children, inventory, params.get('habitacionId') || undefined);
    if (!physical)
      throw new PublicBookingError('unavailable');
    const price = leerTarifas()[tipoPublicoATipoHotel(offer.type)];
    const subtotal = price * nochesEntre(arrival, departure);
    if (Math.abs(Number(params.get('total')) - subtotal) > 0.01 || !Number.isFinite(Number(params.get('total'))))
      throw new PublicBookingError('priceChanged');
    const promotion = promoCode ? leerPromociones().find(p => p.activa && p.codigo.toUpperCase() === promoCode.trim().toUpperCase() && p.desde <= fechaHotel() && p.hasta >= fechaHotel()) : undefined;
    if (promoCode && !promotion)
      throw new PublicBookingError('invalidPromo');
    const name = `${params.get('nombre') || ''} ${params.get('apellidos') || ''}`.trim();
    const email = params.get('correo')?.trim() || '', document = params.get('documento')?.trim() || '';
    if (!name || !email || !document)
      throw new PublicBookingError('invalidGuest');
    const documentType = params.get('tipoDocumento') === 'Pasaporte' ? 'Pasaporte' : 'DPI';
    const existing = [...leerPortalRecepcion().huespedes, ...leerHuespedes()].find(h => h.tipoDocumento === documentType && h.documento === document);
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
    let code = siguienteCodigoReservaWeb();
    while (inventory.reservas.some(r => r.codigo === code))
      code = siguienteCodigoReservaWeb();
    const booking: Reserva = {
      id: `web-${id}`,
      codigo: code,
      origenReserva: 'publica',
      solicitudPublicaId: id,
      modalidadPago: 'hotel',
      precioNoche: price,
      habitacionPublica: offer.name,
      huespedId: guest.id,
      habitacionId: physical.id,
      tipoHabitacion: physical.tipo,
      fechaEntrada: arrival,
      fechaSalida: departure,
      personas: adults + children,
      adultos: adults,
      ninos: children,
      estado: 'confirmada',
      acompanantes: [],
      servicios: [],
      pagos: [],
      descuento: Math.round(subtotal * (promotion?.descuentoPct || 0)) / 100,
      creadoEn: now,
    };
    guardarReservaDelPortal(guest, booking);
    return booking;
  };
  return navigator.locks ? navigator.locks.request('vs-public-booking', save) : save();
}
