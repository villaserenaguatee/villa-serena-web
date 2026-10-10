import type { Reserva } from '@/lib/pms/types';

export function moveCalendar(date: string, view: 'week' | 'month', direction: number) {
  const next = new Date(`${date}T12:00:00Z`);
  if (view === 'week') next.setUTCDate(next.getUTCDate() + direction * 7);
  else { next.setUTCDate(1); next.setUTCMonth(next.getUTCMonth() + direction); }
  return next.toISOString().slice(0, 10);
}

export function calendarDays(date: string, view: 'week' | 'month') {
  const start = new Date(`${date}T12:00:00Z`);
  if (view === 'month') start.setUTCDate(1);
  else start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
  const count = view === 'week' ? 7 : new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).getUTCDate();
  return Array.from({ length: count }, (_, i) => {
    const day = new Date(start); day.setUTCDate(start.getUTCDate() + i);
    return day.toISOString().slice(0, 10);
  });
}

export function visibleReservations(reservations: Reserva[], days: string[]) {
  return reservations.filter(r => r.estado !== 'cancelada' && r.fechaEntrada <= days.at(-1)! && r.fechaSalida > days[0]);
}
