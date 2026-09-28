export const HOTEL = {
  nombre: 'Villa Serena Hotel',
  ubicacion: 'Huehuetenango, Guatemala',
  correo: 'villaserenagt@gmail.com',
  telefono: '+502 7764-2580',
  nit: '5487963-2',
  zonaHoraria: 'America/Guatemala',
} as const;
export function fechaHotel(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: HOTEL.zonaHoraria,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function horaHotel(date = new Date(),
  locale = 'es-GT'): string {
  return new Intl.DateTimeFormat(locale, {
    timeZone: HOTEL.zonaHoraria,
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(date);
}
