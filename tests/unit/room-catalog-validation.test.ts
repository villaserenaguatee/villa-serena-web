import { expect, test } from 'vitest';
import { validateRoomCatalog } from '@/features/admin/pages/roomCatalogValidation';
const valid = { nombre: 'Estándar', descripcion: 'Descripción', capacidad: 2, precioBase: 420, ajusteFinSemanaPct: 0, estado: 'ACTIVO' };
test('accepts the existing category fields, including a negative weekend adjustment', () => {
  expect(validateRoomCatalog('tipos', { ...valid, ajusteFinSemanaPct: -10.25 }, [])).toEqual({});
});
test('rejects blank descriptions, fractional capacity and unsupported decimal precision', () => {
  expect(validateRoomCatalog('tipos', { ...valid, nombre: '  ', descripcion: '  ', capacidad: 1.5, precioBase: 420.001 }, [])).toHaveProperty('nombre');
  const errors = validateRoomCatalog('tipos', { ...valid, descripcion: ' ', capacidad: '', precioBase: 0, ajusteFinSemanaPct: -100 }, []);
  expect(Object.keys(errors).sort()).toEqual(['ajusteFinSemanaPct', 'capacidad', 'descripcion', 'precioBase']);
});
test('accepts physical rooms only with an active category and valid floor and state', () => {
  expect(validateRoomCatalog('habitaciones', { numero: '101', piso: 1, tipoHabitacionId: 3, estado: 'ACTIVO' }, [3])).toEqual({});
  expect(Object.keys(validateRoomCatalog('habitaciones', { numero: ' ', piso: 101, tipoHabitacionId: 4, estado: 'PUBLICADA' }, [3])).sort()).toEqual(['estado', 'numero', 'piso', 'tipoHabitacionId']);
});
