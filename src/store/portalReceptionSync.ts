import type { Huesped, Reserva, MetodoPago, Pago } from '@/lib/pms/types';
import { calcularCuenta } from '@/features/recepcion/pages/recUtils';
import { leerHabitaciones } from '@/store/roomStore';
import { ahoraISO, generarId, siguienteComprobante } from '@/data/pms';
import { leerReservas, guardarReservas } from '@/store/reservationStore';
import { leerHuespedes, guardarHuespedes } from '@/store/guestStore';
const KEY = 'vs-portal-recepcion';
export interface PortalReceptionData {
  huespedes: Huesped[];
  reservas: Reserva[];
  actualizadoEn: string;
}
export function leerPortalRecepcion(): PortalReceptionData {
  if (typeof window === 'undefined')
    return { huespedes: [], reservas: [], actualizadoEn: '' };
  try {
    const datos = JSON.parse(localStorage.getItem(KEY) || 'null');
    return datos && Array.isArray(datos.huespedes) && Array.isArray(datos.reservas)
      ? datos
      : { huespedes: [], reservas: [], actualizadoEn: '' };
  }
  catch {
    return { huespedes: [], reservas: [], actualizadoEn: '' };
  }
}
export function guardarReservaDelPortal(huesped: Huesped,
  reserva: Reserva) {
  const actual = leerPortalRecepcion();
  const huespedes = actual.huespedes.some(h => h.id === huesped.id)
    ? actual.huespedes.map(h => h.id === huesped.id ? { ...h, ...huesped } : h)
    : [huesped, ...actual.huespedes];
  const reservas = actual.reservas.some(r => r.id === reserva.id || r.codigo === reserva.codigo)
    ? actual.reservas.map(r => r.id === reserva.id || r.codigo === reserva.codigo ? { ...r, ...reserva } : r)
    : [reserva, ...actual.reservas];
  localStorage.setItem(KEY, JSON.stringify({ huespedes, reservas, actualizadoEn: new Date().toISOString() }));
  const huespedesCentrales = leerHuespedes();
  guardarHuespedes(huespedesCentrales.some(h => h.id === huesped.id)
    ? huespedesCentrales.map(h => h.id === huesped.id ? { ...h, ...huesped } : h)
    : [huesped, ...huespedesCentrales]);
  const reservasCentrales = leerReservas();
  guardarReservas(reservasCentrales.some(r => r.id === reserva.id || r.codigo === reserva.codigo)
    ? reservasCentrales.map(r => r.id === reserva.id || r.codigo === reserva.codigo ? { ...r, ...reserva } : r)
    : [reserva, ...reservasCentrales]);
  window.dispatchEvent(new CustomEvent('vs-portal-recepcion-actualizado'));
}
export function registrarPagoReservaPublica(reservaId: string,
  datos: {
    monto: number;
    metodo: MetodoPago;
  }): Pago {
  const data = leerPortalRecepcion();
  const reserva = data.reservas.find(r => r.id === reservaId);
  const huesped = data.huespedes.find(h => h.id === reserva?.huespedId);
  if (!reserva || !huesped || reserva.estado === 'cancelada')
    throw new Error('La reserva no admite pagos.');
  const cuenta = calcularCuenta(reserva, leerHabitaciones().find(h => h.id === reserva.habitacionId) || null);
  if (cuenta.saldo <= 0 && reserva.pagos.length)
    return reserva.pagos[reserva.pagos.length - 1];
  if (!Number.isFinite(datos.monto) || datos.monto <= 0 || Math.abs(datos.monto - cuenta.saldo) > 0.01)
    throw new Error('Registra el saldo pendiente completo.');
  const pago: Pago = { id: generarId(), fecha: ahoraISO(), monto: Math.round(datos.monto * 100) / 100, metodo: datos.metodo, comprobante: siguienteComprobante() };
  guardarReservaDelPortal(huesped, { ...reserva, pagos: [...reserva.pagos, pago] });
  return pago;
}
