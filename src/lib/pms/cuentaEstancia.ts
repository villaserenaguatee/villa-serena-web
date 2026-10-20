import type { Reserva, HabitacionHotel } from '@/lib/pms/types';
import { nochesEntre } from '@/data/pms';
import { leerTarifas } from '@/store/tarifasStore';

// El alojamiento se liquida al reservar; esta compensacion no crea un Pago.
export function calcularCuentaEstancia(reserva: Reserva, habitacion: HabitacionHotel | null, cargosLegacy = 0) {
  const noches = nochesEntre(reserva.fechaEntrada, reserva.fechaSalida);
  const precioNoche = reserva.precioNoche ?? habitacion?.precioNoche ?? leerTarifas()[reserva.tipoHabitacion];
  const alojamiento = noches * precioNoche;
  const servicios = cargosLegacy + reserva.servicios.reduce((s, x) => s + x.cantidad * x.precioUnitario, 0);
  const descuento = reserva.descuento || 0;
  const subtotal = alojamiento + servicios;
  const total = Math.max(0, subtotal - descuento);
  const anticipo = Math.max(0, alojamiento - descuento);
  const abonado = reserva.pagos.filter(p => p.destino === 'consumos').reduce((s, p) => s + p.monto, 0);
  const pagosSinClasificar = reserva.pagos.filter(p => !p.destino).reduce((s, p) => s + p.monto, 0);
  const pagado = anticipo + abonado;
  const saldo = Math.max(0, Math.round((total - pagado) * 100) / 100);
  return { noches, precioNoche, alojamiento, servicios, extras: servicios, subtotal, descuento, total, anticipo, abonado, pagado, saldo, pagosSinClasificar };
}
