'use client';
import { useEffect, useState } from 'react';
import { getCalendar } from '@/lib/api/reception';
import type { ReceptionCalendar } from '@/lib/bff/contracts/reception';
import { calendarWithBff } from '@/features/recepcion/receptionCalendarLink';
import { BedDouble, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Reserva, Huesped, HabitacionHotel } from '@/lib/pms/types';
import { fechaHoyISO } from '@/data/pms';
import ReceptionTimeline from './ReceptionTimeline';
import { CALENDAR_STATUS as RESERVA_META } from '../calendarStatus';
import ReceptionCloseButton from './ReceptionCloseButton';

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
export function monthWeekSegments(week: (string | null)[], reservations: Reserva[]) {
  const segments = reservations.flatMap(reserva => {
    const occupied = week.flatMap((day, column) => day && reserva.fechaEntrada <= day && reserva.fechaSalida > day ? [column] : []);
    return occupied.length ? [{ reserva, start: occupied[0], end: occupied.at(-1)! + 1, lane: 0 }] : [];
  }).sort((a, b) => a.start - b.start || b.end - a.end || a.reserva.codigo.localeCompare(b.reserva.codigo));
  const laneEnds: number[] = [];
  for (const segment of segments) {
    const available = laneEnds.findIndex(end => end <= segment.start);
    segment.lane = available < 0 ? laneEnds.length : available;
    laneEnds[segment.lane] = segment.end;
  }
  return segments;
}
type Props = { reservas: Reserva[]; huespedes: Huesped[]; habitaciones: HabitacionHotel[]; onAbrir: (id: string) => void; onNueva: () => void };
export default function CalendarioReservas({ reservas, huespedes, habitaciones, onAbrir, onNueva }: Props) {
  const [presentation, setPresentation] = useState<'month' | 'rooms'>('month');
  const [floor, setFloor] = useState('');
  const [category, setCategory] = useState('');
  const view = 'month' as const;
  const [date, setDate] = useState(fechaHoyISO());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  useEffect(() => { setSelectedDay(null); }, [date, floor, category, presentation]);
  useEffect(() => {
    if (!selectedDay) return;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedDay(null); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [selectedDay]);
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
  const label = (r: Reserva) => `${r.habitacionId ? `Hab. ${rooms.find(h => h.id === r.habitacionId)?.numero ?? '—'}` : 'Sin asignar'} · ${merged.huespedes.find(h => h.id === r.huespedId)?.nombre ?? 'Huésped'}`;
  const reservationButton = (r: Reserva) => <button key={r.id} data-reservation-code={r.codigo} onClick={() => { setSelectedDay(null); onAbrir(r.id); }}
    aria-label={`${r.codigo}, ${RESERVA_META[r.estado].label}`} title={`${label(r)} · ${r.codigo}`}
    className={`h-9 w-full shrink-0 truncate rounded border px-2 py-1 text-left text-xs ${RESERVA_META[r.estado].chip}`}>
    <BedDouble size={14} aria-hidden="true" className="mr-1 inline-block align-middle" /> {label(r)}
  </button>;
  const leading = (new Date(`${days[0]}T12:00:00Z`).getUTCDay() + 6) % 7;
  const monthSlots: (string | null)[] = [...Array<string | null>(leading).fill(null), ...days];
  while (monthSlots.length % 7) monthSlots.push(null);
  const weeks = Array.from({ length: monthSlots.length / 7 }, (_, i) => monthSlots.slice(i * 7, i * 7 + 7));
  const reservationsOnDay = (day: string) => assigned.filter(r => r.fechaEntrada <= day && r.fechaSalida > day);
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
        <div className="border-l border-t border-[#E5E0D8]">{weeks.map((week, index) => {
          const segments = monthWeekSegments(week, assigned);
          return <div key={index} data-month-week={index} className="relative h-[136px]">
            <div className="grid h-full grid-cols-7">{week.map((day, column) => {
              const hidden = segments.filter(s => s.lane >= 3 && s.start <= column && s.end > column).length;
              return <div key={day ?? `empty-${column}`} aria-label={day ? `Día ${day}` : undefined} className={`relative min-w-0 border-b border-r border-[#E5E0D8] p-1 ${day ? '' : 'bg-[#F8F6F0]'}`}>
                {day && <><p className={`text-sm font-semibold ${day === fechaHoyISO() ? 'text-[#B38719]' : ''}`}>{Number(day.slice(-2))}</p>
                {hidden > 0 && <button onClick={() => setSelectedDay(day)} aria-label={`Ver todas las reservas del ${day}`} className="absolute bottom-1 left-1 rounded px-1 text-xs font-semibold text-[#18345C] hover:bg-[#F8F6F0]">+ {hidden} más</button>}</>}
              </div>;
            })}</div>
            {segments.filter(s => s.lane < 3).map(({ reserva: r, start, end, lane }) => <button key={r.id} data-reservation-code={r.codigo} data-start-column={start} data-end-column={end} data-lane={lane}
              onClick={() => onAbrir(r.id)} aria-label={`${r.codigo}, ${RESERVA_META[r.estado].label}`} title={`${label(r)} · ${r.codigo}`}
              style={{ left: `calc(${start * 100 / 7}% + 3px)`, width: `calc(${(end - start) * 100 / 7}% - 6px)`, top: 28 + lane * 27 }}
              className={`absolute h-6 truncate rounded border px-2 text-left text-xs ${RESERVA_META[r.estado].chip}`}><BedDouble size={14} aria-hidden="true" className="mr-1 inline-block align-middle" /> {label(r)}</button>)}
          </div>;
        })}</div>
      </div> : <ReceptionTimeline days={days} groupByFloor={!floor} reservas={assigned} huespedes={merged.huespedes} habitaciones={filteredRooms} onSelect={r => onAbrir(r.id)} />}
    </div>
    <div aria-label="Leyenda de estados" className="mt-2 flex flex-wrap gap-1.5 text-[11px]">{Object.entries(RESERVA_META).map(([key, meta]) => <span key={key} className={`rounded border px-2 py-0.5 ${meta.chip}`}>{meta.label}</span>)}</div>
    {selectedDay && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071D34]/45 p-4" onClick={() => setSelectedDay(null)}>
      <section role="dialog" aria-modal="true" aria-label="Reservas del día" onClick={e => e.stopPropagation()} className="flex max-h-[80dvh] w-full max-w-md flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <header className="flex shrink-0 items-center justify-between gap-2 border-b border-[#E5E0D8] px-4 py-2"><h3 className="text-lg font-semibold">Reservas del {new Intl.DateTimeFormat('es-GT', { day: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(`${selectedDay}T12:00:00Z`))}</h3><ReceptionCloseButton autoFocus onClick={() => setSelectedDay(null)} /></header>
        <div className="min-h-0 space-y-2 overflow-y-auto p-3">{reservationsOnDay(selectedDay).map(reservationButton)}</div>
      </section>
    </div>}
  </section>;
}
