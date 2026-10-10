import { expect, test } from 'vitest';
import { crearExperienciaLocal } from '@/features/huesped/pages/ReservasExperiencias';

test.each([
  { fecha: '', hora: '', expectedDate: 'Por coordinar', expectedTime: 'Por coordinar' },
  { fecha: '2026-10-09', hora: '14:30', expectedDate: '2026-10-09', expectedTime: '14:30' },
])('experiencia local conserva los IDs explícitos y la coordinación: $fecha $hora', ({ fecha, hora, expectedDate, expectedTime }) => {
  const option = { nombre: 'Reserva de Mesa', precio: 'Sin costo' };
  const result = crearExperienciaLocal('exp-test', 'portal-RES-1201', 'hu-ana', option, fecha, hora, 2);
  expect(result).toEqual({
    id: 'exp-test', reservaId: 'portal-RES-1201', huespedId: 'hu-ana', nombre: option.nombre,
    precio: option.precio, fecha: expectedDate, hora: expectedTime, personas: 2, estado: 'Pendiente',
  });
  expect(option).toEqual({ nombre: 'Reserva de Mesa', precio: 'Sin costo' });
});
