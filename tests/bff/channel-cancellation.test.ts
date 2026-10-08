import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RESERVAS_INICIALES } from '../../src/data/pms';
import { needsReservationChannel, permitsLocalCancellation } from '../../src/features/recepcion/localCancellation';

test('la copia persistida mantiene el rechazo de cancelación para Booking y Expedia', () => {
  for (const canal of ['BOOKING', 'EXPEDIA'] as const) {
    const reservation = JSON.parse(JSON.stringify({ ...RESERVAS_INICIALES[3], id: 'bff-reservation-VS-CANA01', canal }));
    assert.equal(needsReservationChannel(reservation), false);
    assert.equal(permitsLocalCancellation(reservation), false);
  }
});

test('una copia antigua del BFF necesita recuperar el canal y no ofrece cancelar mientras tanto', () => {
  const reservation = { ...RESERVAS_INICIALES[3], id: 'bff-reservation-VS-CANA01' };
  assert.equal(needsReservationChannel(reservation), true);
  assert.equal(permitsLocalCancellation(reservation), false);
});

test('las reservas de Recepción y web y las locales anteriores mantienen la opción', () => {
  for (const canal of ['RECEPCION', 'DIRECTO_WEB'] as const)
    assert.equal(permitsLocalCancellation({ ...RESERVAS_INICIALES[3], id: 'bff-reservation-VS-TEST04', canal }), true);
  assert.equal(permitsLocalCancellation(RESERVAS_INICIALES[3]), true);
});
