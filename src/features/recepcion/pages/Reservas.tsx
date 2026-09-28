import { useMemo, useState } from 'react';
import type { Reserva, Huesped, HabitacionHotel, EstadoReserva } from '@/lib/pms/types';
import { formatoFecha } from '@/data/pms';
import { Chip, RESERVA_META, BedIcon, SearchIcon, PlusIcon, CalendarIcon } from '@/features/recepcion/pages/recUtils';
import { publicRoomForHotelType } from '@/data/publicRooms';
interface Props {
  reservas: Reserva[];
  huespedes: Huesped[];
  habitaciones: HabitacionHotel[];
  onAbrir: (id: string) => void;
  onNueva: () => void;
}
const ESTADOS: (EstadoReserva | 'todos')[] = ['todos', 'pendiente', 'confirmada', 'en-curso', 'finalizada', 'cancelada'];
export default function Reservas({ reservas, huespedes, habitaciones, onAbrir, onNueva }: Props) {
  const [q, setQ] = useState('');
  const [buscarPor, setBuscarPor] = useState<'nombre' | 'codigo' | 'habitacion'>('nombre');
  const [estado, setEstado] = useState<EstadoReserva | 'todos'>('todos');
  const [fecha, setFecha] = useState('');
  const huespedDe = useMemo(() => {
    const m = new Map<string, Huesped>();
    huespedes.forEach(h => m.set(h.id, h));
    return m;
  }, [huespedes]);
  const filtradas = useMemo(() => {
    const term = q.trim().toLowerCase();
    return reservas
      .filter(r => {
        const h = huespedDe.get(r.huespedId);
        if (estado !== 'todos' && r.estado !== estado)
          return false;
        if (fecha && !(r.fechaEntrada <= fecha && fecha <= r.fechaSalida))
          return false;
        if (term) {
          const hab = habitaciones.find(x => x.id === r.habitacionId);
          const valor = buscarPor === 'codigo' ? r.codigo : buscarPor === 'habitacion' ? (hab?.numero ?? '') : (h?.nombre ?? '');
          if (!valor.toLowerCase().includes(term))
            return false;
        }
        return true;
      })
      .sort((a, b) => a.fechaEntrada.localeCompare(b.fechaEntrada));
  },
    [reservas, huespedDe, habitaciones, q, estado, fecha, buscarPor]);
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Reservas</h1>
          <p className="text-[15px] text-[#AEBCC1] mt-1">
            {filtradas.length}
            {filtradas.length === 1 ? 'reserva' : 'reservas'}
          </p>
        </div>
        <button
          onClick={onNueva}
          className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          <PlusIcon />
          Nueva reserva
        </button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select
          value={buscarPor}
          onChange={e => setBuscarPor(e.target.value as 'nombre' | 'codigo' | 'habitacion')}
          className="border border-[#E5E0D8] rounded-md px-3 py-2.5 text-sm bg-white">
          <option value="nombre">Nombre</option>
          <option value="codigo">Código</option>
          <option value="habitacion">Habitación</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#AEBCC1]">
            <SearchIcon size={15} />
          </span>
          <input
            type="text"
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder={`Buscar por ${buscarPor}…`}
            className="w-full border border-[#E5E0D8] rounded-md pl-9 pr-3 py-2.5 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white placeholder:text-[#AEBCC1]" />
        </div>
        <select
          value={estado}
          onChange={e => setEstado(e.target.value as EstadoReserva | 'todos')}
          className="border border-[#E5E0D8] rounded-md px-3 py-2.5 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white capitalize">
          {ESTADOS.map(s => (<option key={s} value={s}>
            {s === 'todos' ? 'Todos los estados' : s}
          </option>))}
        </select>
        <input
          type="date"
          value={fecha}
          onChange={e => setFecha(e.target.value)}
          className="border border-[#E5E0D8] rounded-md px-3 py-2.5 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white" />
        {(q || estado !== 'todos' || fecha) && (<button onClick={() => {
          setQ('');
          setEstado('todos');
          setFecha('');
        }} className="text-[13px] text-[#AEBCC1] hover:text-[#18345C] font-medium">
          Limpiar
        </button>)}
      </div>
      <div className="mt-4 grid gap-2 text-xs text-[#52677F] sm:grid-cols-2 lg:grid-cols-5">
        <EstadoAyuda nombre="Pendiente" texto="Requiere confirmar o asignar habitación" />
        <EstadoAyuda nombre="Confirmada" texto="Aún no se ha realizado el check-in" />
        <EstadoAyuda nombre="En curso" texto="Check-in realizado; falta el check-out" />
        <EstadoAyuda nombre="Finalizada" texto="Check-out completado" />
        <EstadoAyuda nombre="Cancelada" texto="No se hospedará; conserva el motivo" />
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5">
      {filtradas.length === 0 ? (<div className="bg-white border border-[#E5E0D8] rounded-xl p-6 text-center">
        <p className="text-[15px] text-[#AEBCC1]">No hay reservas que coincidan con la búsqueda.</p>
      </div>) : (<div className="space-y-3">
        {filtradas.map(r => {
          const h = huespedDe.get(r.huespedId);
          const hab = habitaciones.find(x => x.id === r.habitacionId);
          const meta = RESERVA_META[r.estado];
          const visual = imagenHabitacion(hab, r.tipoHabitacion);
          return (<button
            key={r.id}
            onClick={() => onAbrir(r.id)}
            className="w-full overflow-hidden text-left bg-white border border-[#E5E0D8] rounded-xl flex flex-col sm:flex-row items-stretch hover:border-[#18345C] transition-colors">
            <img src={visual} alt={hab ? `Habitación ${hab.numero}` : `Categoría ${r.tipoHabitacion}`} className="h-36 w-full object-cover sm:h-auto sm:w-44" />
            <div className="flex flex-1 min-w-0 items-center gap-4 p-4">
              <div className="w-11 h-11 rounded-lg bg-[#F8F6F0] flex flex-col items-center justify-center shrink-0 text-[#18345C]">
                <BedIcon size={16} />
                <span className="text-[11px] font-bold mt-0.5">
                  {hab?.numero ?? '—'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[16px] font-semibold text-[#18345C]">
                    {h?.nombre ?? 'Huésped'}
                  </p>
                  <Chip cls={meta.chip}>
                    {meta.label}
                  </Chip>
                </div>
                <p className="text-[13px] text-[#6B7280] mt-1">
                  {r.codigo} · Habitación {hab?.numero ?? 'sin asignar'} · {h?.tipoDocumento} •••• {h?.documento.slice(-4)}
                </p>
                <p className="text-[13px] text-[#AEBCC1] mt-1 flex items-center gap-1.5 flex-wrap">
                  <CalendarIcon size={12} />
                  {formatoFecha(r.fechaEntrada)} → {formatoFecha(r.fechaSalida)} · {r.personas} pers. · {r.tipoHabitacion}
                </p>
                {r.estado === 'cancelada' && <p className="mt-2 rounded-md bg-[#FEF2F2] px-2.5 py-1.5 text-xs text-[#991B1B]">
                  <b>Motivo:</b>
                  {r.motivoCancelacion || 'No se registró un motivo.'}
                </p>}
              </div>
              <span className="text-[13px] text-[#18345C] font-semibold shrink-0">Ver ›</span>
            </div>
          </button>);
        })}
      </div>)}
    </div>
  </div>);
}
function EstadoAyuda({ nombre, texto }: {
  nombre: string;
  texto: string;
}) {
  return <div className="rounded-lg bg-[#F8F6F0] px-3 py-2">
    <b className="block text-[#18345C]">
      {nombre}
    </b>
    {texto}
  </div>;
}
function imagenHabitacion(hab: HabitacionHotel | undefined, tipo: Reserva['tipoHabitacion']) {
  return publicRoomForHotelType(hab?.tipo ?? tipo).image;
}
