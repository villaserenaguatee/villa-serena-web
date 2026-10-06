import type { AvailabilityInput } from './availability';
import type { Huesped, Promocion, Reserva, TipoHabitacion } from '@/lib/pms/types';

export type BookingInput = AvailabilityInput & {
  requestId: string;
  slug: string;
  roomId: string;
  guest: { name: string; email: string; phone: string; nationality: string;
    document: string; documentType: 'DPI' | 'passport' };
  paymentMethod: 'hotel' | 'card' | 'bank';
  promoCode: string;
  expectedTotal: number;
  demo: AvailabilityInput['demo'] & { rates: Record<TipoHabitacion, number>; promotions: Promocion[] };
};
export type BookingResult = {
  mode: 'demo'; code: string; status: 'confirmed'; paymentMethod: 'hotel';
  paymentStatus: 'unpaid'; total: number;
};
// Only returned to the creator; never from the public code lookup.
export type BookingCreated = { result: BookingResult; compatibility: { guest: Huesped; reservation: Reserva } };
