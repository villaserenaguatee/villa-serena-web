import type { HabitacionHotel, TipoHabitacion } from '@/lib/pms/types';

export type AvailabilityQuery = { arrival: string; departure: string; adults: number; children: number };
export type ReservationHold = {
  code: string; roomId: string | null; roomType: TipoHabitacion;
  arrival: string; departure: string; status: string;
};
export type AvailabilityInput = AvailabilityQuery & {
  demo: { rooms: HabitacionHotel[]; holds: ReservationHold[] };
};
export type AvailabilityResponse = { mode: 'demo'; query: AvailabilityQuery; rooms: HabitacionHotel[] };
