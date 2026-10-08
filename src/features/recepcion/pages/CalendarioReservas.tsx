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
  const [presentation, setPresentation] = useState<'month' | 'rooms'>('month');
  const [floor, setFloor] = useState('');
  const [category, setCategory] = useState('');
  const view = 'month' as const;
  const [date, setDate] = useState(fechaHoyISO());
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
  // El contrato agrupa por categoría; el piso viene en cada referencia de habitación.
  const rooms = data ? data.grupos.flatMap(g => g.habitaciones.map(h => ({
    id: `hh-${h.numero}`, numero: h.numero, piso: h.piso, tipo: g.tipoHabitacion.nombre,
  }))) : habitaciones;
  const filteredRooms = rooms.filter(h => (!floor || String(h.piso) === floor) && (!category || h.tipo === category));
  const visible = visibleReservations(merged.reservas, days).filter(r =>
    (!category || r.tipoHabitacion === category) && (!r.habitacionId || filteredRooms.some(h => h.id === r.habitacionId)));
  const assigned = visible.filter(r => r.habitacionId);
  const label = (r: Reserva) => `${rooms.find(h => h.id === r.habitacionId)?.numero ?? 'Sin asignar'} · ${merged.huespedes.find(h => h.id === r.huespedId)?.nombre ?? 'Huésped'}`;
  const originIcon = (r: Reserva) => ['BOOKING', 'EXPEDIA'].includes(data?.reservas.find(b => b.codigo === r.codigo)?.canal ?? '') ? '🔗' : r.origenReserva === 'publica' ? '🌐' : '🏨';
  const reservationButton = (r: Reserva) => <button key={r.id} data-reservation-code={r.codigo} onClick={() => onAbrir(r.id)}
    aria-label={`${r.codigo}, ${RESERVA_META[r.estado].label}`} title={`${label(r)} · ${r.codigo}`}
    className={`w-full rounded px-2 py-1 text-left text-xs break-words ${RESERVA_META[r.estado].chip}`}>
    {originIcon(r)} {label(r)}<span className="block text-[10px]">{r.codigo}</span>
  </button>;
  const leading = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 6) % 7;
  return <section aria-label="Calendario de reservas" className="rounded-xl border border-[#E5E0D8] bg-white p-4 text-[#18345C]">
    <div className="mb-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
      <h2 className="text-xl font-semibold">Calendario de reservas</h2>
      <div aria-hidden="true" className="col-span-2 row-start-2 h-10 w-36 justify-self-center md:col-span-1 md:col-start-2 md:row-start-1" />
      <button onClick={onNueva} className="relative top-1 col-start-2 row-start-1 h-10 justify-self-end whitespace-nowrap rounded-md bg-[#18345C] px-3 text-sm text-white md:col-start-3">+ Nueva reserva</button>
    </div>
    <div className="relative mb-3 flex flex-wrap items-center gap-3">
      <div role="group" aria-label="Vista del calendario" className="absolute right-0 top-[52px] flex h-10 overflow-hidden rounded-md border border-[#E5E0D8] text-sm md:top-0">
        {([['month', 'Mes'], ['rooms', 'Habitaciones']] as const).map(([value, text]) => <button key={value} aria-pressed={presentation === value} onClick={() => setPresentation(value)} className={`px-3 ${presentation === value ? 'bg-[#18345C] text-white' : ''}`}>{text}</button>)}
      </div>
      <div role="group" aria-label="Navegación del calendario" className="flex h-10 shrink-0 items-center gap-1 text-sm">
        <button className="grid h-10 w-8 place-items-center rounded hover:bg-[#F8F6F0]" aria-label="Período anterior" onClick={() => setDate(moveCalendar(date, view, -1))}><ChevronLeft size={18} /></button>
        <p aria-live="polite" className="min-w-24 text-center font-semibold">{new Intl.DateTimeFormat('es-GT', { month: 'long', timeZone: 'UTC' }).format(new Date(`${date}T12:00:00Z`)).replace(/^./, letter => letter.toLocaleUpperCase('es-GT'))}</p>
        <button className="grid h-10 w-8 place-items-center rounded hover:bg-[#F8F6F0]" aria-label="Período siguiente" onClick={() => setDate(moveCalendar(date, view, 1))}><ChevronRight size={18} /></button>
      </div>
      <label className="flex h-10 items-center gap-2 text-sm">Piso<select aria-label="Piso del calendario" value={floor} onChange={e => setFloor(e.target.value)} className="h-10 rounded-md border border-[#E5E0D8] px-2"><option value="">Todos</option>{[...new Set(rooms.map(h => h.piso))].sort((a,b) => a-b).map(p => <option key={p} value={p}>Piso {p}</option>)}</select></label>
      <label className="flex h-10 items-center gap-2 text-sm">Categoría<select aria-label="Categoría del calendario" value={category} onChange={e => setCategory(e.target.value)} className="h-10 max-w-full rounded-md border border-[#E5E0D8] px-2"><option value="">Todas</option>{[...new Set(rooms.map(h => h.tipo))].map(t => <option key={t}>{t}</option>)}</select></label>
    </div>
    {loading && <p role="status" className="mb-2 text-sm">Consultando reservas…</p>}
    {error && <p role="alert" className="mb-2 text-sm text-red-800">{error} Se conservan las reservas locales.</p>}
    <div className={presentation === 'month' ? 'max-w-full overflow-x-auto' : 'relative isolate max-w-full overflow-auto overscroll-contain rounded border border-[#E5E0D8]'}
      style={presentation === 'rooms' ? { height: 'clamp(180px, calc(100dvh - 370px), 640px)' } : undefined}
      tabIndex={presentation === 'rooms' ? 0 : undefined}
      aria-label={presentation === 'month' ? 'Vista mensual' : 'Vista por habitaciones'}>
      {presentation === 'month' ? <div className="min-w-[700px]">
        <div className="grid grid-cols-7 bg-[#F8F6F0] text-center text-sm">{['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'].map(d => <div key={d} className="p-2">{d}</div>)}</div>
        <div className="grid grid-cols-7 border-l border-t border-[#E5E0D8]">{Array.from({length: leading}, (_,i) => <div key={`empty-${i}`} className="border-b border-r bg-[#F8F6F0]" />)}{days.map(day => <div key={day} aria-label={`Día ${day}`} className="min-h-28 space-y-1 border-b border-r border-[#E5E0D8] p-1">
          <p className={`text-sm font-semibold ${day === fechaHoyISO() ? 'text-[#B38719]' : ''}`}>{Number(day.slice(-2))}</p>
          {assigned.filter(r => r.fechaEntrada <= day && r.fechaSalida > day).map(reservationButton)}
        </div>)}</div>
      </div> : <ReceptionTimeline days={days} groupByFloor={!floor} reservas={assigned} huespedes={merged.huespedes} habitaciones={filteredRooms} onSelect={r => onAbrir(r.id)} />}
    </div>
    <div className="mt-3 flex flex-wrap gap-2 text-xs">{Object.entries(RESERVA_META).filter(([key]) => key !== 'cancelada').map(([key, meta]) => <span key={key} className={`rounded px-2 py-1 ${meta.chip}`}>{meta.label}</span>)}</div>
  </section>;
}
