import type { Reserva } from '@/lib/pms/types';
import { leerReservas, guardarReservas } from './reservationStore';
export const TRANSPORTE_KEY = 'vs-solicitudes-transporte';
export interface SolicitudTransporte {
  id: string;
  reservaId?: string;
  huespedId?: string;
  habitacionId?: string;
  codigoReserva?: string;
  refId: string;
  servicio: string;
  habitacion: string;
  detalle: string;
  estadoTarifa: string;
  tarifa: number | null;
  areaResponsable: string;
  aceptacionHuesped: string;
  creadoEn: string;
  confirmadaEn?: string;
  aceptadaEn?: string;
}
export function leerTransportes(): SolicitudTransporte[] {
  try {
    const data = JSON.parse(localStorage.getItem(TRANSPORTE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}
export function transportesEstancia(reservaId: string, huespedId: string) {
  return leerTransportes().filter(t => t.reservaId === reservaId && t.huespedId === huespedId);
}
function reservaTransporte(t: SolicitudTransporte): Reserva | undefined {
  if (!t.reservaId || !t.huespedId) return;
  return leerReservas().find(r => r.id === t.reservaId && r.huespedId === t.huespedId &&
    (!t.habitacionId || r.habitacionId === t.habitacionId));
}
export function confirmarTarifaTransporte(id: string, tarifa: number): boolean {
  const todos = leerTransportes();
  const t = todos.find(t => t.id === id);
  if (!t || !reservaTransporte(t) || !Number.isFinite(tarifa) || tarifa <= 0) return false;
  localStorage.setItem(TRANSPORTE_KEY, JSON.stringify(todos.map(x => x.id === id ?
    { ...x, tarifa, estadoTarifa: 'confirmada', confirmadaEn: new Date().toISOString() } : x)));
  return true;
}
export function aceptarTransporte(id: string, reservaId: string, huespedId: string): boolean {
  const todos = leerTransportes();
  const t = todos.find(t => t.id === id && t.reservaId === reservaId && t.huespedId === huespedId);
  const r = t && reservaTransporte(t);
  if (!t || !r || r.estado !== 'en-curso' || t.estadoTarifa !== 'confirmada' ||
    !Number.isFinite(t.tarifa) || Number(t.tarifa) <= 0) return false;
  const fecha = new Date().toISOString();
  const servicioId = 'transporte-' + t.id;
  if (!r.servicios.some(s => s.id === servicioId)) {
    guardarReservas(leerReservas().map(x => x.id === r.id ? { ...x, servicios: [...x.servicios,
      { id: servicioId, tipo: 'Transporte', descripcion: t.servicio, cantidad: 1, precioUnitario: Number(t.tarifa), fecha }] } : x));
  }
  localStorage.setItem(TRANSPORTE_KEY, JSON.stringify(todos.map(x => x.id === id ?
    { ...x, aceptacionHuesped: 'aceptada', aceptadaEn: t.aceptadaEn ?? fecha } : x)));
  return true;
}
