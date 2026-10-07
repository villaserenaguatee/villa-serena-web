'use client';
import { useEffect, useState } from 'react';
import { getCalendar } from '@/lib/api/reception';
import type { ReceptionCalendar } from '@/lib/bff/contracts/reception';
import { calendarWithBff } from '@/features/recepcion/receptionCalendarLink';
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
  const days = calendarDays(date, view);
  const [data, setData] = useState<ReceptionCalendar | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const desde = days[0], hasta = days.at(-1)!;
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    getCalendar(desde, hasta, controller.signal).then(value => { if (!controller.signal.aborted) setData(value); })
      .catch(e => { if (!controller.signal.aborted) { setData(null); setError(e instanceof Error ? e.message : 'No se pudo consultar el calendario.'); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [desde, hasta, reservas]);
  const merged = data ? calendarWithBff(data, reservas, huespedes) : { reservas, huespedes };
  const selectedReservation = merged.reservas.find(r => r.id === selectedId);
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
    {loading && <p role="status" className="mb-2 text-sm">Consultando reservas…</p>}
    {error && <p role="alert" className="mb-2 text-sm text-red-800">{error} Se conservan las reservas locales.</p>}
    <ReceptionTimeline date={days[0]} view={view} reservas={merged.reservas} huespedes={merged.huespedes} habitaciones={habitaciones} onSelect={r => setSelectedId(r.id)} />
    <div className="mt-3 flex flex-wrap gap-2 text-xs">{Object.entries(RESERVA_META).filter(([key]) => key !== 'cancelada').map(([key, meta]) => <span key={key} className={`rounded px-2 py-1 ${meta.chip}`}>{meta.label}</span>)}</div>
    {selectedReservation && <div className="mt-3 rounded-lg border p-3" role="region" aria-label="Resumen de reserva">
      <p>{selectedReservation.codigo} · {merged.huespedes.find(h => h.id === selectedReservation.huespedId)?.nombre}</p>
      <p>{selectedReservation.fechaEntrada} → {selectedReservation.fechaSalida} · {RESERVA_META[selectedReservation.estado].label} · {data?.reservas.find(r => r.codigo === selectedReservation.codigo)?.canal ?? (selectedReservation.origenReserva === 'publica' ? 'Web' : 'Recepción')}</p>
      <button className="mr-4 mt-2 underline" onClick={() => onAbrir(selectedReservation.id)}>Ver detalle</button><button onClick={() => setSelectedId(null)}>Cerrar resumen</button>
    </div>}
  </section>;
}
