import type { ReservationDetail } from '@/lib/bff/contracts/reception';
import type { Reserva, TipoHabitacion } from '@/lib/pms/types';
import { leerHuespedes, upsertHuesped } from '@/store/guestStore';
import { upsertReserva } from '@/store/reservationStore';
// Copia de compatibilidad para abrir las pantallas locales existentes de cuenta/check-in.
// No confirma ni modifica la reserva del BFF; esas operaciones pertenecen a sus tareas.
export function prepareExistingReceptionScreen(detail: ReservationDetail): string {
  const id = `bff-reservation-${detail.codigo}`;
  const tipoDocumento = detail.huesped.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte';
  // Reutiliza la identidad local sin sobrescribir el perfil ni sus cambios.
  const existing = leerHuespedes().find(g => g.tipoDocumento === tipoDocumento && g.documento === detail.huesped.numeroDocumento);
  const guestId = (existing ?? upsertHuesped({ id: `bff-guest-${detail.huesped.id}`, nombre: detail.huesped.nombreCompleto, correo: detail.huesped.correo, telefono: detail.huesped.telefono, nacionalidad: detail.huesped.nacionalidad, tipoDocumento, documento: detail.huesped.numeroDocumento, creadoEn: detail.creadaEn })).id;
  const states = { PENDIENTE_PAGO: 'pendiente', CONFIRMADA: 'confirmada', EN_ESTADIA: 'en-curso', FINALIZADA: 'finalizada', CANCELADA: 'cancelada' } as const;
  const paid = Math.max(0, detail.total - detail.saldoPendiente);
  const value: Reserva = { id, codigo: detail.codigo, canal: detail.canal, huespedId: guestId, habitacionId: detail.habitacion ? `hh-${detail.habitacion.numero}` : null, tipoHabitacion: detail.tipoHabitacion.nombre as TipoHabitacion,
    fechaEntrada: detail.entrada, fechaSalida: detail.salida, personas: detail.numeroHuespedes, estado: states[detail.estado], creadoEn: detail.creadaEn,
    acompanantes: detail.huespedesAdicionales.map(g => ({ nombre: g.nombreCompleto, documento: g.numeroDocumento, tipoDocumento: g.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte' })), servicios: [], descuento: 0,
    pagos: paid ? [{ id: `bff-paid-${detail.codigo}`, fecha: detail.creadaEn, monto: paid, metodo: 'tarjeta', comprobante: 'Pago de prueba del BFF' }] : [],
    checkInEn: detail.historial.find(h => h.estadoNuevo === 'EN_ESTADIA')?.fechaHora,
    checkOutEn: detail.historial.find(h => h.estadoNuevo === 'FINALIZADA')?.fechaHora };
  upsertReserva(value); return id;
}
