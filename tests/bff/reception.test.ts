import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReceptionApi, ReceptionApiError } from '../../src/lib/bff/receptionApi';
import { calendarDays, moveCalendar, visibleReservations } from '../../src/features/recepcion/pages/CalendarioReservas';
import type { Reserva } from '../../src/lib/pms/types';

test('calendario: semanas, meses, año bisiesto y salida exclusiva', () => {
  assert.equal(calendarDays('2028-02-15', 'month').length, 29);
  assert.equal(calendarDays('2026-10-07', 'week')[0], '2026-10-05');
  assert.equal(moveCalendar('2026-01-31', 'month', 1), '2026-02-01');
  assert.equal(moveCalendar('2026-12-31', 'month', 1), '2027-01-01');
  assert.equal(moveCalendar('2026-10-07', 'week', -1), '2026-09-30');
  const days = calendarDays('2026-10-07', 'week');
  const base = { fechaEntrada: '2026-10-01', fechaSalida: '2026-10-06', estado: 'confirmada' } as Reserva;
  assert.equal(visibleReservations([base, { ...base, estado: 'cancelada' }, { ...base, fechaSalida: '2026-10-05' }], days).length, 1);
});
test('API de recepción: usa el contrato, token solo en servidor y check-in sin cuerpo', async () => {
  const requests: { url: string; init: RequestInit }[] = [];
  const request = (async (url, init) => {
    requests.push({ url: String(url), init: init! });
    return Response.json({ codigo: 'VS-TEST', estado: 'EN_ESTADIA' });
  }) as typeof fetch;
  const api = createReceptionApi('http://localhost:8080', 'test-token', request);
  await api.calendar('2026-10-01', '2026-10-31');
  const reservation = { huespedId: 1, tipoHabitacionId: 2, entrada: '2026-10-05', salida: '2026-10-07', numeroHuespedes: 2, habitacionId: null };
  await api.createReservation(reservation);
  const checkedIn = await api.checkIn('VS-TEST');
  assert.equal(checkedIn.estado, 'EN_ESTADIA');
  assert.equal(requests[0].url, 'http://localhost:8080/api/v1/reservas/calendario?desde=2026-10-01&hasta=2026-10-31');
  assert.deepEqual(JSON.parse(requests[1].init.body as string), reservation);
  assert.equal(requests[2].init.body, undefined);
  assert.equal(requests[2].init.method, 'POST');
  assert.equal((requests[2].init.headers as Record<string, string>).Authorization, 'Bearer test-token');
  assert.equal(requests[2].init.cache, 'no-store');
  assert.equal(requests[2].init.redirect, 'error');
});
test('API de recepción: rechazo por habitación sucia sin fallback ni repetición', async () => {
  let count = 0;
  const request = (async () => { count++; return Response.json({ codigo: 'HABITACION_NO_LISTA', mensaje: 'La habitación 103 no está libre y limpia.' }, { status: 409 }); }) as typeof fetch;
  await assert.rejects(createReceptionApi('http://localhost:8080', 'test-token', request).checkIn('VS-TEST'),
    (e: unknown) => e instanceof ReceptionApiError && e.status === 409 && e.message.includes('libre y limpia'));
  assert.equal(count, 1);
});
test('API de recepción: fallos de red y sesión incompleta no se convierten en éxito', async () => {
  let count = 0;
  const request = (async () => { count++; throw new Error('test-token'); }) as typeof fetch;
  assert.throws(() => createReceptionApi('http://localhost:8080', '', request), /sesión/);
  await assert.rejects(createReceptionApi('http://localhost:8080', 'test-token', request).checkIn('VS-TEST'),
    (e: unknown) => e instanceof ReceptionApiError && e.code === 'API_UNAVAILABLE' && !e.message.includes('test-token'));
  assert.equal(count, 1);
});
