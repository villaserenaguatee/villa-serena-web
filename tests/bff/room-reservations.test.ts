import assert from 'node:assert/strict';
import { test } from 'node:test';
import { findRoomReservations } from '@/features/recepcion/roomReservations';
import { receptionSeed } from '@/lib/bff/receptionDemo';
import type { ReservationSummary } from '@/lib/bff/contracts/reception';

const entry = receptionSeed().entries[0].detail;
const reservation: ReservationSummary = { ...entry, huespedPrincipal: { id: entry.huesped.id, nombreCompleto: entry.huesped.nombreCompleto } };

test('localiza por ID de habitación en todas las páginas y estados activos, sin elegir entre varias', async () => {
  const queries: string[] = [];
  const result = await findRoomReservations(1, undefined, async query => {
    queries.push(query.toString());
    const estado = query.get('estado') as ReservationSummary['estado'];
    const page = Number(query.get('page'));
    const contenido = page === 0 ? [{ ...reservation, habitacion: { id: 2, numero: '101', piso: 1 }, estado }] : [
      { ...reservation, codigo: `VS-${estado === 'EN_ESTADIA' ? 'TEST01' : estado === 'CONFIRMADA' ? 'TEST02' : 'TEST03'}`, estado },
    ];
    return { contenido, page, size: 100, totalElementos: 2, totalPaginas: 2 };
  });
  assert.equal(queries.length, 6);
  assert.deepEqual(result.map(r => r.codigo), ['VS-TEST01', 'VS-TEST02', 'VS-TEST03']);
  assert.ok(queries.every(q => new URLSearchParams(q).get('size') === '100'));
});

test('ignora reservas sin habitación, de otra habitación, canceladas o finalizadas', async () => {
  const result = await findRoomReservations(1, undefined, async () => ({
    contenido: [{ ...reservation, habitacion: null }, { ...reservation, estado: 'FINALIZADA' }, { ...reservation, estado: 'CANCELADA' }],
    page: 0, size: 100, totalElementos: 3, totalPaginas: 1,
  }));
  assert.deepEqual(result, []);
});

test('fallo de búsqueda no se presenta como habitación sin reserva; transmite cancelación', async () => {
  const controller = new AbortController();
  await assert.rejects(findRoomReservations(1, controller.signal, async (_query, signal) => {
    assert.equal(signal, controller.signal); throw new Error('No se pudo consultar el BFF');
  }), /No se pudo consultar/);
});
