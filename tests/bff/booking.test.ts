import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { HABITACIONES_CENTRALES } from '@/data/pms';
import { TARIFAS_PREDETERMINADAS } from '@/store/tarifasStore';
import { parseBooking, createBooking } from '@/lib/bff/publicBooking';
import { readBookingState } from '@/lib/bff/demoBookingStore';
import { POST } from '@/app/api/public/bookings/route';
import { GET } from '@/app/api/public/bookings/[code]/route';
import { POST as availability } from '@/app/api/public/availability/route';
import { copyBookingToLocal, confirmarReservaPublica, recoverBookingCopy } from '@/lib/publicBooking';
import { readBookingDraft, saveBookingDraft, updateDraftEmail } from '@/lib/bookingDraft';
import { leerReservas, upsertReserva } from '@/store/reservationStore';
import { leerHuespedes } from '@/store/guestStore';
import type { BookingInput } from '@/lib/bff/contracts/booking';

const arrival = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
const departure = new Date(Date.now() + 92 * 86400000).toISOString().slice(0, 10);
let directory: string;
const originalMode = process.env.VILLA_SERENA_BFF_MODE, originalPath = process.env.VILLA_SERENA_BFF_STATE_PATH;
beforeEach(() => { directory = mkdtempSync(join(tmpdir(), 'vs-booking-test-')); process.env.VILLA_SERENA_BFF_STATE_PATH = join(directory, 'bookings.json'); process.env.VILLA_SERENA_BFF_MODE = 'demo'; });
afterEach(() => { rmSync(directory, { recursive: true, force: true });
  if (originalPath === undefined) delete process.env.VILLA_SERENA_BFF_STATE_PATH; else process.env.VILLA_SERENA_BFF_STATE_PATH = originalPath;
  if (originalMode === undefined) delete process.env.VILLA_SERENA_BFF_MODE; else process.env.VILLA_SERENA_BFF_MODE = originalMode;
});
function input(): BookingInput {
  const room = HABITACIONES_CENTRALES.find(r => r.tipo === 'Standard' && r.piso === 1)!;
  return { requestId: randomUUID(), slug: 'habitacion-estandar', roomId: room.id, arrival, departure, adults: 1, children: 0,
    paymentMethod: 'hotel', promoCode: '', expectedTotal: 840,
    guest: { name: 'Test Guest', email: 'test@example.test', phone: '+502 55555555', nationality: 'Guatemala', document: '1234567890123', documentType: 'DPI' },
    demo: { rooms: [{ ...room, estado: 'disponible' }], holds: [], rates: { ...TARIFAS_PREDETERMINADAS }, promotions: [] } };
}
function request(body: unknown, headers = {}) { return new Request('http://localhost:3000/api/public/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) }); }
async function lookup(code: string) { return GET(new Request(`http://localhost:3000/api/public/bookings/${code}`), { params: Promise.resolve({ code }) }); }

test('valid hotel booking persists guest, reservation and attempt atomically without payments', async () => {
  const value = input(), before = structuredClone(value), response = await POST(request(value));
  assert.equal(response.status, 201); assert.equal(response.headers.get('cache-control'), 'no-store');
  const created = await response.json();
  assert.match(created.result.code, /^RES-[A-F0-9]{32}$/);
  assert.equal(created.result.paymentStatus, 'unpaid'); assert.equal(created.result.total, 840);
  assert.deepEqual(created.compatibility.reservation.pagos, []);
  assert.equal(created.compatibility.guest.correo, value.guest.email);
  assert.deepEqual(value, before); assert.equal(readBookingState().entries.length, 1);
  assert.equal(readBookingState().entries[0].compatibility.reservation.codigo, created.result.code);
});
test('public result contains only minimum status, no PII, room dates or private object', async () => {
  const created = createBooking(parseBooking(input()));
  const response = await lookup(created.result.code), body = await response.json();
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(Object.keys(body).sort(), ['code', 'mode', 'paymentMethod', 'paymentStatus', 'status', 'total']);
  assert.ok(!JSON.stringify(body).includes('test@example')); assert.ok(!JSON.stringify(body).includes('1234567890123'));
  assert.equal((await lookup('RES-00000000000000000000000000000000')).status, 404);
  assert.equal((await lookup('bad')).status, 404);
});
test('invalid guest, dates, occupancy, payment method and demo prices do not persist', async () => {
  for (const value of [{ ...input(), guest: { ...input().guest, email: 'invalid' } }, { ...input(), guest: { ...input().guest, name: '' } },
    { ...input(), arrival: '2027-02-30' }, { ...input(), arrival: '2020-01-01' }, { ...input(), children: -1 },
    { ...input(), adults: 1.5 }, { ...input(), paymentMethod: 'cash' }, { ...input(), expectedTotal: null },
    { ...input(), demo: { ...input().demo, rates: { ...TARIFAS_PREDETERMINADAS, Standard: -1 } } }]) {
    assert.equal((await POST(request(value))).status, 400);
  }
  assert.equal(readBookingState().entries.length, 0);
});
test('offer and physical capacity and floor are revalidated on creation', async () => {
  for (const value of [{ ...input(), adults: 3 }, { ...input(), slug: 'unknown' }, { ...input(), roomId: 'unknown' },
    { ...input(), demo: { ...input().demo, rooms: input().demo.rooms.map(r => ({ ...r, piso: 3 })) } }]) {
    assert.equal((await POST(request(value))).status, 409);
  }
  assert.equal(readBookingState().entries.length, 0);
});
test('price changed and invalid or expired promo return explicit errors without orphan guests', async () => {
  const changed = input(); changed.demo.rates.Standard = 500;
  assert.equal((await POST(request(changed))).status, 409);
  assert.equal((await (await POST(request({ ...input(), promoCode: 'UNKNOWN' }))).json()).error.code, 'INVALID_PROMO');
  const promo = input(); promo.promoCode = 'TEST'; promo.expectedTotal = 756;
  promo.demo.promotions = [{ id: 'p1', nombre: 'Test', codigo: 'TEST', descuentoPct: 10, desde: '2020-01-01', hasta: '2099-01-01', activa: true }];
  const created = createBooking(parseBooking(promo)); assert.equal(created.result.total, 756); assert.equal(created.compatibility.reservation.descuento, 84);
  assert.equal(readBookingState().entries.length, 1);
});
test('double sends return same persisted booking; changed request parameters conflict', async () => {
  const value = input();
  const responses = await Promise.all(Array.from({ length: 6 }, () => POST(request(value))));
  const codes = await Promise.all(responses.map(async r => { assert.equal(r.status, 201); return (await r.json()).result.code; }));
  assert.equal(new Set(codes).size, 1); assert.equal(readBookingState().entries.length, 1);
  assert.equal((await POST(request({ ...value, guest: { ...value.guest, email: 'other@example.test' } }))).status, 409);
  const retry = structuredClone(value); retry.demo.rates.Standard = 999;
  assert.equal(createBooking(parseBooking(retry)).result.code, codes[0]);
});
test('parallel attempts cannot oversell and availability reflects server holds despite stale browser snapshot', async () => {
  const first = input(), second = { ...first, requestId: randomUUID() };
  const results = await Promise.all([POST(request(first)), POST(request(second))]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  assert.equal(readBookingState().entries.length, 1);
  const response = await availability(new Request('http://localhost:3000/api/public/availability', { method: 'POST', body: JSON.stringify(first) }));
  assert.deepEqual((await response.json()).rooms, []);
  const state = readBookingState(), r = state.entries[0].compatibility.reservation;
  const stale = input(); stale.demo.holds = [{ code: r.codigo, roomId: r.habitacionId, roomType: r.tipoHabitacion, arrival, departure, status: 'cancelada' }];
  assert.equal((await POST(request(stale))).status, 409);
});
test('real concurrent Node processes sharing a file do not oversell', async () => {
  const run = (value: BookingInput) => new Promise<number>((resolve, reject) => {
    const childEnv: NodeJS.ProcessEnv = { ...process.env, TEST_BOOKING: JSON.stringify(value) };
    delete childEnv.NODE_TEST_CONTEXT;
    const outputFile = join(directory, `result-${value.requestId}`);
    const child = spawn(process.execPath, ['--import', './tests/bff/register.mjs', 'tests/bff/fixtures/create-booking.mjs', outputFile],
      { cwd: process.cwd(), env: childEnv });
    let errors = ''; child.stderr.on('data', v => errors += v);
    child.on('error', reject); child.on('close', code => {
      if (code) { reject(new Error(errors)); return; }
      try { resolve(Number(readFileSync(outputFile, 'utf8'))); } catch (error) { reject(error); }
    });
  });
  const statuses = await Promise.all([run(input()), run(input()), run(input())]);
  assert.equal(statuses.filter(s => s === 201).length, 1, JSON.stringify(statuses)); assert.ok(statuses.every(s => [201, 409, 503].includes(s)));
  assert.equal(readBookingState().entries.length, 1);
});
test('busy lock, corrupt file and failed atomic write fail closed; retry after repair creates one', async () => {
  const file = process.env.VILLA_SERENA_BFF_STATE_PATH!;
  writeFileSync(`${file}.lock`, ''); assert.equal((await POST(request(input()))).status, 503); assert.equal(readBookingState().entries.length, 0);
  rmSync(`${file}.lock`);
  writeFileSync(file, '{'); const corrupt = await POST(request(input())); assert.equal(corrupt.status, 503); assert.equal(readFileSync(file, 'utf8'), '{'); rmSync(file);
  // A directory in place of the destination makes rename fail after writing the temporary.
  const { mkdirSync, readdirSync } = await import('node:fs'); mkdirSync(file);
  const value = input(); assert.equal((await POST(request(value))).status, 503); assert.deepEqual(readdirSync(directory), ['bookings.json']);
  rmSync(file, { recursive: true }); assert.equal((await POST(request(value))).status, 201); assert.equal(readBookingState().entries.length, 1);
});
test('card, bank and API mode never create fake paid reservations or silently fall back', async () => {
  for (const paymentMethod of ['card', 'bank']) assert.equal((await POST(request({ ...input(), paymentMethod }))).status, 503);
  process.env.VILLA_SERENA_BFF_MODE = 'api'; assert.equal((await POST(request(input()))).status, 503); assert.equal((await lookup('RES-00000000000000000000000000000000')).status, 503);
  assert.equal(readBookingState().entries.length, 0);
});
test('creation rejects cross-site, malformed JSON and oversized stream without echoing secrets', async () => {
  assert.equal((await POST(request(input(), { Origin: 'https://attacker.test' }))).status, 403);
  assert.equal((await POST(new Request('http://localhost:3000/api/public/bookings', { method: 'POST', body: '{' }))).status, 400);
  assert.equal((await POST(request({ secret: 'x'.repeat(2 * 1024 * 1024) }))).status, 413);
  const value = input(); Object.assign(value.guest, { cvv: 'SECRET', cardNumber: 'SECRET' });
  const created = createBooking(parseBooking(value)); assert.ok(!JSON.stringify(created).includes('SECRET')); assert.ok(!readFileSync(process.env.VILLA_SERENA_BFF_STATE_PATH!, 'utf8').includes('SECRET'));
});
function browser() {
  const storage = new Map<string, string>(), session = new Map<string, string>();
  const make = (map: Map<string, string>) => ({ getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => map.set(key, value), removeItem: (key: string) => map.delete(key) });
  const originals = { window: globalThis.window, localStorage: globalThis.localStorage, sessionStorage: globalThis.sessionStorage, fetch: globalThis.fetch };
  Object.assign(globalThis, { window: new EventTarget(), localStorage: make(storage), sessionStorage: make(session) });
  return { storage, session, restore() { Object.assign(globalThis, originals); } };
}
test('draft keeps PII out of URL, supports email edits and expires explicitly', () => {
  const b = browser(); try {
    const query = saveBookingDraft(new URLSearchParams({ nombre: 'SECRET-NAME', correo: 'secret@example.test', documento: 'SECRET-DOCUMENT', llegada: arrival }));
    assert.ok(!query.toString().includes('SECRET')); assert.ok(!query.toString().includes('correo'));
    const id = query.get('draft')!; assert.ok(readBookingDraft(id)); updateDraftEmail(id, 'changed@example.test');
    assert.equal(new URLSearchParams(readBookingDraft(id)!.params).get('correo'), 'changed@example.test');
    const data = JSON.parse(b.session.get('vs-public-booking-draft')!); data.createdAt = Date.now() - 3 * 60 * 60 * 1000;
    b.session.set('vs-public-booking-draft', JSON.stringify(data)); assert.equal(readBookingDraft(id), null);
  } finally { b.restore(); }
});
test('compatibility preserves local collections, existing guest profile and subsequent portal updates', () => {
  const b = browser(); try {
    const created = createBooking(parseBooking(input()));
    const existingGuest = { ...created.compatibility.guest, id: 'local-guest', nombre: 'Existing profile', foto: 'keep-photo' };
    b.storage.set('vs-huespedes', JSON.stringify([existingGuest])); b.storage.set('vs-reservas', '[]');
    const unrelated = { ...created.compatibility.reservation, id: 'existing-reservation', codigo: 'EXISTING' };
    b.storage.set('vs-reservas', JSON.stringify([unrelated]));
    const copied = copyBookingToLocal(created); assert.equal(copied.huespedId, 'local-guest'); assert.equal(leerReservas().length, 2);
    assert.deepEqual(leerHuespedes(), [existingGuest]);
    upsertReserva({ ...copied, estado: 'en-curso', servicios: [{ id: 's', tipo: 'Test', descripcion: 'Keep', cantidad: 1, precioUnitario: 10, fecha: arrival }] });
    copyBookingToLocal(created); assert.equal(leerReservas().find(r => r.id === copied.id)?.estado, 'en-curso');
    assert.equal(leerReservas().find(r => r.id === copied.id)?.servicios.length, 1);
  } finally { b.restore(); }
});
test('lost response retry and failed local copy recover original booking without a second server reservation', async () => {
  const b = browser(); try {
    const value = input(), params = new URLSearchParams({ slug: value.slug, habitacionId: value.roomId, llegada: arrival, salida: departure,
      adultos: '1', ninos: '0', total: '840', nombre: 'Test', apellidos: 'Guest', correo: value.guest.email, telefono: value.guest.phone,
      nacionalidad: value.guest.nationality, documento: value.guest.document, tipoDocumento: 'DPI' });
    const query = saveBookingDraft(params), id = query.get('draft')!;
    b.storage.set('vs-habitaciones', JSON.stringify(value.demo.rooms)); b.storage.set('vs-reservas', '[]'); b.storage.set('vs-huespedes', '[]');
    let lost = true;
    globalThis.fetch = async (_url, init) => { const response = await POST(request(JSON.parse(String(init?.body)))); if (lost) { lost = false; throw new Error('lost response'); } return response; };
    await assert.rejects(confirmarReservaPublica(params, '', 'hotel', id));
    assert.equal(readBookingState().entries.length, 1); assert.equal(leerReservas().length, 0);
    const created = await confirmarReservaPublica(params, '', 'hotel', id); assert.equal(readBookingState().entries.length, 1);
    const savedSet = localStorage.setItem; localStorage.setItem = () => { throw new Error('quota'); };
    assert.throws(() => copyBookingToLocal(created)); assert.equal(readBookingState().entries.length, 1);
    localStorage.setItem = savedSet;
    const recovered = await recoverBookingCopy(id, created.result.code); assert.equal(recovered.codigo, created.result.code);
    assert.equal(leerReservas().length, 1); assert.equal(readBookingState().entries.length, 1);
  } finally { b.restore(); }
});

test('recovery refuses a missing or different booking instead of creating inventory or guests', async () => {
  const value = input(), unknownCode = 'RES-00000000000000000000000000000000';
  assert.equal((await POST(request({ ...value, recoveryCode: unknownCode }))).status, 404);
  assert.equal(readBookingState().entries.length, 0);
  const created = createBooking(parseBooking(value));
  assert.equal((await POST(request({ ...value, recoveryCode: unknownCode }))).status, 404);
  const recovered = await POST(request({ ...value, recoveryCode: created.result.code }));
  assert.equal(recovered.status, 201); assert.equal((await recovered.json()).result.code, created.result.code);
  assert.equal(readBookingState().entries.length, 1);
});
function guestParams(value = input()) {
  return new URLSearchParams({ slug: value.slug, habitacionId: value.roomId, llegada: value.arrival, salida: value.departure,
    adultos: String(value.adults), ninos: String(value.children), total: String(value.expectedTotal), nombre: 'Test', apellidos: 'Guest',
    correo: value.guest.email, telefono: value.guest.phone, nacionalidad: value.guest.nationality, documento: value.guest.document, tipoDocumento: 'DPI' });
}
test('lost response followed by changed dates or price stays bound to original attempt', async () => {
  const b = browser(); try {
    const params = guestParams(), id = saveBookingDraft(params).get('draft')!;
    b.storage.set('vs-habitaciones', JSON.stringify(input().demo.rooms)); b.storage.set('vs-reservas', '[]'); b.storage.set('vs-huespedes', '[]');
    let lost = true, posts = 0;
    globalThis.fetch = async (_url, init) => { posts++; const response = await POST(request(JSON.parse(String(init?.body)))); if (lost) { lost = false; throw Error('lost'); } return response; };
    await assert.rejects(confirmarReservaPublica(params, '', 'hotel', id));
    const originalAttempt = readBookingDraft(id)!.attempt!;
    const changed = new URLSearchParams(params); changed.set('salida', new Date(Date.parse(departure) + 86400000).toISOString().slice(0, 10)); changed.set('total', '1260');
    await assert.rejects(confirmarReservaPublica(changed, '', 'hotel', id));
    assert.equal(posts, 1); assert.deepEqual(readBookingDraft(id)!.attempt, originalAttempt);
    assert.throws(() => updateDraftEmail(id, 'changed@example.test'));
    assert.throws(() => saveBookingDraft(changed, id));
    assert.equal(saveBookingDraft(params, id).get('draft'), id);
    const { retryBookingAttempt } = await import('@/lib/publicBooking');
    const recovered = await retryBookingAttempt(id);
    assert.equal(recovered.compatibility.reservation.fechaSalida, departure); assert.equal(recovered.result.total, 840);
    assert.equal(readBookingState().entries.length, 1); assert.equal(readBookingDraft(id)!.attempt!.code, recovered.result.code);
  } finally { b.restore(); }
});
test('explicit server rejection allows correcting data without losing an unresolved attempt', async () => {
  const b = browser(); try {
    const params = guestParams(); params.set('total', '1'); const id = saveBookingDraft(params).get('draft')!;
    b.storage.set('vs-habitaciones', JSON.stringify(input().demo.rooms)); b.storage.set('vs-reservas', '[]');
    globalThis.fetch = async (_url, init) => POST(request(JSON.parse(String(init?.body))));
    await assert.rejects(confirmarReservaPublica(params, '', 'hotel', id));
    assert.equal(readBookingDraft(id)!.attempt, undefined); assert.equal(readBookingState().entries.length, 0);
    params.set('total', '840'); const created = await confirmarReservaPublica(params, '', 'hotel', id);
    assert.equal(created.result.total, 840); assert.equal(readBookingState().entries.length, 1);
  } finally { b.restore(); }
});
test('known-result recovery reuses captured guest and never creates when server state is absent', async () => {
  const b = browser(); try {
    const params = guestParams(), id = saveBookingDraft(params).get('draft')!;
    b.storage.set('vs-habitaciones', JSON.stringify(input().demo.rooms)); b.storage.set('vs-reservas', '[]'); b.storage.set('vs-huespedes', '[]');
    globalThis.fetch = async (_url, init) => POST(request(JSON.parse(String(init?.body))));
    const created = await confirmarReservaPublica(params, '', 'hotel', id);
    const draft = JSON.parse(b.session.get('vs-public-booking-draft')!); const changed = new URLSearchParams(draft.params); changed.set('correo', 'changed@example.test'); draft.params = changed.toString();
    b.session.set('vs-public-booking-draft', JSON.stringify(draft));
    const recovered = await recoverBookingCopy(id, created.result.code);
    assert.equal(recovered.codigo, created.result.code); assert.equal(leerHuespedes()[0].correo, 'test@example.test'); assert.equal(readBookingState().entries.length, 1);
    rmSync(process.env.VILLA_SERENA_BFF_STATE_PATH!);
    await assert.rejects(recoverBookingCopy(id, created.result.code)); assert.equal(readBookingState().entries.length, 0);
  } finally { b.restore(); }
});
test('replaying a local copy repairs missing guest while preserving reservation actions', () => {
  const b = browser(); try {
    const created = createBooking(parseBooking(input()));
    const existing = { ...created.compatibility.reservation, huespedId: 'local-guest', estado: 'cancelada' as const, motivoCancelacion: 'Keep reason' };
    b.storage.set('vs-reservas', JSON.stringify([existing])); b.storage.set('vs-huespedes', '[]');
    assert.deepEqual(copyBookingToLocal(created), existing);
    assert.equal(leerHuespedes()[0].id, 'local-guest'); assert.deepEqual(leerReservas(), [existing]);
  } finally { b.restore(); }
});

test('existing booking replays after its arrival date while a new past stay is rejected', async () => {
  const { fechaHotel } = await import('@/lib/hotel');
  const value = input(); value.arrival = fechaHotel(); value.departure = new Date(Date.parse(value.arrival) + 2 * 86400000).toISOString().slice(0, 10);
  const created = createBooking(parseBooking(value));
  const OriginalDate = Date;
  class Tomorrow extends OriginalDate { constructor(value?: string | number) { super(value ?? OriginalDate.now() + 2 * 86400000); } }
  globalThis.Date = Tomorrow as DateConstructor;
  try {
    assert.equal((await (await POST(request({ ...value, recoveryCode: created.result.code }))).json()).result.code, created.result.code);
    assert.equal((await (await POST(request(value))).json()).result.code, created.result.code);
    assert.equal((await POST(request({ ...value, requestId: randomUUID() }))).status, 400);
    assert.equal(readBookingState().entries.length, 1);
  } finally { globalThis.Date = OriginalDate; }
});

test('malformed persisted records fail closed for status, availability and creation without rewriting state', async () => {
  const value = input(), created = createBooking(parseBooking(value)), original = readBookingState();
  const mutations: ((state: ReturnType<typeof readBookingState>) => void)[] = [
    state => { delete (state.entries[0].compatibility.reservation as Partial<typeof created.compatibility.reservation>).fechaSalida; },
    state => { state.entries[0].compatibility.reservation.huespedId = 'wrong-guest'; },
    state => { state.entries[0].result.total = 1; },
    state => { (state.entries[0].result as unknown as Record<string, unknown>).status = { email: 'PRIVATE-STATE' }; },
    state => { state.entries.push(structuredClone(state.entries[0])); },
  ];
  for (const mutate of mutations) {
    const state = structuredClone(original); mutate(state); const raw = JSON.stringify(state);
    writeFileSync(process.env.VILLA_SERENA_BFF_STATE_PATH!, raw);
    const response = await lookup(created.result.code); assert.equal(response.status, 503); assert.ok(!(await response.text()).includes('PRIVATE-STATE'));
    assert.equal((await availability(new Request('http://localhost:3000/api/public/availability', { method: 'POST', body: JSON.stringify(value) }))).status, 503);
    assert.equal((await POST(request({ ...value, requestId: randomUUID() }))).status, 503);
    assert.equal(readFileSync(process.env.VILLA_SERENA_BFF_STATE_PATH!, 'utf8'), raw);
  }
});
