import { useEffect, useState } from 'react';
import Link from 'next/link';
import { findRoomReservations } from '@/features/recepcion/roomReservations';
import { formatoFecha } from '@/data/pms';
import type { HabitacionHotel, Reserva, Huesped, EstadoHabHotel, TipoHabitacion } from '@/lib/pms/types';
import { publicRoomForHotelType } from '@/data/publicRooms';
import { getRooms, markRoomDirty } from '@/lib/api/reception';
import { canMarkDirty, conditionLabels, reservationLabels } from '@/lib/receptionPresentation';
import type { RoomState, ReservationSummary } from '@/lib/bff/contracts/reception';
import { useTiempoReal } from '@/lib/tiempo-real/useTiempoReal';
import ReportarIncidencia from '@/components/common/ReportarIncidencia';
interface Props { habitaciones: HabitacionHotel[]; reservas: Reserva[]; huespedes: Huesped[]; onCambiarEstado: (id: string, nuevo: EstadoHabHotel) => void; onVerReserva: (id: string) => void; onVerReservaBff?: (codigo: string) => void; conectado?: boolean }
const control = 'min-w-0 rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]';
export default function HabitacionesRecepcion(_props: Props) {
  const conectado = _props.conectado ?? false;
  const [reportar, setReportar] = useState<RoomState>();
  const [selected, setSelected] = useState<number | null>(null);
  const [reservations, setReservations] = useState<ReservationSummary[]>([]);
  const [reservationError, setReservationError] = useState(''), [reservationLoading, setReservationLoading] = useState(false);
  const [rooms, setRooms] = useState<RoomState[]>([]), [types, setTypes] = useState<RoomState['tipoHabitacion'][]>([]);
  const [occupancy, setOccupancy] = useState(''), [condition, setCondition] = useState(''), [type, setType] = useState(''), [floor, setFloor] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false), [busy, setBusy] = useState<number | null>(null), [reload, setReload] = useState(0);
  useTiempoReal('/topic/habitaciones', () => setReload(n => n + 1), () => setReload(n => n + 1), conectado, setError);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setRooms([]);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ocupacion: occupancy, condicion: condition, tipoHabitacionId: type, piso: floor })) if (value) query.set(key, value);
    getRooms(query, controller.signal).then(value => { if (!controller.signal.aborted) { setRooms(value); setTypes(previous => Array.from(new Map([...previous, ...value.map(r => r.tipoHabitacion)].map(t => [t.id, t])).values()).sort((a, b) => a.id - b.id)); } }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [occupancy, condition, type, floor, reload]);
  useEffect(() => {
    const controller = new AbortController();
    setReservations([]); setReservationError(''); setReservationLoading(false);
    if (selected === null) return;
    if (conectado) { setReservationError('La consulta de reservas del API todavía no está conectada en el BFF.'); return; }
    setReservationLoading(true);
    findRoomReservations(selected, controller.signal).then(value => { if (!controller.signal.aborted) setReservations(value); })
      .catch(e => { if (!controller.signal.aborted) setReservationError(e instanceof Error ? e.message : 'No se pudieron consultar las reservas de la habitación.'); })
      .finally(() => { if (!controller.signal.aborted) setReservationLoading(false); });
    return () => controller.abort();
  }, [selected, reload, conectado]);
  useEffect(() => {
    if (selected === null) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [selected]);
  const selectedRoom = rooms.find(room => room.id === selected);
  function openRoom(id: number) {
    setReservations([]); setReservationError(''); setReservationLoading(!conectado); setSelected(id);
  }
  async function dirty(room: RoomState) {
    if (busy !== null) return; setBusy(room.id); setError(''); setNotice('');
    try { await markRoomDirty(room.id); setNotice(`Habitación ${room.numero} marcada sucia${conectado ? '' : ' en la simulación'}.`); setReload(n => n + 1); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar la habitación.'); }
    finally { setBusy(null); }
  }
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] text-[#18345C]">
    <header className="border-b border-[#E5E0D8] bg-white px-4 py-4 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-[32px] font-semibold">Estado de habitaciones</h1><p className="text-sm text-[#52677F]">{conectado ? 'Habitaciones consultadas al API, con actualizaciones de limpieza.' : 'Datos de prueba del BFF. Se actualizan al abrir y al pulsar Actualizar.'}</p></div><button className={control} disabled={loading || busy !== null} onClick={() => setReload(n => n + 1)}>Actualizar</button></div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Ocupación<select aria-label="Ocupación" className={`${control} w-full`} value={occupancy} onChange={e => setOccupancy(e.target.value)}><option value="">Todas</option><option value="LIBRE">Libre</option><option value="OCUPADA">Ocupada</option></select></label>
        <label className="text-sm">Condición<select aria-label="Condición" className={`${control} w-full`} value={condition} onChange={e => setCondition(e.target.value)}><option value="">Todas</option>{Object.entries(conditionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm">Tipo<select aria-label="Tipo" className={`${control} w-full`} value={type} onChange={e => setType(e.target.value)}><option value="">Todos</option>{types.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></label>
        <label className="text-sm">Piso<select aria-label="Piso" className={`${control} w-full`} value={floor} onChange={e => setFloor(e.target.value)}><option value="">Todos</option>{[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      </div>
    </header>
    <div className="space-y-3 p-4 sm:p-6">{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3">{notice}</p>}{loading ? <p>Consultando habitaciones…</p> : !error && !rooms.length && <p className="rounded-xl bg-white p-6 text-center">No hay habitaciones que coincidan con los filtros.</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{rooms.map(room => <article key={room.id} data-room={room.numero} onClick={() => openRoom(room.id)} className="cursor-pointer overflow-hidden rounded-xl border border-[#E5E0D8] bg-white">
        <img className="h-36 w-full object-cover" src={publicRoomForHotelType(room.tipoHabitacion.nombre as TipoHabitacion).image} alt={room.tipoHabitacion.nombre} />
        <div className="space-y-2 p-4"><h2 className="text-xl font-semibold"><button className="text-left" aria-label={`Abrir detalle de habitación ${room.numero}`} onClick={event => { event.stopPropagation(); openRoom(room.id); }}>Habitación {room.numero}</button></h2><p>{room.tipoHabitacion.nombre} · Piso {room.piso}</p><p><span className="rounded bg-[#F8F6F0] px-2 py-1">{room.ocupacion === 'LIBRE' ? 'Libre' : 'Ocupada'}</span> · {conditionLabels[room.condicion]}</p>
          {room.llegaHoy && <p className="text-sm">Llega hoy</p>}{room.saleHoy && <p className="text-sm">Sale hoy</p>}{room.incidenciaPendiente && <p className="text-sm text-red-800">Incidencia pendiente</p>}
          {room.incidenciaBloqueante && <div className="rounded-lg bg-red-50 p-3 text-sm"><b>Incidencia bloqueante · solo lectura</b><p>{room.incidenciaBloqueante.descripcion}</p><p>{room.incidenciaBloqueante.estado}</p></div>}
          {canMarkDirty(room) && <button className={control} disabled={busy !== null} onClick={event => { event.stopPropagation(); void dirty(room); }}>Marcar sucia</button>}
          {conectado && <button className={control} onClick={event => { event.stopPropagation(); setReportar(room); }}>Reportar daño</button>}
        </div>
      </article>)}</div>
    </div>
    {selectedRoom && <div className="fixed inset-0 z-40 flex justify-end bg-black/20" onMouseDown={event => { if (event.target === event.currentTarget) setSelected(null); }}>
      <aside role="dialog" aria-modal="true" aria-label={`Detalle de habitación ${selectedRoom.numero}`} className="h-full w-full overflow-y-auto bg-white text-[#18345C] shadow-2xl sm:w-[460px]">
        <header className="flex items-center justify-between gap-3 p-5"><div><p className="text-xs tracking-widest text-[#B38719]">HABITACIÓN</p><h2 className="text-2xl font-bold">Habitación {selectedRoom.numero}</h2></div><button autoFocus aria-label="Cerrar detalle de habitación" className={control} onClick={() => setSelected(null)}>Cerrar</button></header>
        <img src={publicRoomForHotelType(selectedRoom.tipoHabitacion.nombre as TipoHabitacion).image} alt={selectedRoom.tipoHabitacion.nombre} className="h-60 w-full object-cover" />
        <div className="space-y-4 p-5"><h3 className="text-xl font-semibold">{selectedRoom.tipoHabitacion.nombre}</h3><p>Piso {selectedRoom.piso} · {selectedRoom.ocupacion === 'LIBRE' ? 'Libre' : 'Ocupada'} · {conditionLabels[selectedRoom.condicion]}</p>
          {selectedRoom.llegaHoy && <p>Llega hoy</p>}{selectedRoom.saleHoy && <p>Sale hoy</p>}
          {selectedRoom.incidenciaPendiente && <p className="text-red-800">Incidencia pendiente</p>}
          {selectedRoom.incidenciaBloqueante && <div className="rounded-lg bg-red-50 p-3"><b>Incidencia bloqueante · solo lectura</b><p>{selectedRoom.incidenciaBloqueante.descripcion}</p><p>{selectedRoom.incidenciaBloqueante.estado}</p></div>}
          <section className="space-y-3 border-t border-[#E5E0D8] pt-5"><h3 className="font-semibold">Reservas asignadas</h3>
            {reservationLoading ? <p role="status">Consultando reservas…</p> : reservationError ? <p role="alert">{reservationError}</p> : !reservations.length ? <p>No hay reservas activas asignadas a esta habitación.</p> : reservations.map(reservation => <div key={reservation.codigo} className="rounded-xl border border-[#E5E0D8] p-4">
              <p className="font-semibold">{reservation.huespedPrincipal.nombreCompleto}</p><p>{reservation.codigo} · {reservationLabels[reservation.estado]}</p><p>{formatoFecha(reservation.entrada)} → {formatoFecha(reservation.salida)}</p>
              <Link href={`/recepcion/reservas/${encodeURIComponent(reservation.codigo)}`} onClick={() => { setSelected(null); _props.onVerReservaBff?.(reservation.codigo); }} className="mt-3 block w-full rounded-lg bg-[#102747] py-3 text-center font-semibold text-white">Ver reserva completa</Link>
            </div>)}
          </section>
        </div>
      </aside>
    </div>}
    {reportar && <ReportarIncidencia rooms={rooms} selected={reportar.id} cerrar={() => setReportar(undefined)} creado={() => setReload(n => n + 1)} />}
  </div>;
}
