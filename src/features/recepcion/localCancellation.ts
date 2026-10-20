import type { Reserva } from '@/lib/pms/types';
// Las copias antiguas del BFF deben recuperar el canal antes de ofrecer cancelación.
export const needsReservationChannel = (r: Reserva) => r.id.startsWith('bff-reservation-') && !r.canal;
export const permitsLocalCancellation = (r: Reserva) => !needsReservationChannel(r) && !['BOOKING', 'EXPEDIA'].includes(r.canal ?? '');
