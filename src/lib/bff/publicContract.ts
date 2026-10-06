import 'server-only';
import { createHash, randomInt } from 'node:crypto';
import { publicRooms } from '@/data/publicRoomSeed';
import { HABITACIONES_CENTRALES, HUESPEDES_INICIALES, RESERVAS_INICIALES } from '@/data/pms';
import { HOTEL } from '@/lib/hotel';
import { publicSearchError } from '@/lib/publicStayValidation';
import { TARIFAS_PREDETERMINADAS, tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { AvailabilityError, queryAvailability } from './publicAvailability';
import { bookingTransaction, storedHolds, mergeBookingHolds } from './demoBookingStore';
import { contractHolds, publicContractTransaction, readPublicContractState } from './publicContractStore';
import type { CreatePublicDto, CreatedPublicDto, HotelDto, PaymentDto, PublicStatusDto, QuoteDto, RoomTypeDto } from './contracts/public';

const types = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'] as const;
// IDs exclusivos de estas fixtures, publicados por el BFF. No se reutilizan al conectar Spring.
export function demoCatalog(): RoomTypeDto[] {
  return types.map((type, index) => {
    const offers = publicRooms.filter(o => tipoPublicoATipoHotel(o.type) === type);
    return { id: index + 1, nombre: type, descripcion: offers[0].description, capacidad: Math.max(...HABITACIONES_CENTRALES.filter(r => r.tipo === type).map(r => r.capacidad)), precioBaseNoche: TARIFAS_PREDETERMINADAS[type], fotos: [...new Set(offers.flatMap(o => o.gallery))] };
  });
}
export function demoHotel(): HotelDto {
  return { nombre: HOTEL.nombre, descripcion: 'Hospitalidad cercana, habitaciones cómodas y experiencias pensadas para acompañar tu estancia.', fotos: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1900&q=90'],
    ubicacion: { direccion: HOTEL.ubicacion }, contacto: { correo: HOTEL.correo, telefono: HOTEL.telefono }, horaCheckIn: '15:00', horaCheckOut: '12:00' };
}
export function demoQuotes(entrada: string, salida: string, numeroHuespedes: number): QuoteDto[] {
  const reason = publicSearchError(entrada, salida, numeroHuespedes, 0);
  if (reason) throw new AvailabilityError('DATOS_INVALIDOS', 400);
  const baseHolds = RESERVAS_INICIALES.map(r => ({ code: r.codigo, roomId: r.habitacionId, roomType: r.tipoHabitacion, arrival: r.fechaEntrada, departure: r.fechaSalida, status: r.estado }));
  const rooms = queryAvailability({ arrival: entrada, departure: salida, adults: numeroHuespedes, children: 0,
    demo: { rooms: HABITACIONES_CENTRALES, holds: [...mergeBookingHolds(baseHolds, storedHolds()), ...contractHolds()] } }).rooms;
  const noches = (Date.parse(salida) - Date.parse(entrada)) / 86400000;
  return demoCatalog().filter(type => type.capacidad >= numeroHuespedes && rooms.some(r => r.tipo === type.nombre)).map(tipoHabitacion => ({
    tipoHabitacion, noches, total: Math.round(noches * tipoHabitacion.precioBaseNoche * 100) / 100,
    // Fixtures sin recargos nuevos: temporada nula y ajuste de fin de semana del 0 %.
    desglose: Array.from({ length: noches }, (_, i) => {
      const date = new Date(Date.parse(entrada) + i * 86400000);
      return { fecha: date.toISOString().slice(0, 10), precio: tipoHabitacion.precioBaseNoche, temporada: null, finDeSemana: [5, 6].includes(date.getUTCDay()) };
    }),
  }));
}
export function parseContractBooking(value: unknown): CreatePublicDto {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AvailabilityError('DATOS_INVALIDOS', 400);
  const input = value as CreatePublicDto, g = input.huesped;
  if (!Number.isInteger(input.tipoHabitacionId) || input.tipoHabitacionId < 1 || !g || typeof g !== 'object' || Array.isArray(g) || typeof input.entrada !== 'string' || typeof input.salida !== 'string' ||
    Object.entries({ nombreCompleto: 150, correo: 150, telefono: 30, nacionalidad: 60, numeroDocumento: 30 }).some(([key, max]) => typeof g[key as keyof typeof g] !== 'string' || !String(g[key as keyof typeof g]).trim() || String(g[key as keyof typeof g]).length > max) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.correo) || !['DPI', 'PASAPORTE'].includes(g.tipoDocumento)) throw new AvailabilityError('DATOS_INVALIDOS', 400);
  return { tipoHabitacionId: input.tipoHabitacionId, entrada: input.entrada, salida: input.salida, numeroHuespedes: input.numeroHuespedes,
    huesped: { nombreCompleto: g.nombreCompleto.trim(), correo: g.correo.trim().toLowerCase(), telefono: g.telefono.trim(), nacionalidad: g.nacionalidad.trim(), tipoDocumento: g.tipoDocumento, numeroDocumento: g.numeroDocumento.trim() } };
}
export function demoCreate(input: CreatePublicDto, attempt: string): CreatedPublicDto {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(attempt)) throw new AvailabilityError('DATOS_INVALIDOS', 400);
  const fingerprint = createHash('sha256').update(JSON.stringify(input)).digest('hex');
  // Comparte el bloqueo de inventario de #13: las creaciones hotel y Stripe no compiten sin coordinación.
  return bookingTransaction(hotelState => ({ changed: false, value: publicContractTransaction(state => {
    const previous = state.entries.find(e => e.attempt === attempt);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new AvailabilityError('BOOKING_REQUEST_CONFLICT', 409);
      return { value: previous.created, changed: false };
    }
    const quote = demoQuotes(input.entrada, input.salida, input.numeroHuespedes).find(q => q.tipoHabitacion.id === input.tipoHabitacionId);
    if (!quote) throw new AvailabilityError('SIN_DISPONIBILIDAD', 409);
    let codigo: string;
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    do { codigo = `VS-${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('')}`; }
    while (state.entries.some(e => e.created.codigo === codigo) || RESERVAS_INICIALES.some(r => r.codigo === codigo) || hotelState.entries.some(e => e.result.code === codigo));
    const created: CreatedPublicDto = { codigo, estado: 'PENDIENTE_PAGO', tipoHabitacion: { id: quote.tipoHabitacion.id, nombre: quote.tipoHabitacion.nombre },
      entrada: input.entrada, salida: input.salida, numeroHuespedes: input.numeroHuespedes, noches: quote.noches, total: quote.total, pagoVenceEn: new Date(Date.now() + 30 * 60000).toISOString() };
    const legacyGuest = hotelState.entries.map(e => e.compatibility.guest).concat(HUESPEDES_INICIALES).find(g => g.correo.toLowerCase() === input.huesped.correo);
    const known = state.entries.find(e => e.guest.correo === input.huesped.correo)?.guest ?? (legacyGuest ? {
      nombreCompleto: legacyGuest.nombre, correo: legacyGuest.correo, telefono: legacyGuest.telefono, nacionalidad: legacyGuest.nacionalidad,
      numeroDocumento: legacyGuest.documento, tipoDocumento: legacyGuest.tipoDocumento === 'DPI' ? 'DPI' as const : 'PASAPORTE' as const,
    } : undefined);
    state.entries.push({ attempt, fingerprint, created, guest: known ?? input.huesped, roomType: types[quote.tipoHabitacion.id - 1] });
    return { value: created, changed: true };
  }) }));
}
export function demoStatus(codigo: string): PublicStatusDto {
  const entry = readPublicContractState().entries.find(e => e.created.codigo === codigo);
  if (!entry) throw new AvailabilityError('RESERVA_NO_ENCONTRADA', 404);
  const expired = Date.parse(entry.created.pagoVenceEn) <= Date.now();
  return { codigo, estadoReserva: expired ? 'CANCELADA' : 'PENDIENTE_PAGO', estadoPago: expired ? 'FALLIDO' : entry.payment ? 'PENDIENTE' : null, puedeReintentar: !expired };
}
export function demoPayment(codigo: string, origin: string): PaymentDto {
  return publicContractTransaction(state => {
    const entry = state.entries.find(e => e.created.codigo === codigo);
    if (!entry) throw new AvailabilityError('RESERVA_NO_ENCONTRADA', 404);
    if (Date.parse(entry.created.pagoVenceEn) <= Date.now()) throw new AvailabilityError('RESERVA_NO_PAGABLE', 409);
    if (entry.payment) return { value: entry.payment, changed: false };
    entry.payment = { urlPago: new URL(`/reserva/resultado?${new URLSearchParams({ codigo, prueba: '1' })}`, origin).href, expiraEn: entry.created.pagoVenceEn };
    return { value: entry.payment, changed: true };
  });
}
