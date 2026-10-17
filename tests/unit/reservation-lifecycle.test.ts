// @vitest-environment jsdom
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { asignarHabitacionReserva } from '@/store/reservationAssignment';
import { modificarReservaRecepcion } from '@/store/reservationModification';
import { completarCheckInReserva, completarCheckOutReserva, leerReservas, upsertReserva, RESERVAS_EVENT } from '@/store/reservationStore';
import { leerHabitaciones } from '@/store/roomStore';
import { leerTareasLimpiezaSalida } from '@/store/cleaningEvents';
import { seleccionarEstanciaHuesped } from '@/features/huesped/pages/HuespedApp';
import { guest, room, seedPortal } from '../fixtures/portal-checkin';
import { reservation } from '../fixtures/reservation';

const pending = reservation({ id: 'portal-RES-1201', codigo: 'RES-1201', huespedId: guest.id,
  fechaEntrada: '2026-10-09', fechaSalida: '2026-10-12' });
const ended = reservation({ ...pending, id: 're-7', codigo: 'VS-2026-00995', estado: 'finalizada', checkOutEn: '2026-08-06T10:45:00Z' });
const available = { ...room, estado: 'disponible' as const };
beforeEach(() => {
  localStorage.clear(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(new Date('2026-10-09T18:00:00Z'));
  seedPortal(pending, available); localStorage.setItem('vs-reservas', JSON.stringify([pending, ended]));
});
afterEach(() => { localStorage.clear(); vi.useRealTimers(); });
const changes = { fechaEntrada: pending.fechaEntrada, fechaSalida: pending.fechaSalida,
  personas: 1, adultos: 1, ninos: 0, habitacionId: room.id };

test('modificación persiste inmediatamente antes de cualquier actualización de React', () => {
  const result = modificarReservaRecepcion(pending.id, changes)!;
  expect(result.habitacionAnterior).toBeNull(); expect(result.reserva.estado).toBe('confirmada');
  expect(JSON.parse(localStorage.getItem('vs-reservas')!)[0]).toEqual({ ...pending, ...changes, estado: 'confirmada' });
  expect(leerReservas()[0]).toEqual(result.reserva); expect(leerReservas()[1]).toEqual(ended);
  expect(localStorage.getItem('vs-huespedes')).toBe(JSON.stringify([guest]));
  const unassigned = modificarReservaRecepcion(pending.id, { ...changes, habitacionId: null })!;
  expect(unassigned.habitacionAnterior).toBe(room.id); expect(unassigned.reserva.estado).toBe('pendiente');
  expect(unassigned.reserva.habitacionId).toBeNull();
});

test('asignación → check-in → checkout persiste, notifica al portal y no duplica estancia/historial', () => {
  const guestBefore = localStorage.getItem('vs-huespedes');
  let portal = seleccionarEstanciaHuesped(leerReservas(), guest.id)!;
  const synchronize = vi.fn(() => { portal = seleccionarEstanciaHuesped(leerReservas(), guest.id)!; });
  window.addEventListener(RESERVAS_EVENT, synchronize);
  try {
    expect(portal).toEqual(pending); expect(completarCheckInReserva(pending.id, 'recepcion')).toBeUndefined();
    const before = { ...localStorage }; expect(asignarHabitacionReserva(pending.id, 'missing')).toBeUndefined();
    expect({ ...localStorage }).toEqual(before);
    const assigned = asignarHabitacionReserva(pending.id, room.id)!;
    expect(assigned).toEqual({ ...pending, habitacionId: room.id, estado: 'confirmada' });
    expect(JSON.parse(localStorage.getItem('vs-reservas')!)[0]).toEqual(assigned);
    expect(leerReservas()[0]).toEqual(assigned); expect(portal).toEqual(assigned);
    expect(leerHabitaciones()[0].estado).toBe('reservada'); expect(assigned.checkInEn).toBeUndefined();
    const active = completarCheckInReserva(pending.id, 'recepcion')!;
    expect(active.estado).toBe('en-curso'); expect(active.checkInEn).toBe('2026-10-09T18:00:00.000Z');
    expect(portal).toEqual(active); expect(leerReservas()[0]).toEqual(active); expect(leerHabitaciones()[0].estado).toBe('ocupada');
    const checkedIn = { ...localStorage }; expect(completarCheckInReserva(pending.id, 'recepcion')).toBeUndefined();
    expect({ ...localStorage }).toEqual(checkedIn);
    const checkedOut = completarCheckOutReserva(pending.id, 'recepcion')!;
    expect(checkedOut.estado).toBe('finalizada'); expect(checkedOut.checkOutEn).toBe('2026-10-09T18:00:00.000Z');
    expect(leerHabitaciones()[0].estado).toBe('en-limpieza'); expect(leerReservas()[0]).toEqual(checkedOut);
    expect(portal.id).toBe(pending.id); expect(portal.estado).toBe('finalizada');
    expect(leerTareasLimpiezaSalida()).toHaveLength(1); expect(leerTareasLimpiezaSalida()[0].id).toBe(`salida-reserva-${pending.id}`);
    const finished = { ...localStorage }; expect(completarCheckOutReserva(pending.id, 'recepcion')).toBeUndefined();
    expect({ ...localStorage }).toEqual(finished); expect(leerReservas()).toEqual([checkedOut, ended]);
    expect(localStorage.getItem('vs-huespedes')).toBe(guestBefore); expect(synchronize).toHaveBeenCalledTimes(3);
  } finally { window.removeEventListener(RESERVAS_EVENT, synchronize); }
});

test.each(['finalizada', 'cancelada'] as const)('modificar/asignar estancia %s no escribe ni emite eventos', estado => {
  upsertReserva({ ...pending, estado }); const writes = vi.spyOn(Storage.prototype, 'setItem');
  const events = vi.spyOn(window, 'dispatchEvent'); const before = { ...localStorage };
  expect(modificarReservaRecepcion(pending.id, changes)).toBeUndefined();
  expect(asignarHabitacionReserva(pending.id, room.id)).toBeUndefined();
  expect(writes).not.toHaveBeenCalled(); expect(events).not.toHaveBeenCalled(); expect({ ...localStorage }).toEqual(before);
});

test('checkout persistido no puede reactivarse por una copia antigua de la reserva', () => {
  const assigned = asignarHabitacionReserva(pending.id, room.id)!;
  completarCheckInReserva(pending.id, 'recepcion'); const checkedOut = completarCheckOutReserva(pending.id, 'recepcion')!;
  upsertReserva({ ...assigned, estado: 'confirmada' });
  const reloaded = leerReservas()[0]; expect(reloaded.estado).toBe('finalizada'); expect(reloaded.checkOutEn).toBe(checkedOut.checkOutEn);
  expect(completarCheckInReserva(pending.id, 'recepcion')).toBeUndefined();
  expect(leerHabitaciones()[0].estado).toBe('en-limpieza'); expect(leerReservas()).toHaveLength(2);
});
