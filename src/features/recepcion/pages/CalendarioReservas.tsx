'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Reserva, Huesped, HabitacionHotel } from '@/lib/pms/types';
import { fechaHoyISO } from '@/data/pms';
import ReceptionTimeline from './ReceptionTimeline';
import { RESERVA_META } from './recUtils';

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
type Props = { reservas: Reserva[]; huespedes: Huesped[]; habitaciones: HabitacionHotel[]; onAbrir: (id: string) => void; onNueva: () => void };
export default function CalendarioReservas({ reservas, huespedes, habitaciones, onAbrir, onNueva }: Props) {
  const [view, setView] = useState<'week' | 'month'>('month');
  const [date, setDate] = useState(fechaHoyISO());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = reservas.find(r => r.id === selectedId);
  const days = calendarDays(date, view);
  return <section aria-label="Calendario de reservas" className="rounded-xl border border-[#E5E0D8] bg-white p-4 text-[#18345C]">
    <div className="mb-3 flex flex-wrap items-center gap-2">
      <h2 className="mr-auto text-xl font-semibold">Calendario de reservas</h2>
      <button onClick={onNueva} className="rounded-md bg-[#18345C] px-3 py-2 text-white">Nueva reserva</button>
      <button aria-label="Período anterior" onClick={() => setDate(moveCalendar(date, view, -1))}><ChevronLeft /></button>
      <button onClick={() => setDate(fechaHoyISO())}>Hoy</button>
      <button aria-label="Período siguiente" onClick={() => setDate(moveCalendar(date, view, 1))}><ChevronRight /></button>
      <select aria-label="Vista del calendario" value={view} onChange={e => setView(e.target.value as typeof view)} className="rounded border p-2">
        <option value="week">Semana</option><option value="month">Mes</option>
      </select>
    </div>
    <p aria-live="polite" className="mb-2 text-sm">{days[0]} — {days.at(-1)}</p>
    <ReceptionTimeline date={days[0]} view={view} reservas={reservas} huespedes={huespedes} habitaciones={habitaciones} onSelect={r => setSelectedId(r.id)} />
    <div className="mt-3 flex flex-wrap gap-2 text-xs">{Object.entries(RESERVA_META).filter(([key]) => key !== 'cancelada').map(([key, meta]) => <span key={key} className={`rounded px-2 py-1 ${meta.chip}`}>{meta.label}</span>)}</div>
    {selected && <div className="mt-3 rounded-lg border p-3" role="region" aria-label="Resumen de reserva">
      <p>{selected.codigo} · {huespedes.find(h => h.id === selected.huespedId)?.nombre}</p>
      <p>{selected.fechaEntrada} → {selected.fechaSalida} · {RESERVA_META[selected.estado].label} · {selected.origenReserva === 'publica' ? 'Web' : 'Recepción'}</p>
      <button className="mr-4 mt-2 underline" onClick={() => onAbrir(selected.id)}>Ver detalle</button><button onClick={() => setSelectedId(null)}>Cerrar resumen</button>
    </div>}
  </section>;
}
