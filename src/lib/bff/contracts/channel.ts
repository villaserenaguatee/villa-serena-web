import type { components } from '@/lib/api/schema';
type ApiChannelInput = components['schemas']['CanalSimuladoPeticion'];
export type ChannelInput = Omit<ApiChannelInput, 'reserva'> & {
  reserva: Omit<ApiChannelInput['reserva'], 'huesped'> & {huesped: import('./public').CreatePublicDto['huesped']};
};
export type ChannelReservation = components['schemas']['ReservaCanalRespuesta'];
export type ChannelResult = components['schemas']['CanalSimuladoResultado'];
