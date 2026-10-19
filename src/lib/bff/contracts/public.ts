import type { components } from '@/lib/api/schema';
type S = components['schemas'];
export type HotelDto = S['Hotel'];
export type RoomTypeDto = S['TipoHabitacionPublico'];
export type QuoteDto = S['OpcionDisponiblePublica'];
export type CreatePublicDto = S['ReservaWebPeticion'];
export type CreatedPublicDto = S['ReservaWebCreada'];
export type PaymentDto = S['PagoIniciado'];
export type PublicStatusDto = S['EstadoReservaPublico'] & {
  estadoUltimoIntento?: 'SIN_INTENTO' | 'PENDIENTE' | 'RECHAZADO' | 'EN_VERIFICACION' | null;
  motivoUltimoIntento?: 'TARJETA_REAL_EN_PRUEBAS' | 'INTENTO_RECHAZADO' | null;
};
