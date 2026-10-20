import test from 'node:test';
import assert from 'node:assert/strict';
import { AvailabilityError, parseAvailability, queryAvailability } from '@/lib/bff/publicAvailability';
import { POST } from '@/app/api/public/availability/route';
import { getPublicAvailability } from '@/lib/api/availability';
import { availableRoom } from '@/lib/publicAvailability';
import { HABITACIONES_CENTRALES, RESERVAS_INICIALES } from '@/data/pms';
import { publicRooms } from '@/data/publicRooms';
import type { TipoHabitacion } from '@/lib/pms/types';

const arrival = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10);
const departure = new Date(Date.now() + 92 * 86400000).toISOString().slice(0, 10);
function input() { return { arrival, departure, adults: 1, children: 0, demo: {
  rooms: structuredClone(HABITACIONES_CENTRALES), holds: RESERVAS_INICIALES.map(r => ({ code: r.codigo, roomId: r.habitacionId,
    roomType: r.tipoHabitacion, arrival: r.fechaEntrada, departure: r.fechaSalida, status: r.estado })),
} }; }
function request(body: unknown, headers = {}) { return new Request('http://localhost:3000/api/public/availability', {
  method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body),
}); }
function hold(code: string, roomId: string | null, roomType: TipoHabitacion = 'Standard') {
  return { code, roomId, roomType, arrival, departure, status: 'confirmada' as const };
}
test('availability keeps demo seeds, room configuration and all 15 public offers untouched', () => {
  const snapshot = input(), before = structuredClone(snapshot);
  const result = queryAvailability(parseAvailability(snapshot));
  assert.ok(result.rooms.length > 0);
  assert.deepEqual(snapshot, before);
  assert.equal(publicRooms.length, 15);
  assert.equal(result.rooms[0].precioNoche, snapshot.demo.rooms.find(r => r.id === result.rooms[0].id)?.precioNoche);
});
test('availability excludes assigned overlapping holds and out-of-service rooms', () => {
  const snapshot = input(), room = snapshot.demo.rooms[0];
  snapshot.demo.holds.push(hold('TEST', room.id, room.tipo));
  const result = queryAvailability(parseAvailability(snapshot));
  assert.ok(!result.rooms.some(r => r.id === room.id));
  assert.ok(result.rooms.every(r => r.estado !== 'mantenimiento'));
});
test('cancelled and adjacent stays do not hold a room', () => {
  const snapshot = input(), room = snapshot.demo.rooms[0];
  snapshot.demo.holds = [{ ...hold('CANCELLED', room.id, room.tipo), status: 'cancelada' },
    { ...hold('ADJACENT', room.id, room.tipo), arrival: '2020-01-01', departure: arrival }];
  assert.ok(queryAvailability(parseAvailability(snapshot)).rooms.some(r => r.id === room.id));
});
test('unassigned reservations consume type inventory without duplicate simultaneous capacity', () => {
  const snapshot = input();
  snapshot.demo.rooms = snapshot.demo.rooms.filter(r => r.tipo === 'Standard').slice(0, 2).map(r => ({ ...r, estado: 'disponible' }));
  snapshot.demo.holds = [hold('U1', null), hold('U2', null)];
  assert.deepEqual(queryAvailability(parseAvailability(snapshot)).rooms, []);
  snapshot.demo.holds.pop();
  assert.equal(queryAvailability(parseAvailability(snapshot)).rooms.length, 1);
});
test('non-overlapping unassigned holds count peak demand rather than sum', () => {
  const snapshot = input();
  const middle = new Date(Date.parse(arrival) + 86400000).toISOString().slice(0, 10);
  snapshot.demo.rooms = snapshot.demo.rooms.filter(r => r.tipo === 'Standard').slice(0, 2).map(r => ({ ...r, estado: 'disponible' }));
  snapshot.demo.holds = [{ ...hold('U1', null), departure: middle }, { ...hold('U2', null), arrival: middle }];
  assert.equal(queryAvailability(parseAvailability(snapshot)).rooms.length, 1);
});
test('invalid dates, occupancy, duplicates and malformed snapshots are explicit 400s', async () => {
  for (const value of [{ ...input(), arrival: '2027-02-30' }, { ...input(), children: -1 },
    { ...input(), arrival: '2020-01-01' }, { ...input(), demo: { rooms: 'bad', holds: [] } },
    { ...input(), demo: { rooms: [input().demo.rooms[0], input().demo.rooms[0]], holds: [] } }]) {
    assert.equal((await POST(request(value))).status, 400);
  }
});
test('handler returns no-store and strips guest/payment extras instead of exposing snapshot PII', async () => {
  const snapshot = input();
  Object.assign(snapshot.demo.rooms[0], { guestDocument: 'SECRET-DOCUMENT', cvv: 'SECRET-CVV' });
  const response = await POST(request(snapshot));
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  const body = await response.text();
  assert.ok(!body.includes('SECRET'));
  assert.ok(!body.includes('holds'));
});
test('handler rejects cross-origin, malformed JSON and actual oversized streams', async () => {
  assert.equal((await POST(request(input(), { Origin: 'https://attacker.test' }))).status, 403);
  assert.equal((await POST(new Request('http://localhost:3000/api/public/availability', { method: 'POST', body: '{' }))).status, 400);
  assert.equal((await POST(request({ extra: 'x'.repeat(2 * 1024 * 1024) }))).status, 413);
});
test('API mode stays explicit and cannot silently fall back to browser demo', () => {
  const previous = process.env.VILLA_SERENA_BFF_MODE;
  try {
    process.env.VILLA_SERENA_BFF_MODE = 'api';
    assert.throws(() => queryAvailability(parseAvailability(input())), (error: unknown) => error instanceof AvailabilityError && error.code === 'API_NOT_READY');
    process.env.VILLA_SERENA_BFF_MODE = 'typo';
    assert.throws(() => queryAvailability(parseAvailability(input())), (error: unknown) => error instanceof AvailabilityError && error.code === 'BFF_MODE_INVALID');
  } finally { if (previous === undefined) delete process.env.VILLA_SERENA_BFF_MODE; else process.env.VILLA_SERENA_BFF_MODE = previous; }
});
test('browser calls only the BFF and surfaces failures and mismatched responses', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async (url, init) => {
      assert.equal(url, '/api/public/availability');
      assert.equal(init?.method, 'POST');
      return POST(request(JSON.parse(String(init?.body))));
    };
    assert.ok((await getPublicAvailability(input())).rooms.length > 0);
    globalThis.fetch = async () => new Response('{}', { status: 503 });
    await assert.rejects(getPublicAvailability(input()));
    globalThis.fetch = async () => Response.json({ mode: 'demo', rooms: [], query: { ...input(), adults: 9 } });
    await assert.rejects(getPublicAvailability(input()));
  } finally { globalThis.fetch = previous; }
});
test('public selection never permits stale or failed BFF inventory', () => {
  const offer = publicRooms[0], response = queryAvailability(parseAvailability(input()));
  const inventory = { habitaciones: response.rooms, reservas: [], query: response.query };
  assert.equal(availableRoom(offer, arrival, departure, 1, { ...inventory, error: true }), undefined);
  assert.equal(availableRoom(offer, arrival, departure, 1, { ...inventory, query: { ...response.query, departure: arrival } }), undefined);
});
