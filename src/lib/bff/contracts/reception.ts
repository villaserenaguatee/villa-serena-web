import type { components } from '@/lib/api/schema';
type S = components['schemas'];
export type ReservationDetail = S['ReservaDetalle'];
export type ReservationSummary = S['ReservaResumen'];
export type ReservationPage = S['PaginaReservas'];
export type RoomState = S['HabitacionEstado'];
export type RoomReference = S['HabitacionReferencia'];
export type CancellationPreview = S['VistaPreviaCancelacion'];
