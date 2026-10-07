import type { ReservationDetail, RoomState } from './bff/contracts/reception';
export const reservationLabels = { PENDIENTE_PAGO: 'Pendiente de pago', CONFIRMADA: 'Confirmada', EN_ESTADIA: 'En estadía', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada' };
export const channelLabels = { DIRECTO_WEB: 'Directo web', RECEPCION: 'Recepción', BOOKING: 'Booking', EXPEDIA: 'Expedia' };
export const conditionLabels = { LIMPIA: 'Limpia', SUCIA: 'Sucia', EN_LIMPIEZA: 'En limpieza', FUERA_DE_SERVICIO: 'Fuera de servicio' };
export const isExternal = (r: Pick<ReservationDetail, 'canal'>) => ['BOOKING', 'EXPEDIA'].includes(r.canal);
export const canCancel = (r: ReservationDetail) => r.estado === 'CONFIRMADA' && !isExternal(r);
export const canAssign = (r: ReservationDetail) => ['PENDIENTE_PAGO', 'CONFIRMADA'].includes(r.estado);
export const canMarkDirty = (r: RoomState) => r.ocupacion === 'LIBRE' && r.condicion === 'LIMPIA';
