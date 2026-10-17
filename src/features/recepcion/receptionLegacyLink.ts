import type { ReservationDetail } from '@/lib/bff/contracts/reception';
import type { Reserva, TipoHabitacion } from '@/lib/pms/types';
import { leerHuespedes, upsertHuesped } from '@/store/guestStore';
import { leerReservas, upsertReserva } from '@/store/reservationStore';
import { RESERVAS_INICIALES } from '@/data/pms';
// Copia de compatibilidad para abrir las pantallas locales existentes de cuenta/check-in.
// No confirma ni modifica la reserva del BFF; esas operaciones pertenecen a sus tareas.
export function prepareExistingReceptionScreen(detail: ReservationDetail): string {
  const fixture = /^VS-TEST0([1-8])$/.exec(detail.codigo);
  const legacyId = fixture ? RESERVAS_INICIALES[Number(fixture[1]) - 1].id : undefined;
  const previous = leerReservas().find(r => r.codigo === detail.codigo || r.codigoBff === detail.codigo || r.id === legacyId);
  const id = previous?.id ?? `bff-reservation-${detail.codigo}`;
  const tipoDocumento = detail.huesped.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte';
  // Reutiliza la identidad local sin sobrescribir el perfil ni sus cambios.
  const existing = leerHuespedes().find(g => g.tipoDocumento === tipoDocumento && g.documento === detail.huesped.numeroDocumento);
  const guestId = (existing ?? upsertHuesped({ id: `bff-guest-${detail.huesped.id}`, nombre: detail.huesped.nombreCompleto, correo: detail.huesped.correo, telefono: detail.huesped.telefono, nacionalidad: detail.huesped.nacionalidad, tipoDocumento, documento: detail.huesped.numeroDocumento, creadoEn: detail.creadaEn })).id;
  const states = { PENDIENTE_PAGO: 'pendiente', CONFIRMADA: 'confirmada', EN_ESTADIA: 'en-curso', FINALIZADA: 'finalizada', CANCELADA: 'cancelada' } as const;
  const value: Reserva = {
  ...previous,
  id,
  codigo: previous?.codigo ?? detail.codigo,
  codigoBff: detail.codigo,
  canal: detail.canal,
  huespedId: guestId,
  habitacionId: detail.habitacion
    ? `hh-${detail.habitacion.numero}`
    : detail.estado === 'FINALIZADA' ? previous?.habitacionId ?? RESERVAS_INICIALES.find(r => r.id === legacyId)?.habitacionId ?? null : null,
  tipoHabitacion: detail.tipoHabitacion.nombre as TipoHabitacion,
    fechaEntrada: detail.entrada, fechaSalida: detail.salida, personas: detail.numeroHuespedes, estado: states[detail.estado], creadoEn: detail.creadaEn,
    acompanantes: previous?.acompanantes.length ? previous.acompanantes : detail.huespedesAdicionales.map(g => ({ nombre: g.nombreCompleto, documento: g.numeroDocumento, tipoDocumento: g.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte' })), servicios: previous?.servicios ?? [], descuento: previous?.descuento ?? 0,
    precioNoche: detail.total / detail.noches,
    pagos: previous?.pagos ?? [],
    checkInEn: detail.historial.find(h => h.estadoNuevo === 'EN_ESTADIA')?.fechaHora ?? previous?.checkInEn,
    checkOutEn: detail.historial.find(h => h.estadoNuevo === 'FINALIZADA')?.fechaHora ?? previous?.checkOutEn };
  if (previous?.checkInEn && detail.estado === 'CONFIRMADA') value.estado = previous.estado;
  upsertReserva(value); return id;
}
