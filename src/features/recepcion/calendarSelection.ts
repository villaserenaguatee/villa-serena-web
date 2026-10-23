import type {Reserva} from '@/lib/pms/types';

export type CalendarRoom = {id:string; numero:string; piso:number; tipo:string; tipoId?:number; seleccionable?:boolean};
export type CalendarPreset = {entrada:string; salida:string; habitacionId:string; tipo:string; tipoHabitacionId?:number};
export function nextCalendarDay(day:string) {
  return new Date(Date.parse(day+'T12:00:00Z')+86400000).toISOString().slice(0,10);
}
export function calendarRangeError(room:CalendarRoom, entrada:string, salida:string, reservations:Reserva[], today:string) {
  const nights=(Date.parse(salida)-Date.parse(entrada))/86400000;
  if(room.seleccionable===false)return 'La habitación no está disponible para seleccionar.';
  if(!Number.isInteger(nights)||nights<1||nights>30||entrada<today||(Date.parse(entrada)-Date.parse(today))/86400000>365)
    return 'Selecciona de 1 a 30 noches, desde hoy y con llegada dentro de un año.';
  if(reservations.some(r=>r.habitacionId===room.id&&['pendiente','confirmada','en-curso'].includes(r.estado)&&r.fechaEntrada<salida&&r.fechaSalida>entrada))
    return 'El rango incluye fechas ocupadas. Selecciona días libres.';
  return '';
}
