import { useEffect, useState } from 'react';
import type { HabitacionHotel, Reserva, Huesped, EstadoHabHotel, TipoHabitacion } from '@/lib/pms/types';
import { publicRoomForHotelType } from '@/data/publicRooms';
import { getRooms, markRoomDirty } from '@/lib/api/reception';
import { canMarkDirty, conditionLabels } from '@/lib/receptionPresentation';
import type { RoomState } from '@/lib/bff/contracts/reception';
interface Props { habitaciones: HabitacionHotel[]; reservas: Reserva[]; huespedes: Huesped[]; onCambiarEstado: (id: string, nuevo: EstadoHabHotel) => void; onVerReserva: (id: string) => void }
const control = 'min-w-0 rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]';
export default function HabitacionesRecepcion(_props: Props) {
  const [rooms, setRooms] = useState<RoomState[]>([]), [types, setTypes] = useState<RoomState['tipoHabitacion'][]>([]);
  const [occupancy, setOccupancy] = useState(''), [condition, setCondition] = useState(''), [type, setType] = useState(''), [floor, setFloor] = useState('');
  const [error, setError] = useState(''), [notice, setNotice] = useState(''), [loading, setLoading] = useState(false), [busy, setBusy] = useState<number | null>(null), [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setLoading(true); setError(''); setRooms([]);
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries({ ocupacion: occupancy, condicion: condition, tipoHabitacionId: type, piso: floor })) if (value) query.set(key, value);
    getRooms(query, controller.signal).then(value => { if (!controller.signal.aborted) { setRooms(value); setTypes(previous => Array.from(new Map([...previous, ...value.map(r => r.tipoHabitacion)].map(t => [t.id, t])).values()).sort((a, b) => a.id - b.id)); } }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [occupancy, condition, type, floor, reload]);
  async function dirty(room: RoomState) {
    if (busy !== null) return; setBusy(room.id); setError(''); setNotice('');
    try { await markRoomDirty(room.id); setNotice(`Habitación ${room.numero} marcada sucia en la simulación.`); setReload(n => n + 1); }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo actualizar la habitación.'); }
    finally { setBusy(null); }
  }
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] text-[#18345C]">
    <header className="border-b border-[#E5E0D8] bg-white px-4 py-4 sm:px-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><h1 className="text-[32px] font-semibold">Estado de habitaciones</h1><p className="text-sm text-[#52677F]">Datos de prueba del BFF. Se actualizan al abrir y al pulsar Actualizar.</p></div><button className={control} disabled={loading || busy !== null} onClick={() => setReload(n => n + 1)}>Actualizar</button></div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-sm">Ocupación<select aria-label="Ocupación" className={`${control} w-full`} value={occupancy} onChange={e => setOccupancy(e.target.value)}><option value="">Todas</option><option value="LIBRE">Libre</option><option value="OCUPADA">Ocupada</option></select></label>
        <label className="text-sm">Condición<select aria-label="Condición" className={`${control} w-full`} value={condition} onChange={e => setCondition(e.target.value)}><option value="">Todas</option>{Object.entries(conditionLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
        <label className="text-sm">Tipo<select aria-label="Tipo" className={`${control} w-full`} value={type} onChange={e => setType(e.target.value)}><option value="">Todos</option>{types.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}</select></label>
        <label className="text-sm">Piso<select aria-label="Piso" className={`${control} w-full`} value={floor} onChange={e => setFloor(e.target.value)}><option value="">Todos</option>{[1, 2, 3].map(n => <option key={n} value={n}>{n}</option>)}</select></label>
      </div>
    </header>
    <div className="space-y-3 p-4 sm:p-6">{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3">{notice}</p>}{loading ? <p>Consultando habitaciones…</p> : !error && !rooms.length && <p className="rounded-xl bg-white p-6 text-center">No hay habitaciones que coincidan con los filtros.</p>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{rooms.map(room => <article key={room.id} data-room={room.numero} className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white">
        <img className="h-36 w-full object-cover" src={publicRoomForHotelType(room.tipoHabitacion.nombre as TipoHabitacion).image} alt={room.tipoHabitacion.nombre} />
        <div className="space-y-2 p-4"><h2 className="text-xl font-semibold">Habitación {room.numero}</h2><p>{room.tipoHabitacion.nombre} · Piso {room.piso}</p><p><span className="rounded bg-[#F8F6F0] px-2 py-1">{room.ocupacion === 'LIBRE' ? 'Libre' : 'Ocupada'}</span> · {conditionLabels[room.condicion]}</p>
          {room.llegaHoy && <p className="text-sm">Llega hoy</p>}{room.saleHoy && <p className="text-sm">Sale hoy</p>}{room.incidenciaPendiente && <p className="text-sm text-red-800">Incidencia pendiente</p>}
          {room.incidenciaBloqueante && <div className="rounded-lg bg-red-50 p-3 text-sm"><b>Incidencia bloqueante · solo lectura</b><p>{room.incidenciaBloqueante.descripcion}</p><p>{room.incidenciaBloqueante.estado}</p></div>}
          {canMarkDirty(room) && <button className={control} disabled={busy !== null} onClick={() => void dirty(room)}>Marcar sucia</button>}
        </div>
      </article>)}</div>
    </div>
  </div>;
}