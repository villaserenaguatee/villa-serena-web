import RoomInformationDialog from './RoomInformationDialog';
import { useEffect, useMemo, useState } from 'react';
import type { HabitacionHotel, Reserva, Huesped, EstadoHabHotel } from '@/lib/pms/types';
import { formatoFecha } from '@/data/pms';
import { Chip, HAB_META, RESERVA_META, } from '@/features/recepcion/pages/recUtils';
import { BedIcon } from '@/features/admin/pages/adminUtils';
import { publicRoomForHotelType } from '@/data/publicRooms';
interface Props {
  conectado?: boolean;
  onEditarHabitacion?: (id:string)=>void;
  detalles?:Record<string,{descripcion?:string;fotos?:string[];servicios?:string[]}>;
  condiciones?:Record<string,string>;
  estadosCatalogo?:Record<string,string>;
  fotos?: Record<string,string>;
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  huespedes: Huesped[];
  onCambiarEstadoHab?: (id: string, estado: EstadoHabHotel) => void;
}
const ESTADOS: EstadoHabHotel[] = ['disponible', 'reservada', 'ocupada', 'en-limpieza', 'mantenimiento'];
export default function PanelHabitaciones({ habitaciones, reservas, huespedes, onCambiarEstadoHab, onEditarHabitacion, detalles, conectado=false, fotos, condiciones, estadosCatalogo, }: Props) {
  const [ahora, setAhora] = useState<Date | null>(null);
  const [piso, setPiso] = useState<'todos' | 1 | 2 | 3>('todos');
  const [filtro, setFiltro] = useState<EstadoHabHotel | 'todas'>('todas');
  const [editando,setEditando]=useState(false);
  const [seleccionada, setSeleccionada] = useState<HabitacionHotel | null>(null);
  useEffect(() => {
    setAhora(new Date());
    const t = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const huespedDe = useMemo(() => new Map(huespedes.map(h => [h.id, h])), [huespedes]);
  const conteo = (e: EstadoHabHotel) => habitaciones.filter(h => h.estado === e).length;
  const ocupacionPct = habitaciones.length
    ? Math.round((conteo('ocupada') / habitaciones.length) * 100)
    : 0;
  const visibles = habitaciones
    .filter(h => (piso === 'todos' || h.piso === piso) && (filtro === 'todas' || h.estado === filtro))
    .sort((a, b) => a.numero.localeCompare(b.numero));
  const tarjetaHabitacion = (h: HabitacionHotel) => {
    const enCurso = reservas.find(r => r.habitacionId === h.id && r.estado === 'en-curso');
    const proxima = reservas.find(r => r.habitacionId === h.id && (r.estado === 'confirmada' || r.estado === 'pendiente'));
    const huesped = enCurso ? huespedDe.get(enCurso.huespedId) : proxima ? huespedDe.get(proxima.huespedId) : null;
    const meta = HAB_META[h.estado];
    const visual = conectado ? (fotos?.[h.id]?{image:fotos[h.id]}:null) : publicRoomForHotelType(h.tipo);
    return <button
      type="button"
      key={h.id}
      onClick={() => {setEditando(false);setSeleccionada(h);}}
      className="text-left flex flex-col min-w-0 w-full bg-white border border-[#E5E0D8] rounded-xl p-3 hover:border-[#B38719] hover:shadow-md transition-shadow">
      {visual?.image ? <img src={visual.image} alt={`Habitación ${h.numero}`} className="w-full h-[88px] shrink-0 rounded-lg mb-2 object-cover" /> : <div className="flex h-[88px] shrink-0 w-full items-center justify-center gap-2 rounded-lg mb-2 bg-[#F8F6F0] text-sm text-[#6B7280]"><BedIcon size={24}/><span>Sin fotografía disponible</span></div>}
      <div>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0 text-[#18345C]">
              <BedIcon size={18} />
            </span>
              <p className="text-[28px] font-semibold text-[#18345C] leading-none">
                {h.numero}
              </p>
            </div>
              <p className="text-[14px] text-[#6B7280] mt-1 ml-10">{h.tipo} · Piso {h.piso}</p>
          </div>
          <Chip cls={meta.chip}>
            {conectado&&h.estado==='disponible'?'Libre':meta.label}
          </Chip>
        </div>
        {conectado&&condiciones?.[h.id]&&<p className="mt-3 border-t border-[#F0EBE3] pt-2 text-sm text-[#71839B]">{({LIMPIA:'Limpia',SUCIA:'Pendiente de limpieza',EN_LIMPIEZA:'En limpieza',FUERA_DE_SERVICIO:'Fuera de servicio'} as Record<string,string>)[condiciones[h.id]]??condiciones[h.id]}{estadosCatalogo?.[h.id]==='INACTIVO'?' · Inactiva':''}</p>}
        {(enCurso || proxima) && <p className="text-[12px] text-[#6B7280] mt-3 border-t border-[#F0EBE3] pt-2">
          {enCurso ? 'Ocupa: ' : 'Próxima: '}
          <span className="font-medium">
            {huesped?.nombre ?? 'Huésped'}
          </span>
          {enCurso ? ` · sale ${formatoFecha(enCurso.fechaSalida)}` : ` · entra ${formatoFecha(proxima!.fechaEntrada)}`}
        </p>}
      </div>
    </button>;
  };
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>

    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Mapa de habitaciones</h1>
          <p className="text-[14px] text-[#AEBCC1] mt-1">
            {conectado?'Datos del hotel':'Datos de este navegador'} · actualizado {ahora ? ahora.toLocaleTimeString() : '—'}
          </p>
        </div>
        <span className="flex items-center gap-2 text-[13px] text-[#166534] bg-[#F0FAF4] border border-[#86EFAC] rounded-md px-3 py-1.5">
          <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
          {conectado?'Hotel':'Local'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
        {ESTADOS.map(e => (<Kpi key={e} valor={conectado&&e==='reservada'?'—':conteo(e)} label={conectado&&e==='disponible'?'Libres':HAB_META[e].label} color={HAB_META[e].dot} />))}
        <Kpi valor={`${ocupacionPct}%`} label="Ocupación" color="#18345C" />
      </div>
    </div>

    <div className="px-4 sm:px-6 pt-5 flex gap-2 flex-wrap">
      {(['todos', 1, 2, 3] as const).map(p => (<BotonFiltro key={String(p)} activo={piso === p} onClick={() => setPiso(p)}>
        {p === 'todos' ? 'Todos los pisos' : `Piso ${p}`}
      </BotonFiltro>))}
      <span className="w-px bg-[#E5E0D8] mx-1" />
      <BotonFiltro activo={filtro === 'todas'} onClick={() => setFiltro('todas')}>Todos</BotonFiltro>
      {ESTADOS.filter(e=>!conectado||e!=='reservada').map(e => (<BotonFiltro key={e} activo={filtro === e} onClick={() => setFiltro(e)}>
        {conectado&&e==='disponible'?'Libres':HAB_META[e].label}
      </BotonFiltro>))}
    </div>

    <div className="px-4 sm:px-6 py-5 space-y-7">
      {([1, 2, 3] as const).filter(p => piso === 'todos' || piso === p).map(p => {
        const delPiso = visibles.filter(h => h.piso === p);
        if (!delPiso.length)
          return null;
        return <section key={p}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-[#18345C]">Piso {p}</h2>
            <span className="text-sm text-[#71839B]">{delPiso.length} habitaciones</span>
          </div>
          <div className="grid auto-rows-fr gap-3" style={{gridTemplateColumns:'repeat(auto-fill,minmax(min(100%,max(232px,calc((100% - 36px)/4))),1fr))'}} >
            {delPiso.map(tarjetaHabitacion)}
          </div>
        </section>;
      })}
    </div>

    {seleccionada&&!editando&&<RoomInformationDialog numero={seleccionada.numero} tipo={seleccionada.tipo} estado={conectado&&seleccionada.estado==='disponible'?'Libre':HAB_META[seleccionada.estado].label} piso={seleccionada.piso} capacidad={seleccionada.capacidad} precio={seleccionada.precioNoche} descripcion={detalles?.[seleccionada.id]?.descripcion} servicios={detalles?.[seleccionada.id]?.servicios} fotos={detalles?.[seleccionada.id]?.fotos??(fotos?.[seleccionada.id]?[fotos[seleccionada.id]]:[])} onClose={()=>setSeleccionada(null)} onEdit={onEditarHabitacion?()=>{onEditarHabitacion(seleccionada.id);setSeleccionada(null);}:onCambiarEstadoHab?()=>setEditando(true):undefined}/>}
    {seleccionada && editando && (<div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[#071D34]/50 sm:items-center sm:p-4"
      onMouseDown={e => {
        if (e.target === e.currentTarget)
          setSeleccionada(null);
      }}>
      <section data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="standard" className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-5">
        <button type="button" onClick={() => setSeleccionada(null)} className="absolute right-5 top-4 text-2xl text-[#71839B]">×</button>
        <div className="mb-4 pr-8">
          <p className="text-[11px]  tracking-widest text-[#B38719]">Mapa de habitaciones</p>
          <h2 className="text-2xl font-semibold text-[#18345C]">Habitación {seleccionada.numero}</h2>
          <p className="text-sm text-[#71839B]">Piso {seleccionada.piso} · {seleccionada.tipo}</p>
        </div>
        <div className="space-y-5">
          {(() => {
            const visual = conectado ? (fotos?.[seleccionada.id]?{image:fotos[seleccionada.id]}:null) : publicRoomForHotelType(seleccionada.tipo);
            return visual ? <img src={visual.image} alt={`Habitación ${seleccionada.numero}`} className="h-44 w-full rounded-xl object-cover" /> : null;
          })()}
          <div className="grid grid-cols-2 gap-3">
            <Kpi valor={`Piso ${seleccionada.piso}`} label="Ubicación" color="#18345C" />
            <Kpi valor={seleccionada.tipo} label="Categoría" color="#18345C" />
            <Kpi valor={String(seleccionada.capacidad)} label="Capacidad" color="#18345C" />
            <Kpi valor={`Q ${seleccionada.precioNoche.toLocaleString()}`} label="Precio por noche" color="#18345C" />
          </div>
          {onCambiarEstadoHab&&<div>
            <p className="mb-2 text-[11px] font-semibold  tracking-widest text-[#AEBCC1]">Cambiar estado de habitación</p>
            <p className="mb-3 text-sm text-[#71839B]">Administración puede actualizar el estado operativo desde este mapa.</p>
            <div className="flex flex-wrap gap-2">
              {ESTADOS.map(e => (<button
                key={e}
                type="button"
                onClick={() => {
                  onCambiarEstadoHab?.(seleccionada.id, e);
                  setSeleccionada(prev => prev ? { ...prev, estado: e } : prev);
                }}
                className={`rounded-lg border px-3 py-2 text-sm font-semibold ${seleccionada.estado === e ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E5E0D8] bg-white text-[#52677F]'}`}>
                {HAB_META[e].label}
              </button>))}
            </div>
          </div>}
        </div>
      </section>
    </div>)}
  </div>);
}
function Kpi({ valor, label, color }: {
  valor: number | string;
  label: string;
  color: string;
}) {
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <p className="text-[24px] font-bold leading-none" style={{ color }}>
      {valor}
    </p>
    <p className="text-[11px] text-[#6B7280] mt-1">
      {label}
    </p>
  </div>);
}
function BotonFiltro({ activo, onClick, children, }: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (<button
    onClick={onClick}
    className={`text-[13px] font-medium px-3 py-1.5 rounded-md border transition-colors ${activo ? 'bg-[#18345C] text-white border-[#18345C]' : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
    {children}
  </button>);
}
