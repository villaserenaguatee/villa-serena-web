// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { Reserva } from '@/lib/pms/types';
import { completarCheckInReserva, errorActivacionCheckInPortal, errorCheckInRecepcion, checkInWebPendiente, leerReservas, RESERVAS_EVENT } from '@/store/reservationStore';
import { leerHabitaciones } from '@/store/roomStore';
import { cuentaHuespedExpirada, guardarAccesoPostCheckout, leerAccesoPostCheckout, GUEST_ACCESS_KEY } from '@/store/guestAccountAccess';
import { loginLocal } from '@/lib/auth/local-auth';
import { seleccionarEstanciaHuesped } from '@/features/huesped/pages/HuespedApp';
import { activarCheckInConHabitacionLista, enviarCheckInPortal, rechazarCheckInPortal, reconciliarHabitacionesReservadas } from '@/store/portalCheckIn';
import { crearReservaRecepcionDemo } from '@/store/receptionReservation';
import { document, guest, room, seedPortal, stay } from '../fixtures/portal-checkin';

beforeEach(() => {
  localStorage.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-09T18:00:00Z'));
  seedPortal();
});
afterEach(() => { localStorage.clear(); vi.useRealTimers(); });
function snapshot() { return { ...localStorage }; }
function unchangedData(actual: Reserva) {
  for (const field of ['pagos', 'servicios', 'acompanantes', 'actividadPortal'] as const) expect(actual[field]).toEqual(stay[field]);
  expect(actual.checkInWeb?.documentos).toEqual(stay.checkInWeb?.documentos);
  expect(localStorage.getItem('vs-huespedes')).toBe(JSON.stringify([guest]));
}
function roomsResponse(ocupacion = 'LIBRE', condicion = 'LIMPIA') {
  return new Response(JSON.stringify([{ id: 101, numero: room.numero, ocupacion, condicion }]), {
    headers: { 'X-Villa-Serena-Mode': 'demo' },
  });
}

test('activar persiste habitación ocupada y estancia, notifica al selector y es idempotente al releer', () => {
  const listener = vi.fn(() => seleccionarEstanciaHuesped(leerReservas(), guest.id));
  window.addEventListener(RESERVAS_EVENT, listener);
  try {
    expect(errorActivacionCheckInPortal(stay.id)).toBeUndefined();
    const updated = completarCheckInReserva(stay.id, 'portal')!;
    expect(updated.estado).toBe('en-curso'); expect(updated.habitacionId).toBe(room.id);
    expect(updated.checkInWeb?.estado).toBe('aprobado');
    expect(leerHabitaciones()[0].estado).toBe('ocupada'); expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.results[0].value).toEqual(updated);
    expect(leerReservas()).toEqual([updated]); expect(checkInWebPendiente(updated)).toBe(false); unchangedData(updated);
    const after = snapshot(); expect(completarCheckInReserva(stay.id, 'portal')).toBeUndefined(); expect(snapshot()).toEqual(after);
  } finally { window.removeEventListener(RESERVAS_EVENT, listener); }
});

describe('rechazos del portal sin escritura', () => {
  test.each([
    ['sin habitación', { habitacionId: null }, /asigna una habitación/],
    ['sin envío', { checkInWeb: undefined }, /check-in enviado/],
    ['sin términos', { checkInWeb: { ...stay.checkInWeb!, terminosAceptados: false } }, /términos/],
    ['sin imagen', { checkInWeb: { ...stay.checkInWeb!, documentos: [{ ...document, previewUrl: undefined }] } }, /evidencias/],
    ['rechazado', { checkInWeb: { ...stay.checkInWeb!, estado: 'rechazado' as const } }, /check-in enviado/],
  ] satisfies [string, Partial<Reserva>, RegExp][])('%s', (_, changes, message) => {
    seedPortal({ ...stay, ...changes }); const before = snapshot();
    expect(errorActivacionCheckInPortal(stay.id)).toMatch(message);
    expect(completarCheckInReserva(stay.id, 'portal')).toBeUndefined(); expect(snapshot()).toEqual(before);
  });
  test.each(['mantenimiento', 'en-limpieza'] as const)('habitación %s', estado => {
    seedPortal(stay, { ...room, estado }); const before = snapshot();
    expect(errorActivacionCheckInPortal(stay.id)).toMatch(/limpieza o mantenimiento/);
    expect(completarCheckInReserva(stay.id, 'portal')).toBeUndefined(); expect(snapshot()).toEqual(before);
  });
  test('DPI requiere dos lados, y frente/reverso permiten activar conservando evidencias', () => {
    seedPortal(stay, room, { ...guest, tipoDocumento: 'DPI' }); const before = snapshot();
    expect(errorActivacionCheckInPortal(stay.id)).toMatch(/evidencias/);
    expect(completarCheckInReserva(stay.id, 'portal')).toBeUndefined(); expect(snapshot()).toEqual(before);
    const documents = [{ ...document, lado: 'frente' as const }, { ...document, lado: 'reverso' as const }];
    seedPortal({ ...stay, checkInWeb: { ...stay.checkInWeb!, documentos: documents } }, room, { ...guest, tipoDocumento: 'DPI' });
    expect(completarCheckInReserva(stay.id, 'portal')?.estado).toBe('en-curso');
    expect(leerReservas()[0].checkInWeb?.documentos).toEqual(documents);
  });
});

test('rechazar y reenviar conserva reserva/evidencias y persiste antes de publicar al portal', () => {
  const rejected = rechazarCheckInPortal(stay.id, 'Documento ilegible')!;
  expect(rejected.estado).toBe('confirmada'); expect(rejected.habitacionId).toBe(room.id);
  expect(rejected.checkInWeb?.estado).toBe('rechazado'); unchangedData(rejected);
  expect(completarCheckInReserva(stay.id, 'portal')).toBeUndefined();
  const documents = [{ ...document, lado: 'frente' as const }, { ...document, nombre: 'reverso.png', lado: 'reverso' as const }];
  const updated = enviarCheckInPortal(stay.id, guest.id, { documento: documents[0], documentos: documents, peticiones: [], notaPeticiones: '' })!;
  expect(updated.checkInWeb?.estado).toBe('pendiente'); expect(leerReservas()).toEqual([updated]);
  expect(updated.checkInWeb?.documentos).toEqual(documents); expect(updated.pagos).toEqual(stay.pagos);
  expect(updated.servicios).toEqual(stay.servicios); expect(updated.acompanantes).toEqual(stay.acompanantes);
});

test('error de cuota se propaga y no devuelve un envío que no se guardó', () => {
  rechazarCheckInPortal(stay.id, 'Documento ilegible'); const before = snapshot();
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('QuotaExceededError', 'QuotaExceededError'); });
  expect(() => enviarCheckInPortal(stay.id, guest.id, { documento: document, documentos: [document], peticiones: [], notaPeticiones: '' })).toThrow(/Quota/);
  expect(snapshot()).toEqual(before); expect(leerReservas()[0].checkInWeb?.estado).toBe('rechazado');
});

test('envío ajeno, duplicado o cerrado no modifica el store', () => {
  const data = { documento: document, documentos: [document], peticiones: [], notaPeticiones: '' };
  const before = snapshot(); expect(enviarCheckInPortal(stay.id, 'other', data)).toBeUndefined();
  expect(enviarCheckInPortal(stay.id, guest.id, data)).toBeUndefined(); expect(snapshot()).toEqual(before);
  seedPortal({ ...stay, estado: 'finalizada' }); const closed = snapshot();
  expect(enviarCheckInPortal(stay.id, guest.id, data)).toBeUndefined(); expect(snapshot()).toEqual(closed);
});

test('activar restaura acceso/login local del dueño; no borra acceso de otra cuenta ni habilita un check-in inválido', async () => {
  guardarAccesoPostCheckout(guest.correo, '2026-01-01T10:00:00Z'); expect(cuentaHuespedExpirada(guest.correo)).toBe(true);
  completarCheckInReserva(stay.id, 'portal'); expect(cuentaHuespedExpirada(guest.correo)).toBe(false);
  expect(leerAccesoPostCheckout(guest.correo)).toBeNull();
  const user = await loginLocal(guest.correo, 'demo123'); expect(user.role).toBe('huesped'); expect(user.guestId).toBe(guest.id);
  expect(seleccionarEstanciaHuesped(leerReservas(), user.guestId!)?.id).toBe(stay.id);
  seedPortal(); guardarAccesoPostCheckout('otro@example.com', '2026-01-01T10:00:00Z');
  const other = localStorage.getItem(GUEST_ACCESS_KEY); completarCheckInReserva(stay.id, 'portal');
  expect(localStorage.getItem(GUEST_ACCESS_KEY)).toBe(other);
  seedPortal({ ...stay, habitacionId: null }); guardarAccesoPostCheckout(guest.correo, '2026-01-01T10:00:00Z');
  expect(completarCheckInReserva(stay.id, 'portal')).toBeUndefined(); expect(cuentaHuespedExpirada(guest.correo)).toBe(true);
});

test('coordinación de Recepción usa el cliente HTTP antes de activar con respuesta BFF simulada', async () => {
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(roomsResponse());
  expect((await activarCheckInConHabitacionLista(stay.id, 'portal'))?.estado).toBe('en-curso');
  expect(fetch).toHaveBeenCalledOnce(); expect(fetch.mock.calls[0][0]).toBe('/api/habitaciones?');
  expect(leerHabitaciones()[0].estado).toBe('ocupada'); unchangedData(leerReservas()[0]);
});

test.each(['sucia', 'ocupada', '503'] as const)('consulta %s no activa ni hace fallback local', async outcome => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(outcome === '503'
    ? new Response(JSON.stringify({ mensaje: 'Consulta no disponible' }), { status: 503 })
    : roomsResponse(outcome === 'ocupada' ? 'OCUPADA' : 'LIBRE', outcome === 'sucia' ? 'SUCIA' : 'LIMPIA'));
  const before = snapshot(); await expect(activarCheckInConHabitacionLista(stay.id, 'portal')).rejects.toThrow();
  expect(snapshot()).toEqual(before);
});

test.each(['estado', 'habitación'] as const)('revalida %s cambiado durante la consulta asíncrona', async change => {
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
    if (change === 'estado') seedPortal({ ...stay, estado: 'cancelada' });
    else {
      seedPortal({ ...stay, habitacionId: 'other-room' });
      localStorage.setItem('vs-habitaciones', JSON.stringify([room, { ...room, id: 'other-room', numero: '102' }]));
    }
    return roomsResponse();
  });
  await expect(activarCheckInConHabitacionLista(stay.id, 'portal')).rejects.toThrow(change === 'estado' ? /confirmada/ : /cambió/);
  expect(leerReservas()[0].checkInWeb?.estado).toBe('pendiente'); expect(leerHabitaciones()[0].estado).toBe('reservada');
});

test('estancia activa prevalece sobre futura al reconciliar habitaciones y se preservan limpieza/mantenimiento', () => {
  const reconciled = reconciliarHabitacionesReservadas([room], [{ ...stay, id: 'future' }, { ...stay, estado: 'en-curso' }]);
  expect(reconciled[0].estado).toBe('ocupada'); expect(reconciliarHabitacionesReservadas(reconciled, [{ ...stay, estado: 'en-curso' }])).toBe(reconciled);
  for (const estado of ['mantenimiento', 'en-limpieza'] as const) {
    const rooms = [{ ...room, estado }]; expect(reconciliarHabitacionesReservadas(rooms, [stay])).toBe(rooms);
  }
});

test.each(['en-limpieza', 'mantenimiento', 'ocupada'] as const)('check-in de Recepción rechaza habitación %s sin alterar datos', estado => {
  seedPortal({ ...stay, checkInWeb: undefined }, { ...room, estado }); const before = snapshot();
  expect(errorCheckInRecepcion(stay.id)).toMatch(/libre y limpia/);
  expect(completarCheckInReserva(stay.id, 'recepcion')).toBeUndefined(); expect(snapshot()).toEqual(before);
});
test.each([
  { fechaEntrada: '2026-10-10' }, { fechaSalida: '2026-10-09' },
])('check-in de Recepción rechaza fecha $fechaEntrada $fechaSalida', changes => {
  seedPortal({ ...stay, ...changes, checkInWeb: undefined }); const before = snapshot();
  expect(errorCheckInRecepcion(stay.id)).toMatch(/entrada/);
  expect(completarCheckInReserva(stay.id, 'recepcion')).toBeUndefined(); expect(snapshot()).toEqual(before);
});
test('check-in de hoy desde Recepción conserva adicionales sin envío web', () => {
  seedPortal({ ...stay, checkInWeb: undefined }); expect(errorCheckInRecepcion(stay.id)).toBeUndefined();
  expect(completarCheckInReserva(stay.id, 'recepcion')?.estado).toBe('en-curso');
  expect(leerReservas()[0].acompanantes).toEqual(stay.acompanantes);
});

test('reserva sin habitación/pagos persiste y revalida cupo, con código distinto tras releer', () => {
  seedPortal(stay, { ...room, estado: 'disponible' }); localStorage.setItem('vs-reservas', '[]');
  const input = { huespedId: guest.id, tipoHabitacion: room.tipo, fechaEntrada: '2026-10-09', fechaSalida: '2026-10-11', personas: 2, habitacionId: null };
  const created = crearReservaRecepcionDemo(input);
  expect(created.estado).toBe('confirmada'); expect(created.habitacionId).toBeNull(); expect(created.pagos).toEqual([]);
  expect(leerReservas()).toEqual([created]); expect(() => crearReservaRecepcionDemo(input)).toThrow(/disponibilidad/);
  expect(leerReservas()).toHaveLength(1);
  const next = crearReservaRecepcionDemo({ ...input, fechaEntrada: '2026-10-19', fechaSalida: '2026-10-21' });
  expect(next.codigo).not.toBe(created.codigo); expect(leerReservas()).toHaveLength(2);
  expect(leerReservas().find(r => r.id === created.id)).toEqual(created);
  localStorage.setItem('vs-reservas', '[]'); expect(() => crearReservaRecepcionDemo({ ...input, habitacionId: 'missing' })).toThrow(/disponible/);
  localStorage.setItem('vs-habitaciones', JSON.stringify([{ ...room, estado: 'mantenimiento' }]));
  expect(() => crearReservaRecepcionDemo(input)).toThrow(/disponibilidad/); expect(leerReservas()).toEqual([]);
});
