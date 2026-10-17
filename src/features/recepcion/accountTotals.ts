import type { HabitacionHotel, Reserva } from '@/lib/pms/types';
import { calcularCuentaEstancia } from '@/lib/pms/cuentaEstancia';

/** En Recepción, solo los movimientos registrados cuentan como pagos. */
export function calcularCuentaRecepcion(reserva: Reserva, habitacion: HabitacionHotel | null) {
  const cuenta = calcularCuentaEstancia(reserva, habitacion);
  const pagado = reserva.pagos.reduce((centavos, pago) => centavos + Math.round(pago.monto * 100), 0) / 100;
  return { ...cuenta, pagado, saldo: Math.max(0, Math.round((cuenta.total - pagado) * 100) / 100) };
}
