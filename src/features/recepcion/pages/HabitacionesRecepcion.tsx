import { useState } from 'react';
import { publicRoomForHotelType, money } from '@/data/publicRooms';
import type { HabitacionHotel, Reserva, Huesped, EstadoHabHotel } from '@/lib/pms/types';
import { formatoFecha } from '@/data/pms';
import { Chip, HAB_META, HAB_TRANSICIONES, validarCambioEstadoHab, BedIcon, } from '@/features/recepcion/pages/recUtils';
interface Props {
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  huespedes: Huesped[];
  onCambiarEstado: (habId: string, nuevo: EstadoHabHotel) => void;
  onVerReserva: (reservaId: string) => void;
}
const ESTADOS: EstadoHabHotel[] = ['disponible', 'reservada', 'ocupada', 'en-limpieza', 'mantenimiento'];
export default function HabitacionesRecepcion({ habitaciones, reservas, huespedes, onCambiarEstado, onVerReserva }: Props) {
  const [filtro, setFiltro] = useState<EstadoHabHotel | 'todas'>('todas');
  const [aviso, setAviso] = useState<string>('');
  const [seleccionada, setSeleccionada] = useState<HabitacionHotel | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [piso, setPiso] = useState<'todos' | 1 | 2 | 3>('todos');
  const conteo = (e: EstadoHabHotel) => habitaciones.filter(h => h.estado === e).length;
  const visibles = habitaciones
    .filter(h => filtro === 'todas' || h.estado === filtro)
    .filter(h => piso === 'todos' || h.piso === piso)
    .filter(h => !busqueda || h.numero.includes(busqueda))
    .sort((a, b) => a.numero.localeCompare(b.numero));
  function intentarCambio(hab: HabitacionHotel,
    nuevo: EstadoHabHotel) {
    const error = validarCambioEstadoHab(hab, nuevo, reservas);
    if (error) {
      setAviso(`Habitación ${hab.numero}: ${error}`);
      return;
    }
    setAviso('');
    onCambiarEstado(hab.id, nuevo);
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Estado de habitaciones</h1>
      <p className="text-[15px] text-[#AEBCC1] mt-1">{habitaciones.length} habitaciones</p>

      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <div className="flex-1">
          <input
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar habitación..."
            className="w-full border border-[#E5E0D8] rounded-lg px-4 py-2.5 text-sm" />
        </div>
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        <BotonFiltro activo={piso === 'todos'} onClick={() => setPiso('todos')}>Todos los pisos</BotonFiltro>
        {([1, 2, 3] as const).map(n => <BotonFiltro key={n} activo={piso === n} onClick={() => setPiso(n)}>Piso {n}</BotonFiltro>)}
      </div>
      <div className="flex gap-2 flex-wrap mt-3">
        <BotonFiltro activo={filtro === 'todas'} onClick={() => setFiltro('todas')}>
          Todas ({habitaciones.length})
        </BotonFiltro>
        {ESTADOS.map(e => (<BotonFiltro key={e} activo={filtro === e} onClick={() => setFiltro(e)}>
          {HAB_META[e].label} ({conteo(e)})
        </BotonFiltro>))}
      </div>
    </div>

    {aviso && (<div className="mx-4 sm:mx-6 mt-4 bg-[#FEF2F2] border border-[#FCA5A5] text-[#991B1B] text-[13px] rounded-lg px-4 py-2.5">
      {aviso}
    </div>)}

    <div className="px-4 sm:px-6 py-5">
      <div className="space-y-8">
        {([1, 2, 3] as const).map(n => {
          const grupo = visibles.filter(h => h.piso === n);
          if (!grupo.length)
            return null;
          return <section key={n}>
            <div className="flex items-center gap-3 mb-3">
              <p className="text-[12px] tracking-[.18em] text-[#AEBCC1] font-semibold">PISO {n}</p>
              <div className="h-px bg-[#E5E0D8] flex-1" />
              <span className="text-xs text-[#AEBCC1]">{grupo.length} habitaciones</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {grupo.map(h => {
                const enCurso = reservas.find(r => r.habitacionId === h.id && r.estado === 'en-curso');
                const reservada = reservas.find(r => r.habitacionId === h.id && ['confirmada', 'pendiente'].includes(r.estado));
                const reserva = enCurso || reservada;
                const huesped = reserva ? huespedes.find(x => x.id === reserva.huespedId) : null;
                const meta = HAB_META[h.estado];
                const visual = publicRoomForHotelType(h.tipo);
                return (<button
                  key={h.id}
                  onClick={() => setSeleccionada(h)}
                  className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden text-left hover:shadow-md transition-shadow">
                  <div className="relative h-36">
                    <img src={visual.image} alt={`Habitación ${h.numero}`} className="w-full h-full object-cover" />
                    <span className={`absolute top-3 right-3 text-[10px] font-bold px-2 py-1 rounded-md ${meta.chip}`}>
                      {meta.label}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between gap-2">
                      <div>
                        <p className="text-[22px] font-bold text-[#18345C] leading-none">
                          {h.numero}
                        </p>
                        <p className="text-[12px] text-[#AEBCC1] mt-1">{visual.name} · Piso {h.piso}</p>
                      </div>
                      <span className="text-[#B38719] text-xs font-semibold">{money(visual.price)} / noche</span>
                    </div>
                    {reserva ? <div className="mt-3 pt-3 border-t text-[12px] text-[#6B7280]">
                      <p className="font-semibold text-[#18345C]">
                        {huesped?.nombre ?? 'Huésped'}
                      </p>
                      <p>{reserva.personas} huésped(es) · {formatoFecha(reserva.fechaEntrada)} → {formatoFecha(reserva.fechaSalida)}</p>
                    </div> : <p className="mt-3 pt-3 border-t text-[12px] text-[#6B7280]">Hasta {visual.capacity} huéspedes · {visual.beds}</p>}
                  </div>
                </button>);
              })}
            </div>
          </section>;
        })}
      </div>
    </div>
    {seleccionada && (() => {
      const h = seleccionada;
      const visual = publicRoomForHotelType(h.tipo);
      const r = reservas.find(x => x.habitacionId === h.id && ['en-curso', 'confirmada', 'pendiente'].includes(x.estado));
      const hu = r ? huespedes.find(x => x.id === r.huespedId) : null;
      return <div
        className="fixed inset-0 z-40 flex justify-end bg-black/20"
        onMouseDown={e => {
          if (e.target === e.currentTarget)
            setSeleccionada(null);
        }}>
        <aside className="h-full w-full overflow-y-auto bg-white shadow-2xl sm:w-[460px]">
          <div className="flex justify-between p-5">
            <div>
              <p className="text-xs tracking-widest text-[#B38719]">HABITACIÓN</p>
              <h2 className="text-2xl font-bold text-[#102747]">Habitación {h.numero}</h2>
            </div>
            <button onClick={() => setSeleccionada(null)} className="text-2xl">×</button>
          </div>
          <img src={visual.image} alt={`Habitación ${h.numero}`} className="h-60 w-full object-cover" />
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold text-[#102747]">
                {visual.name}
              </h3>
              <Chip cls={HAB_META[h.estado].chip}>
                {HAB_META[h.estado].label}
              </Chip>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#F8F6F0] p-4 text-sm">
              <DatoHabitacion etiqueta="Piso" valor={String(h.piso)} />
              <DatoHabitacion etiqueta="Camas" valor={visual.beds} />
              <DatoHabitacion etiqueta="Capacidad" valor={`Hasta ${visual.capacity} huéspedes`} />
              <DatoHabitacion etiqueta="Tamaño" valor={`${visual.size} m²`} />
            </div>
            <p className="mt-4 text-lg font-bold text-[#102747]">
              {money(visual.price)}
              <span className="text-xs font-normal text-[#71839B]">por noche</span>
            </p>
            {h.estado === 'disponible' && <EstadoHabitacion titulo="Habitación disponible" texto="Lista para asignarse a una nueva reserva." tono="verde" />}
            {h.estado === 'en-limpieza' && <EstadoHabitacion titulo="Limpieza en curso" texto="Pendiente de que el personal de limpieza finalice y libere la habitación." tono="naranja" />}
            {h.estado === 'mantenimiento' && <EstadoHabitacion
              titulo="En mantenimiento"
              texto="Habitación bloqueada por Mantenimiento. No puede asignarse hasta que el área la libere."
              tono="gris" />}
            {r && <div className="mt-6 border-t pt-5">
              <h4 className="font-semibold text-[#102747]">
                {h.estado === 'ocupada' ? 'Huésped actual' : 'Próximo huésped'}
              </h4>
              <div className="mt-3 rounded-xl border border-[#E5E0D8] p-4">
                <p className="font-semibold text-[#18345C]">
                  {hu?.nombre ?? 'Huésped'}
                </p>
                <p className="mt-1 text-sm text-[#52677F]">
                  {r.codigo}
                </p>
                <p className="text-sm text-[#52677F]">{formatoFecha(r.fechaEntrada)} → {formatoFecha(r.fechaSalida)}</p>
                <p className="text-sm text-[#52677F]">{r.personas} huésped(es)</p>
              </div>
              <button onClick={() => {
                setSeleccionada(null);
                onVerReserva(r.id);
              }} className="mt-3 w-full rounded-lg bg-[#102747] py-3 font-semibold text-white">Ver reserva completa</button>
            </div>}
            <div className="mt-6 border-t pt-5">
              <h4 className="mb-3 font-semibold text-[#102747]">Características</h4>
              <ul className="grid grid-cols-1 gap-2 text-sm text-gray-600 sm:grid-cols-2">
                {visual.features.slice(0, 6).map(x => <li key={x}>✓ {x}</li>)}
              </ul>
            </div>
          </div>
        </aside>
      </div>;
    })()}
  </div>);
}
function DatoHabitacion({ etiqueta, valor }: {
  etiqueta: string;
  valor: string;
}) {
  return <div>
    <p className="text-[10px] uppercase tracking-wider text-[#AEBCC1]">
      {etiqueta}
    </p>
    <p className="mt-1 font-semibold text-[#18345C]">
      {valor}
    </p>
  </div>;
}
function EstadoHabitacion({ titulo, texto, tono }: {
  titulo: string;
  texto: string;
  tono: 'verde' | 'naranja' | 'gris';
}) {
  const cls = tono === 'verde' ? 'border-[#86EFAC] bg-[#F0FAF4] text-[#166534]' : tono === 'naranja' ? 'border-[#FDBA74] bg-[#FFF7ED] text-[#9A3412]' : 'border-[#CBD5E1] bg-[#F1F5F9] text-[#475569]';
  return <div className={`mt-5 rounded-xl border p-4 ${cls}`}>
    <p className="font-semibold">
      {titulo}
    </p>
    <p className="mt-1 text-sm">
      {texto}
    </p>
  </div>;
}
function BotonFiltro({ activo, onClick, children, }: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (<button
    onClick={onClick}
    className={`text-[13px] font-medium px-3 py-1.5 rounded-md border transition-colors ${activo
      ? 'bg-[#18345C] text-white border-[#18345C]'
      : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
    {children}
  </button>);
}
