import type { ReceptionCalendar } from '@/lib/bff/contracts/reception';
import type { Huesped, Reserva, TipoHabitacion } from '@/lib/pms/types';
import { RESERVAS_INICIALES } from '@/data/pms';

// El BFF de demostración contiene las mismas ocho reservas iniciales con códigos VS-TEST.
// Se oculta únicamente su representación anterior en el calendario; no se borra del almacén.
export function calendarWithBff(data: ReceptionCalendar, local: Reserva[], guests: Huesped[]) {
  const aliases = new Set(RESERVAS_INICIALES.map(r => r.id));
  const codes = new Set(data.reservas.map(r => r.codigo));
  const states = { PENDIENTE_PAGO: 'pendiente', CONFIRMADA: 'confirmada', EN_ESTADIA: 'en-curso', FINALIZADA: 'finalizada', CANCELADA: 'cancelada' } as const;
  const calendarGuests: Huesped[] = [...guests];
  const reservations = data.reservas.map(r => {
    const previous = local.find(l => l.codigo === r.codigo || l.codigoBff === r.codigo);
    const group = data.grupos.find(g => g.tipoHabitacion.id === r.tipoHabitacionId)!;
    const room = group.habitaciones.find(h => h.id === r.habitacionId);
    const guestId = previous?.huespedId ?? `calendar-guest-${r.codigo}`;
    if (!calendarGuests.some(g => g.id === guestId)) calendarGuests.push({ id: guestId, nombre: r.huespedPrincipal,
      correo: '', telefono: '', nacionalidad: '', tipoDocumento: 'DPI', documento: '', creadoEn: '' });
    const reservation: Reserva = { ...previous, id: `bff-reservation-${r.codigo}`, codigo: r.codigo, huespedId: guestId,
      fechaEntrada: r.entrada, fechaSalida: r.salida, habitacionId: room ? `hh-${room.numero}` : null,
      tipoHabitacion: group.tipoHabitacion.nombre as TipoHabitacion, personas: previous?.personas ?? 1,
      estado: previous?.checkInEn && r.estado === 'CONFIRMADA' ? previous.estado : states[r.estado],
      origenReserva: r.canal === 'DIRECTO_WEB' ? 'publica' : undefined,
      acompanantes: previous?.acompanantes ?? [], servicios: previous?.servicios ?? [], pagos: previous?.pagos ?? [], descuento: previous?.descuento ?? 0, creadoEn: previous?.creadoEn ?? '' };
    return reservation;
  });
  return { reservas: [...local.filter(r => !aliases.has(r.id) && !r.id.startsWith('bff-reservation-') && !codes.has(r.codigo)), ...reservations], huespedes: calendarGuests };
}
