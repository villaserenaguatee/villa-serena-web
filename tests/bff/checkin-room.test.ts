import assert from 'node:assert/strict';
import { test } from 'node:test';
import { requireReadyCheckInRoom } from '@/features/recepcion/checkInRoom';
import { receptionSeed } from '@/lib/bff/receptionDemo';

test('check-in consulta de nuevo la condición del BFF y acepta solo LIBRE + LIMPIA', async () => {
  const room = receptionSeed().rooms.find(r => r.numero === '102')!;
  let reads = 0;
  const load = async () => { reads++; return [room]; };
  await requireReadyCheckInRoom('102', load);
  room.condicion = 'SUCIA';
  const before = JSON.stringify(room);
  await assert.rejects(requireReadyCheckInRoom('102', load), /sucia/);
  assert.equal(JSON.stringify(room), before);
  assert.equal(reads, 2);
  for (const condition of ['EN_LIMPIEZA', 'FUERA_DE_SERVICIO'] as const) {
    room.condicion = condition;
    await assert.rejects(requireReadyCheckInRoom('102', load), /no está libre y limpia/);
  }
  room.condicion = 'LIMPIA'; room.ocupacion = 'OCUPADA';
  await assert.rejects(requireReadyCheckInRoom('102', load), /ocupada/);
});

test('check-in no continúa ante habitación ausente o error del BFF', async () => {
  await assert.rejects(requireReadyCheckInRoom('102', async () => []), /No se encontró/);
  await assert.rejects(requireReadyCheckInRoom('102', async () => { throw new Error('BFF no disponible'); }), /BFF no disponible/);
});
