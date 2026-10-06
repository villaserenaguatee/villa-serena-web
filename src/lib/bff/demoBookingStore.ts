import 'server-only';
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AvailabilityError, validAvailabilityDate } from './publicAvailability';
import type { BookingCreated } from './contracts/booking';
import type { ReservationHold } from './contracts/availability';

type Entry = BookingCreated & { requestId: string; fingerprint: string };
export type BookingState = { version: 1; entries: Entry[] };
function statePath() { return process.env.VILLA_SERENA_BFF_STATE_PATH || resolve(process.cwd(), '.data/public-bookings.json'); }
function text(value: unknown): value is string { return typeof value === 'string' && value.trim().length > 0 && value.length <= 150; }
function validEntry(value: unknown): value is Entry {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const entry = value as Entry, result = entry.result, reservation = entry.compatibility?.reservation, guest = entry.compatibility?.guest;
  if (!text(entry.requestId) || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(entry.requestId) ||
    typeof entry.fingerprint !== 'string' || !/^[0-9a-f]{64}$/.test(entry.fingerprint) ||
    !result || result.mode !== 'demo' || !/^RES-[A-F0-9]{32}$/.test(result.code) || result.status !== 'confirmed' ||
    result.paymentMethod !== 'hotel' || result.paymentStatus !== 'unpaid' || !Number.isFinite(result.total) || result.total < 0 ||
    !reservation || !guest || !text(guest.id) || !text(guest.nombre) || !text(guest.correo) || !text(guest.documento) ||
    !['DPI', 'Pasaporte'].includes(guest.tipoDocumento) || !text(guest.telefono) || !text(guest.nacionalidad) ||
    !text(reservation.id) || reservation.codigo !== result.code || reservation.huespedId !== guest.id ||
    reservation.solicitudPublicaId !== entry.requestId || reservation.origenReserva !== 'publica' ||
    !text(reservation.habitacionId) || !['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'].includes(reservation.tipoHabitacion) ||
    !validAvailabilityDate(reservation.fechaEntrada) || !validAvailabilityDate(reservation.fechaSalida) || reservation.fechaSalida <= reservation.fechaEntrada ||
    !Number.isInteger(reservation.adultos) || Number(reservation.adultos) < 1 || Number(reservation.adultos) > 30 ||
    !Number.isInteger(reservation.ninos) || Number(reservation.ninos) < 0 || Number(reservation.ninos) > 30 ||
    reservation.personas !== Number(reservation.adultos) + Number(reservation.ninos) || reservation.estado !== 'confirmada' ||
    !Array.isArray(reservation.pagos) || reservation.pagos.length !== 0 ||
    !Array.isArray(reservation.servicios) || !Array.isArray(reservation.acompanantes) ||
    typeof reservation.precioNoche !== 'number' || !Number.isFinite(reservation.precioNoche) || reservation.precioNoche <= 0 ||
    !Number.isFinite(reservation.descuento) || reservation.descuento < 0 ||
    !text(reservation.creadoEn) || !Number.isFinite(Date.parse(reservation.creadoEn)) ||
    !text(guest.creadoEn) || !Number.isFinite(Date.parse(guest.creadoEn))) return false;
  const nights = (Date.parse(reservation.fechaSalida) - Date.parse(reservation.fechaEntrada)) / 86400000;
  const subtotal = Math.round(reservation.precioNoche * nights * 100) / 100;
  return reservation.descuento <= subtotal && Math.abs(result.total - Math.round((subtotal - reservation.descuento) * 100) / 100) < 0.001;
}
export function readBookingState(): BookingState {
  try {
    const value = JSON.parse(readFileSync(statePath(), 'utf8')) as BookingState;
    const requests = new Set<string>(), codes = new Set<string>(), ids = new Set<string>();
    if (!value || value.version !== 1 || !Array.isArray(value.entries) || value.entries.some(e => {
      if (!validEntry(e) || requests.has(e.requestId) || codes.has(e.result.code) || ids.has(e.compatibility.reservation.id)) return true;
      requests.add(e.requestId); codes.add(e.result.code); ids.add(e.compatibility.reservation.id);
      return false;
    })) {
      throw new Error('Invalid state');
    }
    return value;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, entries: [] };
    throw new AvailabilityError('BOOKING_STORAGE_UNAVAILABLE', 503);
  }
}
export function storedHolds(state = readBookingState()): ReservationHold[] {
  return state.entries.map(({ compatibility: { reservation: r } }) => ({ code: r.codigo, roomId: r.habitacionId,
    roomType: r.tipoHabitacion, arrival: r.fechaEntrada, departure: r.fechaSalida, status: r.estado }));
}
export function mergeBookingHolds(local: ReservationHold[], stored: ReservationHold[]): ReservationHold[] {
  const known = new Set(stored.map(h => h.code));
  return [...local.filter(h => !known.has(h.code)), ...stored];
}
// Synchronous read/validate/write inside an exclusive file lock, also across Node workers.
// A busy or abandoned lock fails explicitly; never break a lock based on a timeout.
export function bookingTransaction<T>(action: (state: BookingState) => { value: T; changed: boolean }): T {
  const file = statePath(), lock = `${file}.lock`, temporary = `${file}.${randomUUID()}.tmp`;
  let handle: number | undefined;
  try {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 });
    handle = openSync(lock, 'wx', 0o600);
    const state = readBookingState();
    const result = action(state);
    if (result.changed) {
      writeFileSync(temporary, JSON.stringify(state), { mode: 0o600, flag: 'wx' });
      renameSync(temporary, file);
    }
    return result.value;
  } catch (error) {
    if (error instanceof AvailabilityError) throw error;
    throw new AvailabilityError((error as NodeJS.ErrnoException).code === 'EEXIST' ? 'BOOKING_STORAGE_BUSY' : 'BOOKING_STORAGE_UNAVAILABLE', 503);
  } finally {
    if (handle !== undefined) { closeSync(handle); try { unlinkSync(lock); } catch { /* lock recovery documented */ } }
    try { unlinkSync(temporary); } catch { /* no temporary on read-only transactions */ }
  }
}
