import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { GET, POST } from '@/app/api/publico/[...ruta]/route';
import { demoCatalog, demoCreate, demoQuotes, parseContractBooking } from '@/lib/bff/publicContract';
import { contractHolds, readPublicContractState } from '@/lib/bff/publicContractStore';
import { publicSearchError } from '@/lib/publicStayValidation';
import { HABITACIONES_CENTRALES, HUESPEDES_INICIALES } from '@/data/pms';
import { queryAvailability } from '@/lib/bff/publicAvailability';
import type { CreatePublicDto } from '@/lib/bff/contracts/public';
import { prepareStripeBooking } from '@/lib/publicStripeBooking';
import { bookingAttempt, readBookingDraft, saveBookingDraft } from '@/lib/bookingDraft';

describe('BFF público según contrato, exclusivamente con datos de prueba', () => {
const arrival = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
const departure = new Date(Date.parse(arrival) + 2 * 86400000).toISOString().slice(0, 10);
const original = { mode: process.env.VILLA_SERENA_BFF_MODE, legacy: process.env.VILLA_SERENA_BFF_STATE_PATH, contract: process.env.VILLA_SERENA_PUBLIC_CONTRACT_PATH };
let directory: string;
beforeEach(() => {
  directory = mkdtempSync(join(tmpdir(), 'vs-public-contract-'));
  process.env.VILLA_SERENA_BFF_MODE = 'demo';
  process.env.VILLA_SERENA_BFF_STATE_PATH = join(directory, 'hotel.json');
  process.env.VILLA_SERENA_PUBLIC_CONTRACT_PATH = join(directory, 'stripe.json');
});
afterEach(() => {
  rmSync(directory, { recursive: true, force: true });
  for (const [key, value] of Object.entries({ VILLA_SERENA_BFF_MODE: original.mode, VILLA_SERENA_BFF_STATE_PATH: original.legacy, VILLA_SERENA_PUBLIC_CONTRACT_PATH: original.contract })) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
function input(): CreatePublicDto { return { tipoHabitacionId: 1, entrada: arrival, salida: departure, numeroHuespedes: 2,
  huesped: { nombreCompleto: 'Huésped Prueba', correo: 'public@example.test', telefono: '+502 55555555', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', numeroDocumento: '1234567890123' } }; }
const get = (route: string) => GET(new Request(`http://localhost:3005/api/publico/${route}`));
const post = (route: string, body?: unknown, attempt = randomUUID(), origin: string | null = 'http://localhost:3005') => POST(new Request(`http://localhost:3005/api/publico/${route}`, {
  method: 'POST', headers: { ...(origin ? { Origin: origin } : {}), 'Content-Type': 'application/json', 'Idempotency-Key': attempt }, ...(body === undefined ? {} : { body: JSON.stringify(body) }),
}));

test('public catalog, hotel and availability use contract fields and server prices', async () => {
  const hotel = await get('hotel'); assert.equal(hotel.status, 200); assert.equal((await hotel.json()).horaCheckIn, '15:00');
  const catalog = await get('tipos-habitacion'), types = await catalog.json();
  assert.equal(catalog.headers.get('X-Villa-Serena-Mode'), 'demo'); assert.equal(types.length, 5);
  assert.deepEqual(Object.keys(types[0]).sort(), ['capacidad', 'descripcion', 'fotos', 'id', 'nombre', 'precioBaseNoche']);
  assert.deepEqual(await (await get('tipos-habitacion/1')).json(), types[0]); assert.equal((await get('tipos-habitacion/999')).status, 404);
  const quotes = await (await get(`disponibilidad?entrada=${arrival}&salida=${departure}&numeroHuespedes=2`)).json();
  assert.equal(quotes[0].total, 840); assert.equal(quotes[0].noches, 2);
  assert.equal(quotes[0].desglose.reduce((sum: number, n: { precio: number }) => sum + n.precio, 0), quotes[0].total);
  assert.ok(!JSON.stringify(quotes).includes('hh-')); assert.ok(!JSON.stringify(quotes).includes('numeroDisponible'));
});
test('invalid dates and counts have a reason and never create a reservation', async () => {
  const today = '2026-10-06';
  for (const [a, b, adults, children] of [['2026-10-05', '2026-10-07', 1, 0], ['2026-02-30', '2026-03-02', 1, 0],
    ['2026-10-07', '2026-10-07', 1, 0], ['2026-10-08', '2026-10-07', 1, 0], ['2026-10-07', '2026-11-07', 1, 0],
    ['2027-10-07', '2027-10-08', 1, 0], ['2026-10-07', '2026-10-08', 0, 0], ['2026-10-07', '2026-10-08', 1.5, 0],
    ['2026-10-07', '2026-10-08', 1, -1], ['2026-10-07', '2026-10-08', 4, 2]] as const) {
    assert.ok(publicSearchError(a, b, adults, children, 5, today));
  }
  assert.equal(publicSearchError('2026-10-06', '2026-11-05', 1, 0, 5, today), null);
  for (const bad of [{ ...input(), numeroHuespedes: 0 }, { ...input(), entrada: '2020-01-01' }, { ...input(), salida: arrival },
    { ...input(), huesped: { ...input().huesped, nombreCompleto: '  ' } }, { ...input(), huesped: { ...input().huesped, telefono: '1'.repeat(31) } },
    { ...input(), huesped: null }, { ...input(), tipoHabitacionId: 99 }]) {
    const response = await post('reservas', bad); assert.ok([400, 409].includes(response.status));
    const error = await response.json(); assert.ok(error.mensaje); assert.deepEqual(error.detalles, []);
  }
  assert.equal(readPublicContractState().entries.length, 0);
});
test('creation and payment are repeatable tests; return and repeated status never approve or expose PII', async () => {
  const attempt = randomUUID(), first = await post('reservas', input(), attempt), created = await first.json();
  assert.equal(first.status, 201); assert.equal(created.estado, 'PENDIENTE_PAGO'); assert.equal(created.total, 840);
  assert.match(created.codigo, /^VS-[A-Z0-9]{6}$/);
  assert.equal((await (await post('reservas', input(), attempt)).json()).codigo, created.codigo);
  assert.equal((await post('reservas', { ...input(), numeroHuespedes: 1 }, attempt)).status, 409);
  assert.equal((await (await get(`reservas/${created.codigo}/estado`)).json()).estadoPago, null);
  const payment = await (await post(`reservas/${created.codigo}/pago`)).json();
  assert.equal(new URL(payment.urlPago).origin, 'http://localhost:3005'); assert.equal(new URL(payment.urlPago).searchParams.get('prueba'), '1');
  assert.equal(new URL(payment.urlPago).pathname, '/reserva/resultado'); assert.equal(new URL(payment.urlPago).searchParams.get('codigo'), created.codigo);
  assert.deepEqual(await (await post(`reservas/${created.codigo}/pago`)).json(), payment);
  for (let i = 0; i < 3; i++) {
    const response = await get(`reservas/${created.codigo}/estado`), state = await response.json();
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.deepEqual(state, { codigo: created.codigo, estadoReserva: 'PENDIENTE_PAGO', estadoPago: 'PENDIENTE', puedeReintentar: true });
    assert.ok(!JSON.stringify(state).includes('public@example')); assert.ok(!JSON.stringify(state).includes('1234567890123'));
  }
  assert.equal(readPublicContractState().entries.length, 1);
});
test('pending contract bookings consume shared inventory and expiry releases it without approving payment', async () => {
  const count = HABITACIONES_CENTRALES.filter(r => r.tipo === 'Standard' && r.estado !== 'mantenimiento').length;
  const codes = Array.from({ length: count }, () => demoCreate(parseContractBooking(input()), randomUUID()).codigo);
  assert.ok(!demoQuotes(arrival, departure, 2).some(q => q.tipoHabitacion.id === 1));
  assert.throws(() => demoCreate(parseContractBooking(input()), randomUUID()), /SIN_DISPONIBILIDAD/);
  assert.equal(queryAvailability({ arrival, departure, adults: 2, children: 0, demo: { rooms: HABITACIONES_CENTRALES.filter(r => r.tipo === 'Standard'), holds: contractHolds() } }).rooms.length, 0);
  const state = readPublicContractState(); state.entries[0].created.pagoVenceEn = new Date(Date.now() - 1000).toISOString();
  writeFileSync(process.env.VILLA_SERENA_PUBLIC_CONTRACT_PATH!, JSON.stringify(state));
  assert.ok(demoQuotes(arrival, departure, 2).some(q => q.tipoHabitacion.id === 1));
  assert.deepEqual(await (await get(`reservas/${codes[0]}/estado`)).json(), { codigo: codes[0], estadoReserva: 'CANCELADA', estadoPago: 'FALLIDO', puedeReintentar: false });
  assert.equal((await post(`reservas/${codes[0]}/pago`)).status, 409);
});
test('existing guest email reuses its profile without replacing guest details', () => {
  const existing = HUESPEDES_INICIALES[0], before = structuredClone(existing);
  demoCreate(parseContractBooking({ ...input(), huesped: { ...input().huesped, correo: existing.correo, nombreCompleto: 'No sustituir perfil' } }), randomUUID());
  const known = readPublicContractState().entries[0].guest;
  assert.equal(known.nombreCompleto, existing.nombre); assert.equal(known.numeroDocumento, existing.documento);
  demoCreate(parseContractBooking({ ...input(), huesped: { ...input().huesped, correo: existing.correo, telefono: 'Cambiar teléfono' } }), randomUUID());
  assert.deepEqual(readPublicContractState().entries[1].guest, known);
  assert.deepEqual(existing, before);
});
test('cross-site POST, missing Origin, corrupt storage and real mode fail without demo fallback', async () => {
  assert.equal((await post('reservas', input(), randomUUID(), 'https://other.example')).status, 403);
  assert.equal((await post('reservas', input(), randomUUID(), null)).status, 403);
  assert.equal((await get('reservas/unknown/estado')).status, 404);
  const file = process.env.VILLA_SERENA_PUBLIC_CONTRACT_PATH!;
  writeFileSync(file, '{broken'); const before = readFileSync(file, 'utf8');
  assert.equal((await get(`disponibilidad?entrada=${arrival}&salida=${departure}&numeroHuespedes=2`)).status, 503);
  assert.equal(readFileSync(file, 'utf8'), before);
  process.env.VILLA_SERENA_BFF_MODE = 'api';
  assert.equal((await get('hotel')).status, 503); assert.equal((await get('tipos-habitacion')).status, 503);
  assert.equal((await post('reservas', input())).status, 503);
  assert.equal(demoCatalog().length, 5);
});
test('an old hotel draft cannot recover or create a hotel booking through the card flow', async () => {
  const originalStorage = globalThis.sessionStorage, originalFetch = globalThis.fetch;
  const storage = new Map<string, string>();
  Object.assign(globalThis, { sessionStorage: { getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value) } });
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('No debe haber peticiones'); };
  try {
    const params = new URLSearchParams({ llegada: arrival, salida: departure, adultos: '2', ninos: '0' });
    const id = saveBookingDraft(params).get('draft')!;
    bookingAttempt(id, JSON.stringify({ paymentMethod: 'hotel' }));
    await assert.rejects(prepareStripeBooking(params, id, true), /no admite pago con tarjeta/);
    assert.equal(calls, 0); assert.equal(readPublicContractState().entries.length, 0);
    assert.ok(readBookingDraft(id)?.attempt);
  } finally { Object.assign(globalThis, { sessionStorage: originalStorage, fetch: originalFetch }); }
});
test('lost creation response recovers the same attempt; known code retries only payment and GET never creates', async () => {
  const originals = { window: globalThis.window, sessionStorage: globalThis.sessionStorage, fetch: globalThis.fetch };
  const storage = new Map<string, string>(), calls: { route: string; method: string }[] = [];
  Object.assign(globalThis, { window: { location: { origin: 'http://localhost:3005' } }, sessionStorage: {
    getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value),
  } });
  let loseCreation = true, losePayment = true;
  globalThis.fetch = async (path, init = {}) => {
    const route = String(path).slice('/api/publico/'.length); calls.push({ route, method: init.method || 'GET' });
    const headers = new Headers(init.headers); headers.set('Origin', 'http://localhost:3005');
    const request = new Request(`http://localhost:3005${path}`, { ...init, headers });
    const response = init.method === 'POST' ? await POST(request) : await GET(request);
    if (route === 'reservas' && loseCreation) { loseCreation = false; throw new Error('Respuesta perdida'); }
    if (route.endsWith('/pago') && losePayment) { losePayment = false; throw new Error('Respuesta perdida'); }
    return response;
  };
  try {
    const params = new URLSearchParams({ nombre: 'Huésped', apellidos: 'Prueba', correo: 'public@example.test', telefono: '+502 55555555',
      nacionalidad: 'Guatemala', documento: '1234567890123', tipoDocumento: 'DPI', tipoHabitacionId: '1', llegada: arrival, salida: departure, adultos: '2', ninos: '0' });
    const draftId = saveBookingDraft(params).get('draft')!;
    await assert.rejects(prepareStripeBooking(params, draftId), /Respuesta perdida/);
    assert.equal(readPublicContractState().entries.length, 1);
    const attempt = readBookingDraft(draftId)!.attempt!.id;
    await assert.rejects(prepareStripeBooking(params, draftId, true), /Respuesta perdida/);
    assert.equal(readBookingDraft(draftId)!.attempt!.id, attempt);
    assert.ok(readBookingDraft(draftId)!.attempt!.code);
    const creates = calls.filter(c => c.route === 'reservas').length;
    const url = await prepareStripeBooking(params, draftId, true);
    assert.equal(calls.filter(c => c.route === 'reservas').length, creates);
    const code = new URL(url, 'http://localhost:3005').searchParams.get('codigo')!;
    assert.equal(readPublicContractState().entries.length, 1);
    assert.equal((await (await get(`reservas/${code}/estado`)).json()).estadoReserva, 'PENDIENTE_PAGO');
  } finally { Object.assign(globalThis, originals); }
});
});
