import 'server-only';
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { AvailabilityError } from './publicAvailability';
import type { BookingCreated } from './contracts/booking';
import type { ReservationHold } from './contracts/availability';

type Entry = BookingCreated & { requestId: string; fingerprint: string };
export type BookingState = { version: 1; entries: Entry[] };
function statePath() { return process.env.VILLA_SERENA_BFF_STATE_PATH || resolve(process.cwd(), '.data/public-bookings.json'); }
export function readBookingState(): BookingState {
  try {
    const value = JSON.parse(readFileSync(statePath(), 'utf8')) as BookingState;
    if (value.version !== 1 || !Array.isArray(value.entries) || value.entries.some(e =>
      !e.requestId || !e.fingerprint || !e.result?.code || !e.compatibility?.reservation || !e.compatibility?.guest)) {
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
