import { useEffect, useState, type FormEvent } from 'react';
import type { Reserva, Huesped, HabitacionHotel } from '@/lib/pms/types';
import { formatoFecha } from '@/data/pms';
import { SearchIcon, PlusIcon, CalendarIcon } from './recUtils';
import { publicRoomForHotelType } from '@/data/publicRooms';
import { searchReservations } from '@/lib/api/reception';
import { channelLabels, reservationLabels } from '@/lib/receptionPresentation';
import { validReceptionDate } from '@/lib/receptionValidation';
import type { ReservationPage } from '@/lib/bff/contracts/reception';
interface Props { reservas: Reserva[]; huespedes: Huesped[]; habitaciones: HabitacionHotel[]; refreshTick?: number; onAbrir: (codigo: string) => void; onNueva: () => void }
const control = 'min-w-0 rounded-md border border-[#E5E0D8] bg-white px-3 py-2.5 text-sm text-[#18345C]';
export default function Reservas({ onAbrir, onNueva, refreshTick }: Props) {
  const [texto, setTexto] = useState(''), [codigo, setCodigo] = useState(''), [estado, setEstado] = useState(''), [canal, setCanal] = useState('');
  const [desde, setDesde] = useState(''), [hasta, setHasta] = useState(''), [rapido, setRapido] = useState('');
  const [query, setQuery] = useState(''), [result, setResult] = useState<ReservationPage | null>(null), [error, setError] = useState(''), [loading, setLoading] = useState(false), [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setResult(null);
    searchReservations(new URLSearchParams(query), controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query, reload, refreshTick]);
  function search(fast = rapido) {
    if ((desde && !validReceptionDate(desde)) || (hasta && !validReceptionDate(hasta)) || (desde && hasta && hasta < desde)) { setError('Selecciona un rango de fechas válido.'); return; }
    if (codigo.trim() && !/^VS-[A-Z0-9]{6}$/.test(codigo.trim().toUpperCase())) { setError('Indica el código completo de reserva (VS- y seis letras o números).'); return; }
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries({ texto: texto.trim(), codigo: codigo.trim().toUpperCase(), estado, canal, desde, hasta, rapido: fast })) if (value) next.set(key, value);
    setQuery(next.toString()); setReload(n => n + 1);
  }
  function submit(event: FormEvent) { event.preventDefault(); search(); }
  function clear() { setTexto(''); setCodigo(''); setEstado(''); setCanal(''); setDesde(''); setHasta(''); setRapido(''); setQuery(''); setReload(n => n + 1); }
  function paginate(page: number) { const next = new URLSearchParams(query); next.set('page', String(page)); setQuery(next.toString()); }
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] text-[#18345C]">
    <div className="border-b border-[#E5E0D8] bg-white px-4 py-4 sm:px-6">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-[32px] font-semibold">Reservas</h1><p className="text-sm text-[#52677F]">Datos de prueba consultados al BFF.</p></div><button onClick={onNueva} className="flex items-center gap-2 rounded-md bg-[#18345C] px-4 py-2.5 text-white"><PlusIcon />Nueva reserva</button></div>
      <form onSubmit={submit} className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Nombre o documento<div className="relative"><span className="absolute left-3 top-3"><SearchIcon size={15} /></span><input className={`${control} w-full pl-9`} value={texto} onChange={e => setTexto(e.target.value)} placeholder="Buscar huésped…" /></div></label>
        <label className="text-sm">Código de reserva<input className={`${control} w-full`} value={codigo} onChange={e => setCodigo(e.target.value)} placeholder="VS-TEST01" /></label>
        <label className="text-sm">Estado<select aria-label="Estado" className={`${control} w-full`} value={estado} onChange={e => setEstado(e.target.value)}><option value="">Todos los estados</option>{Object.entries(reservationLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm">Canal de origen<select aria-label="Canal de origen" className={`${control} w-full`} value={canal} onChange={e => setCanal(e.target.value)}><option value="">Todos los canales</option>{Object.entries(channelLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm">Desde<input type="date" className={`${control} w-full`} value={desde} onChange={e => setDesde(e.target.value)} /></label>
        <label className="text-sm">Hasta<input type="date" className={`${control} w-full`} value={hasta} onChange={e => setHasta(e.target.value)} /></label>
        <div className="flex flex-wrap items-end gap-2 sm:col-span-2"><button className="rounded-md bg-[#18345C] px-4 py-2.5 text-white" disabled={loading}>Buscar</button><button type="button" className={control} onClick={clear}>Limpiar filtros</button><button type="button" className={control} onClick={() => setReload(n => n + 1)}>Actualizar</button></div>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">{[['LLEGAN_HOY', 'Llegan hoy'], ['SALEN_HOY', 'Salen hoy']].map(([key, label]) => <button key={key} aria-pressed={rapido === key} onClick={() => { setRapido(key); search(key); }} className={`${control} ${rapido === key ? 'font-semibold ring-1 ring-[#18345C]' : ''}`}>{label}</button>)}</div>
    </div>
    <div className="space-y-3 px-4 py-4 sm:px-6">
      {loading && <p role="status">Consultando reservas…</p>}{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
      {result && <p className="text-sm">{result.totalElementos} reservas</p>}
      {result?.contenido.length === 0 && <p className="rounded-xl border border-[#E5E0D8] bg-white p-6 text-center">No hay reservas que coincidan con la búsqueda.</p>}
      {result?.contenido.map(r => <button key={r.codigo} onClick={() => onAbrir(r.codigo)} className="flex w-full items-center gap-3 overflow-hidden rounded-xl border border-[#E5E0D8] bg-white p-3 text-left hover:border-[#18345C]">
        <img src={publicRoomForHotelType(r.tipoHabitacion.nombre as Reserva['tipoHabitacion']).image} alt={`Tipo ${r.tipoHabitacion.nombre}`} className="h-16 w-16 shrink-0 rounded-lg object-cover sm:w-24" />
        <div className="min-w-0 flex-1 space-y-1"><p className="font-semibold">{r.huespedPrincipal.nombreCompleto} <span className="ml-1 rounded bg-[#F8F6F0] px-2 text-xs">{reservationLabels[r.estado]}</span></p><p className="break-words text-sm">{r.codigo} · {r.habitacion ? `Habitación ${r.habitacion.numero}` : 'Sin asignar'} · {r.tipoHabitacion.nombre}</p><p className="flex flex-wrap items-center gap-1 text-sm text-[#52677F]"><CalendarIcon size={12} />{formatoFecha(r.entrada)} → {formatoFecha(r.salida)} · {r.numeroHuespedes} huéspedes</p><p className="break-all text-sm">{channelLabels[r.canal]}{r.identificadorExterno && ` · ${r.identificadorExterno}`}</p>{r.estado === 'EN_ESTADIA' && <p className="text-sm">Saldo pendiente: Q {r.saldoPendiente.toFixed(2)}</p>}</div><span className="shrink-0 text-sm">Ver ›</span>
      </button>)}
      {result && result.totalPaginas > 1 && <div className="flex items-center justify-center gap-3"><button className={control} disabled={!result.page} onClick={() => paginate(result.page - 1)}>Anterior</button><span>{result.page + 1} / {result.totalPaginas}</span><button className={control} disabled={result.page + 1 >= result.totalPaginas} onClick={() => paginate(result.page + 1)}>Siguiente</button></div>}
    </div>
  </div>;
}
