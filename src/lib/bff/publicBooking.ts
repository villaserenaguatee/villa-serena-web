import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { publicRooms } from '@/data/publicRoomSeed';
import { tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { fechaHotel } from '@/lib/hotel';
import type { Huesped, Promocion, Reserva, TipoHabitacion } from '@/lib/pms/types';
import { AvailabilityError, parseAvailability, queryAvailability, validAvailabilityDate } from './publicAvailability';
import { bookingTransaction, mergeBookingHolds, readBookingState, storedHolds } from './demoBookingStore';
import type { BookingCreated, BookingInput, BookingResult } from './contracts/booking';

const types: TipoHabitacion[] = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function text(value: unknown, max: number, required = true): value is string {
  return typeof value === 'string' && value.length <= max && (!required || value.trim().length > 0);
}
function requireDemo() {
  const mode = process.env.VILLA_SERENA_BFF_MODE ?? 'demo';
  if (mode !== 'demo') throw new AvailabilityError(mode === 'api' ? 'API_NOT_READY' : 'BFF_MODE_INVALID', 503);
}
export function parseBooking(value: unknown): BookingInput {
  requireDemo();
  if (!record(value) || !record(value.guest)) throw new AvailabilityError('INVALID_BOOKING', 400);
  const g = value.guest;
  if (!text(value.requestId, 36) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.requestId) ||
    !text(value.slug, 100) || !text(value.roomId, 100) || !text(value.promoCode, 100, false) ||
    typeof value.expectedTotal !== 'number' || !Number.isFinite(value.expectedTotal) || value.expectedTotal < 0 ||
    !['hotel', 'card', 'bank'].includes(String(value.paymentMethod)) ||
    !text(g.name, 150) || !text(g.email, 150) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(g.email.trim()) ||
    !text(g.phone, 30) || !text(g.nationality, 60) || !text(g.document, 30) || !['DPI', 'passport'].includes(String(g.documentType))) {
    throw new AvailabilityError('INVALID_BOOKING', 400);
  }
  const availability = parseAvailability(value);
  const demo = value.demo as Record<string, unknown>;
  if (!record(demo.rates) || types.some(type => typeof (demo.rates as Record<string, unknown>)[type] !== 'number' ||
    !Number.isFinite((demo.rates as Record<string, number>)[type]) || (demo.rates as Record<string, number>)[type] <= 0 ||
    (demo.rates as Record<string, number>)[type] > 1000000) || !Array.isArray(demo.promotions) || demo.promotions.length > 1000) {
    throw new AvailabilityError('INVALID_DEMO_CONTEXT', 400);
  }
  const promotions = demo.promotions.map((p: unknown): Promocion => {
    if (!record(p) || !text(p.id, 100) || !text(p.nombre, 150) || !text(p.codigo, 100) ||
      typeof p.activa !== 'boolean' || typeof p.descuentoPct !== 'number' || !Number.isFinite(p.descuentoPct) ||
      p.descuentoPct < 0 || p.descuentoPct > 100 || !validAvailabilityDate(p.desde) || !validAvailabilityDate(p.hasta) || p.hasta < p.desde) {
      throw new AvailabilityError('INVALID_DEMO_CONTEXT', 400);
    }
    return { id: p.id, nombre: p.nombre, codigo: p.codigo, activa: p.activa, descuentoPct: p.descuentoPct, desde: p.desde, hasta: p.hasta };
  });
  return { ...availability, requestId: value.requestId, slug: value.slug, roomId: value.roomId,
    paymentMethod: value.paymentMethod as BookingInput['paymentMethod'], promoCode: value.promoCode.trim().toUpperCase(), expectedTotal: value.expectedTotal,
    guest: { name: g.name.trim(), email: g.email.trim(), phone: g.phone.trim(), nationality: g.nationality.trim(),
      document: g.document.trim(), documentType: g.documentType as BookingInput['guest']['documentType'] },
    demo: { ...availability.demo, rates: Object.fromEntries(types.map(t => [t, (demo.rates as Record<string, number>)[t]])) as Record<TipoHabitacion, number>, promotions } };
}
export function createBooking(input: BookingInput): BookingCreated {
  requireDemo();
  // Provider flows remain separate and unavailable; no inventory or guest is written.
  if (input.paymentMethod !== 'hotel') throw new AvailabilityError('PAYMENT_UNAVAILABLE', 503);
  const { demo, ...attempt } = input;
  const fingerprint = createHash('sha256').update(JSON.stringify(attempt)).digest('hex');
  return bookingTransaction(state => {
    const previous = state.entries.find(e => e.requestId === input.requestId);
    if (previous) {
      if (previous.fingerprint !== fingerprint) throw new AvailabilityError('BOOKING_REQUEST_CONFLICT', 409);
      return { value: { result: previous.result, compatibility: previous.compatibility }, changed: false };
    }
    const offer = publicRooms.find(o => o.slug === input.slug);
    if (!offer || input.adults + input.children > offer.capacity) throw new AvailabilityError('ROOM_UNAVAILABLE', 409);
    const type = tipoPublicoATipoHotel(offer.type);
    const rooms = queryAvailability({ ...input, demo: { rooms: demo.rooms, holds: mergeBookingHolds(demo.holds, storedHolds(state)) } }).rooms;
    const room = rooms.find(r => r.id === input.roomId && r.tipo === type && r.piso === offer.floor);
    if (!room) throw new AvailabilityError('ROOM_UNAVAILABLE', 409);
    const price = demo.rates[type], nights = (Date.parse(input.departure) - Date.parse(input.arrival)) / 86400000;
    const subtotal = Math.round(price * nights * 100) / 100;
    const promotion = input.promoCode ? demo.promotions.find(p => p.activa && p.codigo.toUpperCase() === input.promoCode && p.desde <= fechaHotel() && p.hasta >= fechaHotel()) : undefined;
    if (input.promoCode && !promotion) throw new AvailabilityError('INVALID_PROMO', 400);
    const discount = Math.round(subtotal * (promotion?.descuentoPct ?? 0)) / 100;
    const total = Math.round((subtotal - discount) * 100) / 100;
    if (Math.abs(input.expectedTotal - total) > 0.001) throw new AvailabilityError('PRICE_CHANGED', 409);
    const now = new Date().toISOString();
    const matching = state.entries.find(e => e.compatibility.guest.tipoDocumento === (input.guest.documentType === 'passport' ? 'Pasaporte' : 'DPI') && e.compatibility.guest.documento === input.guest.document)?.compatibility.guest;
    const guest: Huesped = { id: matching?.id ?? `hu-${randomUUID()}`, creadoEn: matching?.creadoEn ?? now,
      nombre: input.guest.name, correo: input.guest.email, telefono: input.guest.phone, nacionalidad: input.guest.nationality,
      documento: input.guest.document, tipoDocumento: input.guest.documentType === 'passport' ? 'Pasaporte' : 'DPI' };
    const knownCodes = new Set([...demo.holds.map(h => h.code), ...state.entries.map(e => e.result.code)]);
    let code: string;
    do { code = `RES-${randomUUID().replaceAll('-', '').toUpperCase()}`; } while (knownCodes.has(code));
    const reservation: Reserva = { id: `web-${randomUUID()}`, codigo: code, origenReserva: 'publica', solicitudPublicaId: input.requestId,
      precioNoche: price, habitacionPublica: offer.name, huespedId: guest.id, habitacionId: room.id, tipoHabitacion: type,
      fechaEntrada: input.arrival, fechaSalida: input.departure, personas: input.adults + input.children,
      adultos: input.adults, ninos: input.children, estado: 'confirmada', acompanantes: [], servicios: [], pagos: [], descuento: discount, creadoEn: now };
    const created: BookingCreated = { result: { mode: 'demo', code, status: 'confirmed', paymentMethod: 'hotel', paymentStatus: 'unpaid', total }, compatibility: { guest, reservation } };
    state.entries.push({ ...created, requestId: input.requestId, fingerprint });
    return { value: created, changed: true };
  });
}
export function bookingResult(code: string): BookingResult {
  requireDemo();
  if (!/^RES-[A-F0-9]{32}$/.test(code)) throw new AvailabilityError('BOOKING_NOT_FOUND', 404);
  const entry = readBookingState().entries.find(e => e.result.code === code);
  if (!entry) throw new AvailabilityError('BOOKING_NOT_FOUND', 404);
  return { mode: 'demo', code: entry.result.code, status: entry.result.status,
    paymentMethod: 'hotel', paymentStatus: 'unpaid', total: entry.result.total };
}
