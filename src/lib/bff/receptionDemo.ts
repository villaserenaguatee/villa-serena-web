import 'server-only';
import { closeSync, mkdirSync, openSync, readFileSync, renameSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { HABITACIONES_CENTRALES, HUESPEDES_INICIALES, RESERVAS_INICIALES, fechaRelativaISO } from '@/data/pms';
import { fechaHotel } from '@/lib/hotel';
import { validReceptionDate as validPublicDate } from '@/lib/receptionValidation';
import { canAssign, canCancel, canMarkDirty, isExternal } from '@/lib/receptionPresentation';
import type { CancellationPreview, ReservationDetail, ReservationPage, ReservationSummary, RoomReference, RoomState } from './contracts/reception';

export class ReceptionDemoError extends Error {
  constructor(public codigo: string, public status: number, message: string) { super(message); }
}
type Entry = { detail: ReservationDetail; paid: number; payment: 'TARJETA' | 'CANAL' | null; refunded: boolean; refundRejected: boolean; account: 'ABIERTA' | 'CERRADA' };
export type ReceptionState = { version: 1; entries: Entry[]; rooms: RoomState[]; audit: { action: string; code: string; at: string; responsible: string }[] };
const types = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
const active = (r: ReservationDetail) => ['PENDIENTE_PAGO', 'CONFIRMADA', 'EN_ESTADIA'].includes(r.estado);
const path = () => process.env.VILLA_SERENA_RECEPTION_DEMO_PATH ?? resolve(process.cwd(), '.data/reception-demo.json');
function fail(codigo: string, status: number, message: string): never { throw new ReceptionDemoError(codigo, status, message); }
const reference = (r: RoomState): RoomReference => ({ id: r.id, numero: r.numero, piso: r.piso });

export function receptionSeed(): ReceptionState {
  const rooms: RoomState[] = HABITACIONES_CENTRALES.map((r, i) => ({ id: i + 1, numero: r.numero, piso: r.piso,
    tipoHabitacion: { id: types.indexOf(r.tipo) + 1, nombre: r.tipo }, ocupacion: 'LIBRE',
    condicion: r.estado === 'mantenimiento' ? 'FUERA_DE_SERVICIO' : r.estado === 'en-limpieza' ? 'EN_LIMPIEZA' : 'LIMPIA',
    llegaHoy: false, saleHoy: false, incidenciaPendiente: false,
    incidenciaBloqueante: r.estado === 'mantenimiento' ? { id: i + 1, descripcion: 'Incidencia de mantenimiento de prueba.', estado: 'REPORTADA', reportadaEn: new Date().toISOString() } : null }));
  const states = { pendiente: 'PENDIENTE_PAGO', confirmada: 'CONFIRMADA', 'en-curso': 'EN_ESTADIA', finalizada: 'FINALIZADA', cancelada: 'CANCELADA' } as const;
  const entries: Entry[] = RESERVAS_INICIALES.map((r, i) => {
    const g = HUESPEDES_INICIALES.find(g => g.id === r.huespedId)!;
    let room = rooms.find(h => `hh-${h.numero}` === r.habitacionId && h.tipoHabitacion.nombre === r.tipoHabitacion);
    if (!room && r.estado === 'en-curso') room = rooms.find(h => h.tipoHabitacion.nombre === r.tipoHabitacion && h.ocupacion === 'LIBRE' && h.condicion === 'LIMPIA');
    if (room && r.estado === 'en-curso') room.ocupacion = 'OCUPADA';
    const noches = (Date.parse(r.fechaSalida) - Date.parse(r.fechaEntrada)) / 86400000;
    const total = Math.round((noches * (HABITACIONES_CENTRALES.find(h => h.tipo === r.tipoHabitacion)!.precioNoche) - r.descuento) * 100) / 100;
    const paid = r.pagos.reduce((sum, p) => sum + p.monto, 0);
    const estado = states[r.estado];
    const detail: ReservationDetail = { codigo: `VS-TEST0${i + 1}`, estado, canal: r.pagos.some(p => p.metodo === 'tarjeta') || r.estado === 'pendiente' ? 'DIRECTO_WEB' : 'RECEPCION', identificadorExterno: null,
      entrada: r.fechaEntrada, salida: r.fechaSalida, noches, numeroHuespedes: r.personas, tipoHabitacion: { id: types.indexOf(r.tipoHabitacion) + 1, nombre: r.tipoHabitacion }, habitacion: room ? reference(room) : null,
      huesped: { id: HUESPEDES_INICIALES.indexOf(g) + 1, nombreCompleto: g.nombre, correo: g.correo, telefono: g.telefono, nacionalidad: g.nacionalidad, tipoDocumento: g.tipoDocumento === 'DPI' ? 'DPI' : 'PASAPORTE', numeroDocumento: g.documento },
      huespedesAdicionales: r.acompanantes.map((g, index) => ({ id: index + 1, nombreCompleto: g.nombre, tipoDocumento: 'DPI', numeroDocumento: g.documento, nacionalidad: 'Guatemala' })), total, saldoPendiente: Math.max(0, total - paid), creadaEn: r.creadoEn,
      historial: [{ estadoAnterior: null, estadoNuevo: r.estado === 'pendiente' ? 'PENDIENTE_PAGO' : 'CONFIRMADA', responsable: 'Datos de prueba', fechaHora: r.creadoEn, motivo: null }] };
    if (r.checkInEn) detail.historial.push({ estadoAnterior: 'CONFIRMADA', estadoNuevo: 'EN_ESTADIA', responsable: 'Recepción de prueba', fechaHora: r.checkInEn, motivo: null });
    if (r.checkOutEn) detail.historial.push({ estadoAnterior: 'EN_ESTADIA', estadoNuevo: 'FINALIZADA', responsable: 'Recepción de prueba', fechaHora: r.checkOutEn, motivo: null });
    if (r.estado === 'cancelada') detail.historial.push({ estadoAnterior: 'CONFIRMADA', estadoNuevo: 'CANCELADA', responsable: 'Recepción de prueba', fechaHora: r.creadoEn, motivo: r.motivoCancelacion ?? 'Cancelación de prueba' });
    return { detail, paid, payment: detail.canal === 'DIRECTO_WEB' && paid ? 'TARJETA' : null, refunded: false, refundRejected: false, account: ['FINALIZADA', 'CANCELADA'].includes(estado) ? 'CERRADA' : 'ABIERTA' };
  });
  // Casos de demostración derivados del huésped/tipo existentes. No son cobros reales.
  for (const [code, channel, days, rejected] of [['VS-PAGO01', 'DIRECTO_WEB', 4, false], ['VS-PAGO02', 'DIRECTO_WEB', 0, false], ['VS-PAGO03', 'DIRECTO_WEB', 4, true], ['VS-CANA01', 'BOOKING', 3, false], ['VS-CANA02', 'EXPEDIA', 3, false], ['VS-HOY001', 'RECEPCION', 0, false]] as const) {
    const detail = structuredClone(entries[3].detail);
    Object.assign(detail, { codigo: code, canal: channel, entrada: fechaRelativaISO(days), salida: fechaRelativaISO(days + 3), saldoPendiente: channel === 'RECEPCION' ? detail.total : 0, identificadorExterno: ['BOOKING', 'EXPEDIA'].includes(channel) ? `${channel}-PRUEBA` : null });
    detail.historial = [{ estadoAnterior: null, estadoNuevo: 'CONFIRMADA', responsable: 'Datos de prueba', fechaHora: detail.creadaEn, motivo: null }];
    entries.push({ detail, paid: channel === 'RECEPCION' ? 0 : detail.total, payment: channel === 'RECEPCION' ? null : channel === 'DIRECTO_WEB' ? 'TARJETA' : 'CANAL', refunded: false, refundRejected: rejected, account: 'ABIERTA' });
  }
  const dirty = rooms.find(r => r.numero === '209'); if (dirty) dirty.condicion = 'SUCIA';
  const occupied = rooms.find(r => r.ocupacion === 'OCUPADA'); if (occupied) occupied.incidenciaPendiente = true;
  return { version: 1, rooms, entries, audit: [] };
}
export function readReceptionState(): ReceptionState {
  try {
    const state = JSON.parse(readFileSync(path(), 'utf8')) as ReceptionState;
    if (state?.version !== 1 || !Array.isArray(state.entries) || !Array.isArray(state.rooms) || !Array.isArray(state.audit) ||
      state.entries.some(e => !e?.detail || !/^VS-[A-Z0-9]{6}$/.test(e.detail.codigo) || !validPublicDate(e.detail.entrada) || !validPublicDate(e.detail.salida) || e.detail.salida <= e.detail.entrada || !Array.isArray(e.detail.historial) || !Number.isFinite(e.paid) || e.paid < 0 || !['ABIERTA', 'CERRADA'].includes(e.account)) ||
      state.rooms.some(r => !Number.isInteger(r?.id) || !['LIBRE', 'OCUPADA'].includes(r.ocupacion) || !['LIMPIA', 'SUCIA', 'EN_LIMPIEZA', 'FUERA_DE_SERVICIO'].includes(r.condicion)) ||
      new Set(state.entries.map(e => e.detail.codigo)).size !== state.entries.length || new Set(state.rooms.map(r => r.id)).size !== state.rooms.length) throw new Error('Estado inválido');
    return state;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return receptionSeed();
    return fail('SIMULACION_NO_DISPONIBLE', 503, 'No se pudo leer el almacenamiento de prueba.');
  }
}
export function receptionTransaction<T>(action: (state: ReceptionState) => T): T {
  const file = path(), lock = `${file}.lock`, temporary = `${file}.${randomUUID()}.tmp`;
  let handle: number | undefined;
  try {
    mkdirSync(dirname(file), { recursive: true, mode: 0o700 }); handle = openSync(lock, 'wx', 0o600);
    const state = readReceptionState(), value = action(state);
    writeFileSync(temporary, JSON.stringify(state), { flag: 'wx', mode: 0o600 }); renameSync(temporary, file); return value;
  } catch (e) {
    if (e instanceof ReceptionDemoError) throw e;
    return fail('SIMULACION_NO_DISPONIBLE', 503, 'No se pudo guardar la operación de prueba. Intenta nuevamente.');
  } finally {
    if (handle !== undefined) { closeSync(handle); try { unlinkSync(lock); } catch { /* No quitar bloqueos de otro escritor. */ } }
    try { unlinkSync(temporary); } catch { /* No se escribió un temporal. */ }
  }
}
const find = (state: ReceptionState, code: string) => state.entries.find(e => e.detail.codigo === code) ?? fail('NO_ENCONTRADO', 404, 'No se encontró la reserva.');
export const receptionDetail = (code: string) => structuredClone(find(readReceptionState(), code).detail);
function cancellable(e: Entry) {
  if (isExternal(e.detail)) fail('CANAL_NO_CANCELABLE', 409, 'Las reservas de canal no se cancelan desde el sistema.');
  if (!canCancel(e.detail)) fail('ESTADO_INVALIDO', 409, 'Solo se pueden cancelar reservas confirmadas.');
}
export function cancellationPreview(entry: Entry, now = Date.now()): CancellationPreview {
  cancellable(entry);
  if (!entry.paid) return { resultado: 'SIN_PAGOS', montoReembolso: 0 };
  const arrival = Date.parse(`${entry.detail.entrada}T15:00:00-06:00`);
  const full = entry.payment === 'TARJETA' && arrival - now >= 48 * 3600000;
  return { resultado: full ? 'REEMBOLSO_TOTAL' : 'SIN_REEMBOLSO', montoReembolso: full ? entry.paid : 0 };
}
export const previewReceptionCancellation = (code: string) => cancellationPreview(find(readReceptionState(), code));
export function cancelReceptionReservation(code: string, reason: unknown, responsible: string) {
  if (typeof reason !== 'string' || !reason.trim() || reason.length > 500) fail('DATOS_INVALIDOS', 400, 'El motivo de cancelación es obligatorio y admite hasta 500 caracteres.');
  return receptionTransaction(state => {
    const entry = find(state, code), preview = cancellationPreview(entry);
    if (preview.resultado === 'REEMBOLSO_TOTAL' && entry.refundRejected) fail('REEMBOLSO_RECHAZADO', 409, 'El reembolso de prueba fue rechazado; la reserva no se canceló. No se devolvió dinero real.');
    if (preview.resultado === 'REEMBOLSO_TOTAL') { entry.refunded = true; entry.detail.saldoPendiente = entry.detail.total; }
    entry.account = 'CERRADA'; entry.detail.estado = 'CANCELADA'; entry.detail.habitacion = null;
    entry.detail.historial.push({ estadoAnterior: 'CONFIRMADA', estadoNuevo: 'CANCELADA', responsable: responsible, fechaHora: new Date().toISOString(), motivo: (reason as string).trim() });
    return structuredClone(entry.detail);
  });
}
function positive(value: string | null, fallback?: number) {
  if (value === null && fallback !== undefined) return fallback;
  const n = Number(value); if (!Number.isInteger(n) || n < 1) fail('DATOS_INVALIDOS', 400, 'Indica un número entero positivo.'); return n;
}
function choice(value: string | null, allowed: string[]) { if (value !== null && !allowed.includes(value)) fail('DATOS_INVALIDOS', 400, 'El filtro indicado no es válido.'); }
export function searchReceptionReservations(query: URLSearchParams): ReservationPage {
  const page = query.has('page') ? Number(query.get('page')) : 0, size = positive(query.get('size'), 20);
  if (!Number.isInteger(page) || page < 0 || size > 100) fail('DATOS_INVALIDOS', 400, 'Revisa la página y el tamaño de la búsqueda.');
  const from = query.get('desde'), to = query.get('hasta'), code = query.get('codigo');
  if ((from !== null && !validPublicDate(from)) || (to !== null && !validPublicDate(to)) || (from && to && to < from) || (code !== null && !/^VS-[A-Z0-9]{6}$/.test(code))) fail('DATOS_INVALIDOS', 400, 'Revisa el rango de fechas y el código de reserva.');
  choice(query.get('estado'), ['PENDIENTE_PAGO', 'CONFIRMADA', 'EN_ESTADIA', 'FINALIZADA', 'CANCELADA']); choice(query.get('canal'), ['DIRECTO_WEB', 'RECEPCION', 'BOOKING', 'EXPEDIA']); choice(query.get('rapido'), ['LLEGAN_HOY', 'SALEN_HOY']);
  const text = (query.get('texto') ?? '').trim().toLocaleLowerCase('es'), today = fechaHotel();
  const matching = readReceptionState().entries.map(e => e.detail).filter(r => (!text || `${r.huesped.nombreCompleto} ${r.huesped.numeroDocumento}`.toLocaleLowerCase('es').includes(text)) && (!code || r.codigo === code) && (!from || r.salida > from) && (!to || r.entrada <= to) && (!query.has('estado') || r.estado === query.get('estado')) && (!query.has('canal') || r.canal === query.get('canal')) && (!query.has('rapido') || (query.get('rapido') === 'LLEGAN_HOY' ? r.estado === 'CONFIRMADA' && r.entrada === today : r.estado === 'EN_ESTADIA' && r.salida === today))).sort((a, b) => a.entrada.localeCompare(b.entrada) || a.codigo.localeCompare(b.codigo));
  const contenido: ReservationSummary[] = matching.slice(page * size, (page + 1) * size).map(r => ({ codigo: r.codigo, huespedPrincipal: { id: r.huesped.id, nombreCompleto: r.huesped.nombreCompleto }, entrada: r.entrada, salida: r.salida, noches: r.noches, numeroHuespedes: r.numeroHuespedes, tipoHabitacion: r.tipoHabitacion, habitacion: r.habitacion, estado: r.estado, canal: r.canal, identificadorExterno: r.identificadorExterno, total: r.total, saldoPendiente: r.saldoPendiente }));
  return { contenido, page, size, totalElementos: matching.length, totalPaginas: Math.ceil(matching.length / size) };
}
export function receptionRooms(query = new URLSearchParams()): RoomState[] {
  choice(query.get('ocupacion'), ['LIBRE', 'OCUPADA']); choice(query.get('condicion'), ['LIMPIA', 'SUCIA', 'EN_LIMPIEZA', 'FUERA_DE_SERVICIO']);
  const type = query.has('tipoHabitacionId') ? positive(query.get('tipoHabitacionId')) : null;
  const floor = query.has('piso') ? positive(query.get('piso')) : null, state = readReceptionState(), today = fechaHotel();
  return state.rooms.filter(r => (!query.has('ocupacion') || r.ocupacion === query.get('ocupacion')) && (!query.has('condicion') || r.condicion === query.get('condicion')) && (!type || r.tipoHabitacion.id === type) && (!floor || r.piso === floor)).map(r => ({ ...r,
    llegaHoy: state.entries.some(e => e.detail.habitacion?.id === r.id && e.detail.estado === 'CONFIRMADA' && e.detail.entrada === today),
    saleHoy: state.entries.some(e => e.detail.habitacion?.id === r.id && e.detail.estado === 'EN_ESTADIA' && e.detail.salida === today) }));
}
function assignable(state: ReceptionState, type: number, arrival: string, departure: string, exclude?: string): RoomState[] {
  return state.rooms.filter(r => r.tipoHabitacion.id === type && r.condicion !== 'FUERA_DE_SERVICIO' && !state.entries.some(e => e.detail.codigo !== exclude && active(e.detail) && e.detail.habitacion?.id === r.id && e.detail.entrada < departure && e.detail.salida > arrival));
}
export function availableReceptionRooms(query: URLSearchParams): RoomReference[] {
  const type = positive(query.get('tipoHabitacionId')), arrival = query.get('entrada') ?? '', departure = query.get('salida') ?? '';
  if (!validPublicDate(arrival) || !validPublicDate(departure) || departure <= arrival || (Date.parse(departure) - Date.parse(arrival)) / 86400000 > 30) fail('DATOS_INVALIDOS', 400, 'Revisa las fechas de asignación.');
  return assignable(readReceptionState(), type, arrival, departure).map(reference);
}
export function assignReceptionRoom(code: string, id: unknown, responsible: string) {
  if (!Number.isInteger(id) || Number(id) < 1) fail('DATOS_INVALIDOS', 400, 'Selecciona una habitación válida.');
  return receptionTransaction(state => {
    const entry = find(state, code), d = entry.detail;
    if (!canAssign(d)) fail('ESTADO_INVALIDO', 409, 'Solo se puede asignar antes del check-in, en pendiente de pago o confirmada.');
    const room = assignable(state, d.tipoHabitacion.id, d.entrada, d.salida, code).find(r => r.id === id);
    if (!room) fail('HABITACION_NO_DISPONIBLE', 409, 'La habitación no corresponde al tipo, está fuera de servicio o tiene una reserva que se traslapa.');
    d.habitacion = reference(room); state.audit.push({ action: 'ASIGNAR_HABITACION', code, at: new Date().toISOString(), responsible });
    return structuredClone(d);
  });
}
export function markReceptionRoomDirty(id: number, responsible: string) {
  return receptionTransaction(state => {
    const room = state.rooms.find(r => r.id === id) ?? fail('NO_ENCONTRADO', 404, 'No se encontró la habitación.');
    if (!canMarkDirty(room)) fail('ESTADO_INVALIDO', 409, 'Solo se puede marcar sucia una habitación libre y limpia.');
    room.condicion = 'SUCIA'; state.audit.push({ action: 'MARCAR_SUCIA', code: String(id), at: new Date().toISOString(), responsible });
    return { ...room, llegaHoy: state.entries.some(e => e.detail.habitacion?.id === id && e.detail.estado === 'CONFIRMADA' && e.detail.entrada === fechaHotel()), saleHoy: false };
  });
}
