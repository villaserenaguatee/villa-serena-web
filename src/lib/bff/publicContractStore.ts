import 'server-only';
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { CreatedPublicDto, CreatePublicDto, PaymentDto } from './contracts/public';
import type { ReservationHold } from './contracts/availability';
import type { ChannelReservation } from './contracts/channel';
import { AvailabilityError } from './publicAvailability';
import { validPublicDate } from '@/lib/publicStayValidation';
export type ContractEntry = { attempt: string; fingerprint: string; created: CreatedPublicDto; guest: CreatePublicDto['huesped']; roomType: ReservationHold['roomType']; payment?: PaymentDto };
export type ChannelEntry = { reservation: ChannelReservation; guest: CreatePublicDto['huesped'] };
type State = { version: 1; entries: ContractEntry[]; channels?: ChannelEntry[] };
const path = () => process.env.VILLA_SERENA_PUBLIC_CONTRACT_PATH ?? resolve(process.cwd(), '.data/public-stripe-demo.json');
export function readPublicContractState(): State {
  try {
    const state = JSON.parse(readFileSync(path(), 'utf8')) as State;
    const types = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
    if (state?.version !== 1 || !Array.isArray(state.entries) || state.entries.some(e => !e?.created || !/^VS-[A-Z0-9]{6}$/.test(e.created.codigo) || e.created.estado !== 'PENDIENTE_PAGO' ||
      !Number.isFinite(e.created.total) || e.created.total <= 0 || !Number.isFinite(Date.parse(e.created.pagoVenceEn)) ||
      !validPublicDate(e.created.entrada) || !validPublicDate(e.created.salida) || e.created.salida <= e.created.entrada ||
      !Number.isInteger(e.created.noches) || e.created.noches < 1 || e.created.noches > 30 || e.created.noches !== (Date.parse(e.created.salida) - Date.parse(e.created.entrada)) / 86400000 ||
      !Number.isInteger(e.created.numeroHuespedes) || e.created.numeroHuespedes < 1 || e.created.numeroHuespedes > 5 ||
      !e.created.tipoHabitacion || e.created.tipoHabitacion.nombre !== e.roomType || !types.includes(e.roomType) || e.created.tipoHabitacion.id !== types.indexOf(e.roomType) + 1 ||
      !e.guest?.correo || !e.attempt || !/^[a-f0-9]{64}$/.test(e.fingerprint) ||
      (e.payment && (e.payment.expiraEn !== e.created.pagoVenceEn || typeof e.payment.urlPago !== 'string')))) throw new Error('Estado inválido');
    if (new Set(state.entries.map(e => e.attempt)).size !== state.entries.length || new Set(state.entries.map(e => e.created.codigo)).size !== state.entries.length) throw new Error('Duplicados');
    if (state.channels !== undefined && (!Array.isArray(state.channels) || state.channels.some(e => {
      const r = e?.reservation;
      return !r || !/^VS-[A-Z0-9]{6}$/.test(r.codigo) || r.estado !== 'CONFIRMADA' || !['BOOKING', 'EXPEDIA'].includes(r.canal) ||
        typeof r.identificadorExterno !== 'string' || !r.identificadorExterno.trim() || r.identificadorExterno.length > 60 ||
        !validPublicDate(r.entrada) || !validPublicDate(r.salida) || r.salida <= r.entrada || (Date.parse(r.salida) - Date.parse(r.entrada)) / 86400000 > 30 ||
        !Number.isInteger(r.numeroHuespedes) || r.numeroHuespedes < 1 || r.numeroHuespedes > 5 || !Number.isFinite(r.montoTotal) || r.montoTotal <= 0 ||
        !r.tipoHabitacion || r.tipoHabitacion.id !== types.indexOf(r.tipoHabitacion.nombre) + 1 || !types.includes(r.tipoHabitacion.nombre) || !e.guest?.correo;
    }))) throw new Error('Estado de canal inválido');
    const channels = state.channels ?? [];
    if (new Set(channels.map(e => `${e.reservation.canal}:${e.reservation.identificadorExterno}`)).size !== channels.length ||
      new Set([...state.entries.map(e => e.created.codigo), ...channels.map(e => e.reservation.codigo)]).size !== state.entries.length + channels.length) throw new Error('Duplicados');
    return state;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { version: 1, entries: [] };
    throw new AvailabilityError('BOOKING_STORAGE_UNAVAILABLE', 503);
  }
}
export function contractHolds(state = readPublicContractState()): ReservationHold[] {
  return [...state.entries.filter(e => Date.parse(e.created.pagoVenceEn) > Date.now()).map(e => ({ code: e.created.codigo, roomId: null, roomType: e.roomType, arrival: e.created.entrada, departure: e.created.salida, status: 'pendiente' })),
    ...(state.channels ?? []).map(({ reservation: r }): ReservationHold => ({ code: r.codigo, roomId: null, roomType: r.tipoHabitacion.nombre as ReservationHold['roomType'], arrival: r.entrada, departure: r.salida, status: 'confirmada' }))];
}
export function publicContractTransaction<T>(action: (state: State) => { value: T; changed: boolean }): T {
  const file = path(), lock = `${file}.lock`, temporary = `${file}.${randomUUID()}.tmp`;
  let handle: number | undefined;
  try {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 }); handle = openSync(lock, 'wx', 0o600);
    const state = readPublicContractState(), result = action(state);
    if (result.changed) { writeFileSync(temporary, JSON.stringify(state), { flag: 'wx', mode: 0o600 }); renameSync(temporary, file); }
    return result.value;
  } catch (error) {
    if (error instanceof AvailabilityError) throw error;
    throw new AvailabilityError((error as NodeJS.ErrnoException).code === 'EEXIST' ? 'BOOKING_STORAGE_BUSY' : 'BOOKING_STORAGE_UNAVAILABLE', 503);
  } finally {
    if (handle !== undefined) { closeSync(handle); try { unlinkSync(lock); } catch { /* Recuperación manual con escritores detenidos. */ } }
    try { unlinkSync(temporary); } catch { /* No se escribió un temporal. */ }
  }
}
