import { describe, test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NextRequest } from 'next/server';
import { authRoute } from '../../src/lib/bff/auth/http';
import { receptionRoute } from '../../src/lib/bff/receptionHttp';
import { receptionSeed, readReceptionState, receptionDetail, receptionCalendar, receptionAvailability, createReceptionReservation, registerReceptionGuest, searchReceptionReservations } from '../../src/lib/bff/receptionDemo';
import { calendarWithBff } from '../../src/features/recepcion/receptionCalendarLink';
import { RESERVAS_INICIALES, HUESPEDES_INICIALES, fechaRelativaISO } from '../../src/data/pms';

describe('Issue 25: creación y lecturas comparten el BFF de prueba', () => {
  const folder = mkdtempSync(join(tmpdir(), 'vs-issue25-')), file = join(folder, 'reception.json');
  const previous = process.env.VILLA_SERENA_RECEPTION_DEMO_PATH;
  beforeEach(() => { process.env.VILLA_SERENA_RECEPTION_DEMO_PATH = file; writeFileSync(file, JSON.stringify(receptionSeed())); });
  after(() => { if (previous === undefined) delete process.env.VILLA_SERENA_RECEPTION_DEMO_PATH; else process.env.VILLA_SERENA_RECEPTION_DEMO_PATH = previous; rmSync(folder, { recursive: true, force: true }); });
  const guest = { nombreCompleto: 'Prueba Recepción', correo: 'issue25@example.test', telefono: '+502 55551234', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', numeroDocumento: '1234567890123' };
  const input = () => ({ huespedId: 1, tipoHabitacionId: 1, entrada: fechaRelativaISO(40), salida: fechaRelativaISO(42), numeroHuespedes: 2, habitacionId: null as number | null });

  test('registro por correo reutiliza el mismo perfil sin modificarlo y mantiene el archivo anterior', () => {
    const seed = readReceptionState().entries;
    const first = registerReceptionGuest(guest), second = registerReceptionGuest({ ...guest, nombreCompleto: 'No cambiar' });
    assert.equal(first.yaExistia, false); assert.equal(second.yaExistia, true); assert.deepEqual(first.huesped, second.huesped);
    assert.deepEqual(readReceptionState().entries, seed);
  });

  test('con y sin habitación: búsqueda, calendario, detalle e historial persisten sin recrear reservas', () => {
    const original = readReceptionState(), rooms = original.rooms.filter(r => r.tipoHabitacion.id === 1 && r.condicion !== 'FUERA_DE_SERVICIO');
    const g = registerReceptionGuest(guest).huesped;
    for (const habitacionId of [rooms[0].id, null]) {
      const created = createReceptionReservation({ ...input(), huespedId: g.id, habitacionId }, 'Recepción de prueba');
      assert.match(created.codigo, /^VS-[A-Z0-9]{6}$/); assert.equal(created.estado, 'CONFIRMADA'); assert.equal(created.canal, 'RECEPCION');
      assert.equal(created.saldoPendiente, created.total); assert.equal(created.habitacion?.id ?? null, habitacionId);
      assert.equal(created.historial[0].responsable, 'Recepción de prueba');
      assert.deepEqual(receptionDetail(created.codigo), created);
      assert.equal(searchReceptionReservations(new URLSearchParams({ texto: guest.nombreCompleto, codigo: created.codigo })).totalElementos, 1);
      const calendar = receptionCalendar(new URLSearchParams({ desde: created.entrada, hasta: created.salida }));
      assert.equal(calendar.reservas.filter(r => r.codigo === created.codigo).length, 1);
      assert.equal(calendar.reservas.find(r => r.codigo === created.codigo)!.habitacionId, habitacionId);
    }
    for (let i = 0; i < 3; i++) searchReceptionReservations(new URLSearchParams());
    assert.equal(readReceptionState().entries.length, original.entries.length + 2);
    assert.deepEqual(readReceptionState().entries.slice(0, original.entries.length), original.entries);
  });

  test('disponibilidad se revalida y las reservas sin asignación consumen inventario', () => {
    const data = input(), query = new URLSearchParams({ entrada: data.entrada, salida: data.salida, huespedes: '2' });
    const available = receptionAvailability(query).find(r => r.tipoHabitacion.id === 1)!;
    for (let i = 0; i < available.habitacionesDisponibles; i++) createReceptionReservation(data, 'Prueba');
    const saved = readFileSync(file, 'utf8');
    assert.throws(() => createReceptionReservation(data, 'Prueba'), { codigo: 'SIN_DISPONIBILIDAD', status: 409 });
    assert.equal(readFileSync(file, 'utf8'), saved);
    assert.equal(receptionAvailability(query).some(r => r.tipoHabitacion.id === 1), false);
  });

  test('no acepta traslapes, habitación de otro tipo, capacidad ni campos fuera del contrato', () => {
    const data = input(), state = readReceptionState(), room = state.rooms.find(r => r.tipoHabitacion.id === 1 && r.condicion !== 'FUERA_DE_SERVICIO')!;
    createReceptionReservation({ ...data, habitacionId: room.id }, 'Prueba');
    for (const bad of [{ ...data, habitacionId: room.id }, { ...data, habitacionId: state.rooms.find(r => r.tipoHabitacion.id !== 1)!.id }])
      assert.throws(() => createReceptionReservation(bad, 'Prueba'), { codigo: 'HABITACION_NO_DISPONIBLE', status: 409 });
    for (const bad of [{ ...data, numeroHuespedes: 6 }, { ...data, entrada: '2026-02-30' }, { ...data, estado: 'CONFIRMADA' }])
      assert.throws(() => createReceptionReservation(bad, 'Prueba'), { codigo: 'DATOS_INVALIDOS', status: 400 });
  });

  test('mezcla del calendario conserva registros locales y no dibuja dos copias de las fixtures', () => {
    const snapshot = JSON.stringify(RESERVAS_INICIALES);
    const legacy = { ...RESERVAS_INICIALES[0], id: 'anterior-local', codigo: 'VS-2026-09999' };
    const data = receptionCalendar(new URLSearchParams({ desde: fechaRelativaISO(-100), hasta: fechaRelativaISO(100) }));
    const merged = calendarWithBff(data, [...RESERVAS_INICIALES, legacy], HUESPEDES_INICIALES);
    assert.ok(merged.reservas.some(r => r.codigo === legacy.codigo));
    assert.equal(merged.reservas.filter(r => r.codigo === 'VS-TEST01').length, 1);
    assert.equal(JSON.stringify(RESERVAS_INICIALES), snapshot);
  });

  test('BFF devuelve 201, protege rol y Origin y rechaza modo conectado sin usar demo', async () => {
    const request = (path: string, method = 'GET', cookie = '', body?: unknown, origin = 'http://localhost:3025') => new NextRequest(`http://localhost:3025/api/${path}`, { method, headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    const login = async (correo: string) => {
      const response = await authRoute(request('auth/login', 'POST', '', { correo, contrasena: 'VillaSerena26' }), 'login');
      assert.equal(response.status, 200, 'La prueba de permisos requiere una sesión válida');
      return response.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    };
    const send = (path: string, method = 'GET', cookie = '', body?: unknown, origin?: string) => receptionRoute(request(path, method, cookie, body, origin), path === 'huespedes' ? 'huespedes' : 'reservas');
    const cookie = await login('recepcion@villaserena.gt');
    assert.equal((await send('reservas', 'POST', '', input())).status, 401);
    assert.equal((await send('reservas', 'POST', await login('admin@villaserena.gt'), input())).status, 403);
    for (const path of ['reservas', 'huespedes']) assert.equal((await send(path, 'POST', cookie, path === 'reservas' ? input() : guest, 'https://ajeno.test')).status, 403);
    const registered = await send('huespedes', 'POST', cookie, guest); assert.equal(registered.status, 201);
    assert.equal((await send('huespedes', 'POST', cookie, guest)).status, 200);
    const created = await send('reservas', 'POST', cookie, input()); assert.equal(created.status, 201);
    assert.equal(created.headers.get('X-Villa-Serena-Mode'), 'demo'); const detail = await created.json();
    assert.deepEqual(await (await send(`reservas/${detail.codigo}`, 'GET', cookie)).json(), detail);
    assert.equal((await send(`reservas/calendario?desde=${detail.entrada}&hasta=${detail.salida}`, 'GET', cookie)).status, 200);
    const mode = process.env.VILLA_SERENA_BFF_MODE;
    try { process.env.VILLA_SERENA_BFF_MODE = 'spring'; assert.equal((await send('reservas', 'POST', cookie, input())).status, 503); }
    finally { if (mode === undefined) delete process.env.VILLA_SERENA_BFF_MODE; else process.env.VILLA_SERENA_BFF_MODE = mode; }
  });
});
