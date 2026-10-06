import 'server-only';
import type { HabitacionHotel, TipoHabitacion } from '@/lib/pms/types';
import type { AvailabilityInput, AvailabilityResponse, ReservationHold } from './contracts/availability';

export class AvailabilityError extends Error {
  constructor(public code: string, public status: number) { super(code); }
}
const types = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
const roomStates = ['disponible', 'ocupada', 'reservada', 'en-limpieza', 'mantenimiento'];
const reservationStates = ['pendiente', 'confirmada', 'en-curso', 'finalizada', 'cancelada'];
function object(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}
function text(value: unknown, max = 100): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max;
}
export function validAvailabilityDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function parseAvailability(value: unknown, allowPastArrival = false): AvailabilityInput {
  if (!object(value) || !validAvailabilityDate(value.arrival) || !validAvailabilityDate(value.departure) ||
    value.departure <= value.arrival || !Number.isInteger(value.adults) || Number(value.adults) < 1 || Number(value.adults) > 30 ||
    !Number.isInteger(value.children) || Number(value.children) < 0 || Number(value.children) > 30) {
    throw new AvailabilityError('INVALID_AVAILABILITY_QUERY', 400);
  }
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guatemala', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  if (!allowPastArrival && value.arrival < today) throw new AvailabilityError('INVALID_AVAILABILITY_QUERY', 400);
  const demo = value.demo;
  if (!object(demo) || !Array.isArray(demo.rooms) || demo.rooms.length > 1000 || !Array.isArray(demo.holds) || demo.holds.length > 5000) {
    throw new AvailabilityError('INVALID_DEMO_CONTEXT', 400);
  }
  const seen = new Set<string>();
  const rooms = demo.rooms.map((room: unknown): HabitacionHotel => {
    if (!object(room) || !text(room.id) || seen.has(room.id) || !text(room.numero) || !Number.isInteger(room.piso) ||
      !types.includes(String(room.tipo)) || !Number.isInteger(room.capacidad) || Number(room.capacidad) < 1 || Number(room.capacidad) > 60 ||
      typeof room.precioNoche !== 'number' || !Number.isFinite(room.precioNoche) || room.precioNoche < 0 || !roomStates.includes(String(room.estado))) {
      throw new AvailabilityError('INVALID_DEMO_CONTEXT', 400);
    }
    seen.add(room.id);
    return { id: room.id, numero: room.numero, piso: Number(room.piso), tipo: room.tipo as TipoHabitacion,
      capacidad: Number(room.capacidad), precioNoche: room.precioNoche, estado: room.estado as HabitacionHotel['estado'] };
  });
  const codes = new Set<string>();
  const holds = demo.holds.map((hold: unknown): ReservationHold => {
    if (!object(hold) || !text(hold.code) || codes.has(hold.code) || !(hold.roomId === null || text(hold.roomId)) ||
      !types.includes(String(hold.roomType)) || !validAvailabilityDate(hold.arrival) || !validAvailabilityDate(hold.departure) ||
      hold.departure <= hold.arrival || !reservationStates.includes(String(hold.status))) {
      throw new AvailabilityError('INVALID_DEMO_CONTEXT', 400);
    }
    codes.add(hold.code);
    // Deleted legacy rooms do not cause unrelated saved reservations to disappear.
    return { code: hold.code, roomId: hold.roomId as string | null, roomType: hold.roomType as TipoHabitacion,
      arrival: hold.arrival, departure: hold.departure, status: String(hold.status) };
  });
  return { arrival: value.arrival, departure: value.departure, adults: Number(value.adults), children: Number(value.children), demo: { rooms, holds } };
}
export function queryAvailability(input: AvailabilityInput): AvailabilityResponse {
  const mode = process.env.VILLA_SERENA_BFF_MODE ?? 'demo';
  // No proposed API contract is adopted silently in this first migration block.
  if (mode !== 'demo') throw new AvailabilityError(mode === 'api' ? 'API_NOT_READY' : 'BFF_MODE_INVALID', 503);
  const { arrival, departure, adults, children, demo } = input;
  const active = demo.holds.filter(hold => ['pendiente', 'confirmada', 'en-curso'].includes(hold.status) &&
    hold.arrival < departure && arrival < hold.departure);
  const candidates = demo.rooms.filter(room => room.estado !== 'mantenimiento' && room.capacidad >= adults + children &&
    !active.some(hold => hold.roomId === room.id));
  // Unassigned reservations consume type inventory at the peak concurrent demand.
  const held = new Map<TipoHabitacion, number>();
  for (const type of new Set(candidates.map(room => room.tipo))) {
    const events = active.filter(hold => hold.roomId === null && hold.roomType === type)
      .flatMap(hold => [{ date: hold.arrival < arrival ? arrival : hold.arrival, delta: 1 },
        { date: hold.departure > departure ? departure : hold.departure, delta: -1 }])
      .sort((a, b) => a.date.localeCompare(b.date) || a.delta - b.delta);
    let demand = 0, peak = 0;
    for (const event of events) { demand += event.delta; peak = Math.max(peak, demand); }
    held.set(type, peak);
  }
  const rooms = candidates.filter(room => {
    const demand = held.get(room.tipo) ?? 0;
    if (!demand) return true;
    held.set(room.tipo, demand - 1);
    return false;
  });
  return { mode: 'demo', query: { arrival, departure, adults, children }, rooms };
}
