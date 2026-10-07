import { describe, test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { authRoute } from '../../src/lib/bff/auth/http';
import { receptionRoute } from '../../src/lib/bff/receptionHttp';
import { receptionSeed, readReceptionState, receptionDetail, cancellationPreview, cancelReceptionReservation, assignReceptionRoom, markReceptionRoomDirty, searchReceptionReservations, receptionRooms, availableReceptionRooms } from '../../src/lib/bff/receptionDemo';
import { fechaHotel } from '../../src/lib/hotel';

describe('Issue 8: operaciones de recepción con datos de prueba', () => {
  const folder = mkdtempSync(join(tmpdir(), 'vs-issue8-'));
  const file = join(folder, 'reservas.json');
  const previous = process.env.VILLA_SERENA_RECEPTION_DEMO_PATH;
  beforeEach(() => { process.env.VILLA_SERENA_RECEPTION_DEMO_PATH = file; writeFileSync(file, JSON.stringify(receptionSeed())); });
  after(() => { if (previous === undefined) delete process.env.VILLA_SERENA_RECEPTION_DEMO_PATH; else process.env.VILLA_SERENA_RECEPTION_DEMO_PATH = previous; rmSync(folder, { recursive: true, force: true }); });
  const query = (q = '') => new URLSearchParams(q);
  const reject = (fn: () => unknown, codigo: string, status = 409) => assert.throws(fn, { codigo, status });

  test('filtros combinados, documento, código exacto, paginación y fechas con salida exclusiva', () => {
    const seed = receptionSeed(), r = seed.entries[3].detail;
    assert.equal(searchReceptionReservations(query(`texto=${encodeURIComponent(r.huesped.numeroDocumento)}&codigo=${r.codigo}&estado=CONFIRMADA&canal=RECEPCION`)).totalElementos, 1);
    assert.equal(searchReceptionReservations(query('codigo=VS-TEST01')).contenido[0].codigo, 'VS-TEST01');
    const page = searchReceptionReservations(query('size=2&page=1'));
    assert.equal(page.contenido.length, 2); assert.equal(page.totalElementos, seed.entries.length); assert.equal(page.page, 1);
    assert.equal(searchReceptionReservations(query(`codigo=${r.codigo}&desde=${r.salida}`)).totalElementos, 0);
    assert.equal(searchReceptionReservations(query(`codigo=${r.codigo}&hasta=${r.entrada}`)).totalElementos, 1);
    assert.ok(searchReceptionReservations(query('rapido=LLEGAN_HOY')).contenido.every(r => r.estado === 'CONFIRMADA' && r.entrada === fechaHotel()));
    assert.ok(searchReceptionReservations(query('rapido=SALEN_HOY')).contenido.every(r => r.estado === 'EN_ESTADIA' && r.salida === fechaHotel()));
    assert.equal(searchReceptionReservations(query('rapido=LLEGAN_HOY&estado=EN_ESTADIA')).totalElementos, 0);
    for (const invalid of ['codigo=VS-TEST', 'desde=2026-02-30', 'desde=2026-11-01&hasta=2026-10-01', 'estado=NO_SHOW', 'canal=OTRO', 'page=-1', 'size=101', 'rapido=OTRO']) reject(() => searchReceptionReservations(query(invalid)), 'DATOS_INVALIDOS', 400);
  });

  test('detalle devuelve historial, huéspedes y canal con identificador externo', () => {
    const d = receptionDetail('VS-CANA01');
    assert.equal(d.canal, 'BOOKING'); assert.equal(d.identificadorExterno, 'BOOKING-PRUEBA');
    assert.ok(d.historial.every(h => h.fechaHora && h.responsable && h.estadoNuevo));
    assert.ok(d.huesped.numeroDocumento); assert.ok(Array.isArray(d.huespedesAdicionales));
    assert.equal(receptionDetail('VS-TEST06').historial.at(-1)?.estadoNuevo, 'FINALIZADA');
    reject(() => receptionDetail('VS-NOEXIS'), 'NO_ENCONTRADO', 404);
  });

  test('reembolso: tres resultados y frontera exacta de 48 horas a las 15:00 Guatemala', () => {
    const state = readReceptionState();
    const paid = state.entries.find(e => e.detail.codigo === 'VS-PAGO01')!;
    const arrival = Date.parse(`${paid.detail.entrada}T15:00:00-06:00`);
    assert.equal(cancellationPreview(paid, arrival - 48 * 3600000).resultado, 'REEMBOLSO_TOTAL');
    assert.equal(cancellationPreview(paid, arrival - 48 * 3600000 + 1).resultado, 'SIN_REEMBOLSO');
    assert.equal(cancellationPreview(paid).montoReembolso, paid.paid);
    assert.equal(cancellationPreview(state.entries.find(e => e.detail.codigo === 'VS-PAGO02')!).resultado, 'SIN_REEMBOLSO');
    assert.equal(cancellationPreview(state.entries[3]).resultado, 'SIN_PAGOS');
  });

  test('cancelación cierra cuenta, libera asignación y registra motivo/responsable sin duplicar reembolso', () => {
    const d = receptionDetail('VS-PAGO01');
    const room = availableReceptionRooms(query(`tipoHabitacionId=${d.tipoHabitacion.id}&entrada=${d.entrada}&salida=${d.salida}`))[0];
    assignReceptionRoom(d.codigo, room.id, 'Recepción de prueba');
    const result = cancelReceptionReservation(d.codigo, '  Solicitud de prueba  ', 'Recepción de prueba');
    assert.equal(result.estado, 'CANCELADA'); assert.equal(result.habitacion, null);
    assert.equal(result.historial.at(-1)?.motivo, 'Solicitud de prueba'); assert.equal(result.historial.at(-1)?.responsable, 'Recepción de prueba');
    const entry = readReceptionState().entries.find(e => e.detail.codigo === d.codigo)!;
    assert.equal(entry.account, 'CERRADA'); assert.equal(entry.refunded, true);
    assert.ok(availableReceptionRooms(query(`tipoHabitacionId=${d.tipoHabitacion.id}&entrada=${d.entrada}&salida=${d.salida}`)).some(h => h.id === room.id));
    const saved = readFileSync(file, 'utf8');
    reject(() => cancelReceptionReservation(d.codigo, 'Repetición', 'Prueba'), 'ESTADO_INVALIDO');
    assert.equal(readFileSync(file, 'utf8'), saved);
  });

  test('canal, estados no cancelables, motivo inválido y rechazo de reembolso no modifican datos', () => {
    const saved = readFileSync(file, 'utf8');
    for (const code of ['VS-CANA01', 'VS-CANA02']) reject(() => cancelReceptionReservation(code, 'Prueba', 'Prueba'), 'CANAL_NO_CANCELABLE');
    for (const code of ['VS-TEST01', 'VS-TEST05', 'VS-TEST06', 'VS-TEST08']) reject(() => cancelReceptionReservation(code, 'Prueba', 'Prueba'), 'ESTADO_INVALIDO');
    for (const reason of ['', '  ', 'x'.repeat(501), null]) reject(() => cancelReceptionReservation('VS-PAGO01', reason, 'Prueba'), 'DATOS_INVALIDOS', 400);
    reject(() => cancelReceptionReservation('VS-PAGO03', 'Prueba', 'Prueba'), 'REEMBOLSO_RECHAZADO');
    assert.equal(readFileSync(file, 'utf8'), saved);
    assert.equal(cancelReceptionReservation('VS-TEST04', 'x'.repeat(500), 'Prueba').estado, 'CANCELADA');
    assert.equal(readReceptionState().entries[3].refunded, false);
  });

  test('asignación admite pendiente/confirmada y sucia; rechaza tipo, mantenimiento, traslapes y estadía', () => {
    const state = readReceptionState(), pending = receptionDetail('VS-TEST05');
    const dirty = state.rooms.find(r => r.tipoHabitacion.id === pending.tipoHabitacion.id && r.ocupacion === 'LIBRE' && r.condicion === 'LIMPIA')!;
    dirty.condicion = 'SUCIA'; writeFileSync(file, JSON.stringify(state));
    assert.equal(dirty.tipoHabitacion.id, pending.tipoHabitacion.id);
    assert.equal(assignReceptionRoom(pending.codigo, dirty.id, 'Prueba').estado, 'PENDIENTE_PAGO');
    reject(() => assignReceptionRoom('VS-HOY001', dirty.id, 'Prueba'), 'HABITACION_NO_DISPONIBLE');
    assert.equal(assignReceptionRoom(pending.codigo, dirty.id, 'Prueba').habitacion?.id, dirty.id);
    for (const room of state.rooms.filter(r => r.tipoHabitacion.id !== pending.tipoHabitacion.id || r.condicion === 'FUERA_DE_SERVICIO')) reject(() => assignReceptionRoom(pending.codigo, room.id, 'Prueba'), 'HABITACION_NO_DISPONIBLE');
    for (const code of ['VS-TEST01', 'VS-TEST06', 'VS-TEST08']) reject(() => assignReceptionRoom(code, dirty.id, 'Prueba'), 'ESTADO_INVALIDO');
    assert.equal(receptionDetail(pending.codigo).historial.length, pending.historial.length);
    assert.ok(readReceptionState().audit.some(a => a.action === 'ASIGNAR_HABITACION' && a.responsible === 'Prueba'));
  });

  test('habitaciones: cuatro filtros, indicadores e incidencias; marcar sucia solo libre y limpia', () => {
    const list = receptionRooms(), room = list.find(r => r.numero === '102')!;
    assert.ok(receptionRooms(query(`ocupacion=LIBRE&condicion=LIMPIA&tipoHabitacionId=${room.tipoHabitacion.id}&piso=${room.piso}`)).some(r => r.id === room.id));
    assert.ok(list.some(r => r.saleHoy)); assert.ok(list.some(r => r.incidenciaPendiente)); assert.ok(list.some(r => r.incidenciaBloqueante));
    for (const r of list.filter(r => r.ocupacion !== 'LIBRE' || r.condicion !== 'LIMPIA')) reject(() => markReceptionRoomDirty(r.id, 'Prueba'), 'ESTADO_INVALIDO');
    const result = markReceptionRoomDirty(room.id, 'Prueba'); assert.equal(result.condicion, 'SUCIA'); assert.equal(result.ocupacion, 'LIBRE');
    reject(() => markReceptionRoomDirty(room.id, 'Prueba'), 'ESTADO_INVALIDO');
    assert.ok(readReceptionState().audit.some(a => a.action === 'MARCAR_SUCIA'));
    reject(() => receptionRooms(query('ocupacion=RESERVADA')), 'DATOS_INVALIDOS', 400);
  });

  test('almacenamiento corrupto y bloqueo ocupado fallan sin sobrescribir', () => {
    writeFileSync(file, '{'); reject(() => receptionDetail('VS-TEST01'), 'SIMULACION_NO_DISPONIBLE', 503); assert.equal(readFileSync(file, 'utf8'), '{');
    writeFileSync(file, JSON.stringify(receptionSeed())); writeFileSync(`${file}.lock`, 'otro escritor');
    reject(() => cancelReceptionReservation('VS-PAGO01', 'Prueba', 'Prueba'), 'SIMULACION_NO_DISPONIBLE', 503);
    assert.equal(readFileSync(`${file}.lock`, 'utf8'), 'otro escritor'); rmSync(`${file}.lock`);
  });

  test('BFF: sesión y rol, Origin, cuerpos del contrato y separación del modo real', async () => {
    const request = (path: string, method = 'GET', cookie = '', body?: unknown, origin = 'http://localhost:3008') => new NextRequest(`http://localhost:3008/api/${path}`, { method, headers: { Cookie: cookie, Origin: origin, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const login = async (correo: string) => {
      const response = await authRoute(request('auth/login', 'POST', '', { correo, contrasena: 'demo123' }), 'login');
      assert.equal(response.status, 200); return response.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    };
    const send = (path: string, method = 'GET', cookie = '', body?: unknown, origin?: string) => receptionRoute(request(path, method, cookie, body, origin), path.startsWith('reservas') ? 'reservas' : 'habitaciones');
    assert.equal((await send('reservas')).status, 401);
    const admin = await login('admin@villaserena.gt'); assert.equal((await send('reservas', 'GET', admin)).status, 403);
    const temporary = await login('temporal@villaserena.gt'); assert.equal((await send('habitaciones', 'GET', temporary)).status, 403);
    const cookie = await login('recepcion@villaserena.gt');
    const result = await send('reservas', 'GET', cookie); assert.equal(result.status, 200); assert.equal(result.headers.get('X-Villa-Serena-Mode'), 'demo'); assert.equal(result.headers.get('Cache-Control'), 'no-store');
    assert.equal(JSON.stringify(await result.json()).includes('accessToken'), false);
    for (const [path, method, body] of [['reservas/VS-TEST04/cancelar', 'POST', { motivo: 'Prueba' }], ['reservas/VS-TEST04/habitacion', 'PUT', { habitacionId: 1 }], ['habitaciones/2/marcar-sucia', 'POST', undefined]] as const) assert.equal((await send(path, method, cookie, body, 'https://ajeno.example')).status, 403);
    assert.equal((await send('reservas/VS-CANA01/cancelar', 'POST', cookie, { motivo: 'Prueba' })).status, 409);
    assert.equal((await send('reservas/VS-TEST04/cancelar', 'POST', cookie, { motivo: 'Prueba', estado: 'CANCELADA' })).status, 400);
    assert.equal((await send('habitaciones/2/marcar-sucia', 'POST', cookie, { condicion: 'LIMPIA' })).status, 400);
    assert.equal((await send('habitaciones/2/marcar-limpia', 'POST', cookie)).status, 404);
    const mode = process.env.VILLA_SERENA_BFF_MODE;
    try { process.env.VILLA_SERENA_BFF_MODE = 'spring'; assert.equal((await send('reservas', 'GET', cookie)).status, 503); }
    finally { if (mode === undefined) delete process.env.VILLA_SERENA_BFF_MODE; else process.env.VILLA_SERENA_BFF_MODE = mode; }
  });
});
