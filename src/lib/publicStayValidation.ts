import { fechaHotel } from './hotel';
export function validPublicDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function publicSearchError(arrival: string, departure: string, adults: number, children: number, capacity = 60, today = fechaHotel()): string | null {
  if (!validPublicDate(arrival) || !validPublicDate(departure)) return 'Selecciona fechas válidas de llegada y salida.';
  if (arrival < today) return 'La llegada no puede ser una fecha pasada.';
  if (departure <= arrival) return 'La salida debe ser posterior a la llegada.';
  if ((Date.parse(arrival) - Date.parse(today)) / 86400000 > 365) return 'La llegada debe estar dentro de los próximos 365 días.';
  if ((Date.parse(departure) - Date.parse(arrival)) / 86400000 > 30) return 'La estancia debe ser de 1 a 30 noches.';
  if (!Number.isInteger(adults) || adults < 1 || !Number.isInteger(children) || children < 0) return 'Indica al menos un adulto y una cantidad entera de huéspedes.';
  if (adults + children > capacity) return `La cantidad de huéspedes supera la capacidad de ${capacity} personas.`;
  return null;
}
