import { expect, test, vi } from 'vitest';
import { redirect } from 'next/navigation';
import { seccionesPortal, seleccionarEstanciaHuesped } from '@/features/huesped/pages/HuespedApp';
import MenuPage from '@/app/(private)/huesped/menu/page';
import ServicesPage from '@/app/(private)/huesped/servicios/page';
import CheckInPage from '@/app/(private)/huesped/check-in/page';
import RoomPage from '@/app/(private)/huesped/habitacion/page';
import { reservation } from '../fixtures/reservation';

vi.mock('next/navigation', () => ({ redirect: vi.fn(() => { throw new Error('NEXT_REDIRECT'); }) }));

test.each(['confirmada', 'en-curso', 'finalizada'] as const)('navegación para estado %s conserva destinos y desactiva operaciones tras checkout', estado => {
  const ids = seccionesPortal(estado).map(s => s.id);
  for (const id of ['checkin', 'restaurante', 'servicios']) expect(ids.includes(id as typeof ids[number])).toBe(estado !== 'finalizada');
  expect(ids).toEqual(expect.arrayContaining(['inicio', 'chat', 'habitacion', 'experiencias', 'cuenta', 'reservar']));
});

test.each([
  ['menú', MenuPage, '/huesped'], ['servicios', ServicesPage, '/huesped'],
  ['check-in', CheckInPage, '/huesped'], ['habitación', RoomPage, '/huesped?seccion=habitacion'],
] as const)('página real de %s delega el redirect a Next', (_, page, destination) => {
  expect(() => page()).toThrow('NEXT_REDIRECT'); expect(redirect).toHaveBeenCalledExactlyOnceWith(destination);
});

test('selección al releer elige historial más reciente, descarta canceladas/ajenas y no altera el arreglo', () => {
  const ended = reservation({ id: 'ended', codigo: 'ENDED', estado: 'finalizada', fechaSalida: '2026-10-05' });
  const history = [ended, { ...ended, id: 'older', fechaSalida: '2026-08-06' },
    { ...ended, id: 'cancelled', estado: 'cancelada' as const, fechaSalida: '2026-10-06' },
    { ...ended, id: 'another-guest', huespedId: 'other', estado: 'en-curso' as const }];
  const saved = JSON.stringify(history);
  expect(seleccionarEstanciaHuesped(history, 'guest')).toEqual(ended);
  expect(seleccionarEstanciaHuesped(JSON.parse(saved), 'guest')).toEqual(ended);
  expect(JSON.stringify(history)).toBe(saved); expect(seleccionarEstanciaHuesped(history, 'missing')).toBeUndefined();
  expect(seleccionarEstanciaHuesped([...history, reservation({ estado: 'confirmada' })], 'guest')?.estado).toBe('confirmada');
  expect(seleccionarEstanciaHuesped([...history, reservation({ estado: 'en-curso' })], 'guest')?.estado).toBe('en-curso');
});
