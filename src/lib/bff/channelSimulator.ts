import 'server-only';
import { randomInt } from 'node:crypto';
import { AvailabilityError } from './publicAvailability';
import { demoCatalog, demoQuotes, parseContractBooking } from './publicContract';
import { publicContractTransaction } from './publicContractStore';
import { bookingTransaction } from './demoBookingStore';
import { HUESPEDES_INICIALES, RESERVAS_INICIALES } from '@/data/pms';
import { publicSearchError } from '@/lib/publicStayValidation';
import type { ChannelInput, ChannelResult, ChannelReservation } from './contracts/channel';

export function parseChannelInput(value: unknown): ChannelInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new AvailabilityError('DATOS_INVALIDOS', 400);
  const input = value as ChannelInput;
  if (Object.keys(input).some(k => !['canal', 'reserva'].includes(k)) || !['BOOKING', 'EXPEDIA'].includes(input.canal)) throw new AvailabilityError('DATOS_INVALIDOS', 400);
  const booking = parseContractBooking(input.reserva);
  const r = input.reserva;
  if (Object.keys(r).some(k => !['identificadorExterno', 'tipoHabitacionId', 'entrada', 'salida', 'numeroHuespedes', 'montoTotal', 'huesped'].includes(k)) ||
    typeof r.identificadorExterno !== 'string' || !r.identificadorExterno.trim() || r.identificadorExterno.length > 60 ||
    !Number.isInteger(r.numeroHuespedes) || r.numeroHuespedes < 1 || !Number.isFinite(r.montoTotal) || r.montoTotal <= 0)
    throw new AvailabilityError('DATOS_INVALIDOS', 400);
  return { canal: input.canal, reserva: { ...booking, identificadorExterno: r.identificadorExterno.trim(), montoTotal: r.montoTotal } };
}
export function simulateChannel(input: ChannelInput): ChannelResult {
  return bookingTransaction(hotel => ({ changed: false, value: publicContractTransaction(state => {
    const r = input.reserva;
    const previous = state.channels?.find(e => e.reservation.canal === input.canal && e.reservation.identificadorExterno === r.identificadorExterno);
    if (previous) return { changed: false, value: { codigoHttp: 200, respuesta: previous.reservation } as ChannelResult };
    const type = demoCatalog().find(t => t.id === r.tipoHabitacionId);
    if (!type || publicSearchError(r.entrada, r.salida, r.numeroHuespedes, 0, type.capacidad))
      return { changed: false, value: { codigoHttp: 400, respuesta: { codigo: 'DATOS_INVALIDOS', mensaje: 'Revisa el tipo, las fechas y la cantidad de huéspedes.', detalles: [] } } as ChannelResult };
    if (!demoQuotes(r.entrada, r.salida, r.numeroHuespedes).some(q => q.tipoHabitacion.id === type.id))
      return { changed: false, value: { codigoHttp: 409, respuesta: { codigo: 'SIN_DISPONIBILIDAD', mensaje: 'No hay cupo para esta estancia y tipo de habitación.', detalles: [] } } as ChannelResult };
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo: string;
    do { codigo = `VS-${Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join('')}`; }
    while (codigo.startsWith('VS-DEMO') || state.entries.some(e => e.created.codigo === codigo) || state.channels?.some(e => e.reservation.codigo === codigo) || hotel.entries.some(e => e.result.code === codigo) || RESERVAS_INICIALES.some(e => e.codigo === codigo));
    const reservation: ChannelReservation = { codigo, estado: 'CONFIRMADA', canal: input.canal, identificadorExterno: r.identificadorExterno,
      tipoHabitacion: { id: type.id, nombre: type.nombre }, entrada: r.entrada, salida: r.salida, numeroHuespedes: r.numeroHuespedes, montoTotal: r.montoTotal };
    const old = HUESPEDES_INICIALES.concat(hotel.entries.map(e => e.compatibility.guest)).find(g => g.correo.toLowerCase() === r.huesped.correo);
    const known = state.entries.find(e => e.guest.correo === r.huesped.correo)?.guest ?? state.channels?.find(e => e.guest.correo === r.huesped.correo)?.guest ?? (old ? {
      nombreCompleto: old.nombre, correo: old.correo, telefono: old.telefono, nacionalidad: old.nacionalidad,
      numeroDocumento: old.documento, tipoDocumento: old.tipoDocumento === 'DPI' ? 'DPI' as const : 'PASAPORTE' as const,
    } : undefined);
    (state.channels ??= []).push({ reservation, guest: known ?? r.huesped });
    return { changed: true, value: { codigoHttp: 201, respuesta: reservation } as ChannelResult };
  }) }));
}
