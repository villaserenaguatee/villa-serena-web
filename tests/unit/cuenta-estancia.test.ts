import { describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { calcularCuentaEstancia } from '@/lib/pms/cuentaEstancia';
import { seleccionarEstanciaHuesped } from '@/features/huesped/pages/HuespedApp';
import { payment, reservation, service } from '../fixtures/reservation';
import type { Pago, ServicioAdicional } from '@/lib/pms/types';

vi.mock('@/store/tarifasStore', async importOriginal => ({
  ...await importOriginal<typeof import('@/store/tarifasStore')>(), leerTarifas: () => ({ Standard: 420 }),
}));

describe('cuenta de la estancia (equivalencia con test-cuenta-estancia.cjs)', () => {
  const cases: [string, ServicioAdicional[], Pago[], number][] = [
    ['sin consumos', [], [], 0],
    ['consumo pendiente', [service], [], 200],
    ['abono a consumos', [service], [payment({ destino: 'consumos' })], 150],
    ['alojamiento ya compensado', [service], [payment({ destino: 'alojamiento', monto: 1260 })], 200],
    ['dos pagos legacy', [service], [payment({ id: 'booking', monto: 1260 }), payment({ id: 'consumption' })], 200],
    ['pago legacy total', [service], [payment({ monto: 1310 })], 200],
    ['pago ambiguo', [service], [payment({})], 200],
  ];
  test.each(cases)('%s: recarga sin mutaciones', (_name, servicios, pagos, saldo) => {
    const original = reservation({ servicios, pagos });
    const saved = JSON.stringify(original);
    for (let reload = 0; reload < 2; reload++) {
      const restored = JSON.parse(saved);
      expect(calcularCuentaEstancia(restored, null)).toMatchObject({ alojamiento: 1260, anticipo: 1260, saldo });
      expect(JSON.stringify(restored)).toBe(saved);
    }
    expect(JSON.stringify(original)).toBe(saved);
  });
  test('pagos ambiguos se informan sin descontarse', () => {
    expect(calcularCuentaEstancia(reservation({ pagos: [payment({})] }), null).pagosSinClasificar).toBe(50);
  });
  test('selecciona pendiente antes que finalizada y activa antes que ambas', () => {
    const pending = reservation();
    const ended = reservation({ id: 'ended', codigo: 'ENDED', estado: 'finalizada', habitacionId: 'room' });
    const active = reservation({ id: 'active', codigo: 'ACTIVE', estado: 'en-curso', habitacionId: 'room' });
    expect(seleccionarEstanciaHuesped([ended, pending], 'guest')).toBe(pending);
    expect(seleccionarEstanciaHuesped([pending, active, ended], 'guest')).toBe(active);
  });
  // Conserva la comprobación estática legacy; no acredita el comportamiento de la UI.
  test('mantiene las secciones sujetas a asignación de habitación', () => {
    expect(readFileSync('src/features/huesped/pages/HuespedApp.tsx', 'utf8')).toContain("const dependeHabitacion = ['restaurante', 'servicios', 'habitacion', 'checkin'].includes(seccion)");
  });
});
