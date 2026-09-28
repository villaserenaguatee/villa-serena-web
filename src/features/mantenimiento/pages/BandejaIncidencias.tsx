import { useState } from 'react';
import type { Incidencia, OrdenTrabajo, PrioridadIncidencia, AreaSolicitud, EstadoIncidencia, HabitacionHotel } from '@/lib/pms/types';
import { publicRoomForHotelType } from '@/data/publicRooms';
import { Chip, Campo, INPUT_CLS, PRIORIDAD_META, Cabecera, Kpi, BotonFiltro, Vacio, Modal, AlertIcon, BedIcon, ClockIcon, } from '@/features/mantenimiento/pages/mantUtils';
const AREAS: AreaSolicitud[] = ['Limpieza', 'Recepción', 'Room Service', 'Mantenimiento'];
const INC_META: Record<EstadoIncidencia, {
  label: string;
  chip: string;
}> = {
  'pendiente': { label: 'Sin atender', chip: 'bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]' },
  'en-proceso': { label: 'En proceso', chip: 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]' },
  'resuelta': { label: 'Resuelta', chip: 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]' },
};
const ORDEN_PRIORIDAD: Record<PrioridadIncidencia, number> = { alta: 0, media: 1, baja: 2 };
interface Props {
  incidencias: Incidencia[];
  ordenes: OrdenTrabajo[];
  habitaciones: HabitacionHotel[];
  onGenerarOrden: (incidenciaId: string, prioridad: PrioridadIncidencia, descripcion: string) => void;
  onAbrirOrden: (ordenId: string) => void;
}
export default function BandejaIncidencias({ incidencias, ordenes, habitaciones, onGenerarOrden, onAbrirOrden }: Props) {
  const [fPrioridad, setFPrioridad] = useState<PrioridadIncidencia | 'todas'>('todas');
  const [fEstado, setFEstado] = useState<EstadoIncidencia | 'todos'>('todos');
  const [fArea, setFArea] = useState<AreaSolicitud | 'todas'>('todas');
  const [convertir, setConvertir] = useState<Incidencia | null>(null);
  const ordenDe = (id: string) => ordenes.find(o => o.incidenciaId === id) ?? null;
  const sinAtender = incidencias.filter(i => i.estado === 'pendiente' && !ordenDe(i.id));
  const alta = incidencias.filter(i => i.prioridad === 'alta' && i.estado !== 'resuelta');
  const bloquean = incidencias.filter(i => i.impideUso && i.estado !== 'resuelta');
  const visibles = incidencias
    .filter(i => fPrioridad === 'todas' || i.prioridad === fPrioridad)
    .filter(i => fEstado === 'todos' || i.estado === fEstado)
    .filter(i => fArea === 'todas' || (i.area ?? 'Limpieza') === fArea)
    .sort((a,
      b) => {
      const sinA = a.estado === 'pendiente' ? 0 : 1;
      const sinB = b.estado === 'pendiente' ? 0 : 1;
      if (sinA !== sinB)
        return sinA - sinB;
      return ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad];
    });
  const hayFiltro = fPrioridad !== 'todas' || fEstado !== 'todos' || fArea !== 'todas';
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <Cabecera titulo="Incidencias recibidas" subtitulo={`${sinAtender.length} sin atender de ${incidencias.length} reportadas`} />

    <div className="px-4 sm:px-6 pt-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi valor={String(incidencias.length)} label="Reportadas" />
        <Kpi valor={String(sinAtender.length)} label="Sin atender" color={sinAtender.length ? '#9A3412' : '#166534'} />
        <Kpi valor={String(alta.length)} label="Prioridad alta" color={alta.length ? '#991B1B' : '#166534'} />
        <Kpi valor={String(bloquean.length)} label="Impiden el uso" color={bloquean.length ? '#991B1B' : '#166534'} />
      </div>
    </div>

    {bloquean.length > 0 && (<div className="px-4 sm:px-6 pt-5">
      <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl px-4 py-3">
        <p className="text-[13px] font-semibold text-[#991B1B] flex items-center gap-2">
          <AlertIcon /> Habitaciones inhabilitadas ({bloquean.length})
        </p>
        <p className="text-[13px] text-[#7F1D1D] mt-1">
          {bloquean.map(i => `${i.habitacionNumero} · ${i.tipo}`).join(' · ')}
        </p>
      </div>
    </div>)}

    <div className="px-4 sm:px-6 pt-5 space-y-2">
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] text-[#AEBCC1] uppercase tracking-widest w-full sm:w-auto sm:mr-1">Prioridad</span>
        <BotonFiltro activo={fPrioridad === 'todas'} onClick={() => setFPrioridad('todas')}>Todas</BotonFiltro>
        {(['alta', 'media', 'baja'] as PrioridadIncidencia[]).map(p => (<BotonFiltro key={p} activo={fPrioridad === p} onClick={() => setFPrioridad(p)}>
          {PRIORIDAD_META[p].label}
        </BotonFiltro>))}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] text-[#AEBCC1] uppercase tracking-widest w-full sm:w-auto sm:mr-1">Estado</span>
        <BotonFiltro activo={fEstado === 'todos'} onClick={() => setFEstado('todos')}>Todos</BotonFiltro>
        {(['pendiente', 'en-proceso', 'resuelta'] as EstadoIncidencia[]).map(e => (<BotonFiltro key={e} activo={fEstado === e} onClick={() => setFEstado(e)}>
          {INC_META[e].label}
        </BotonFiltro>))}
      </div>
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] text-[#AEBCC1] uppercase tracking-widest w-full sm:w-auto sm:mr-1">Reportado por</span>
        <BotonFiltro activo={fArea === 'todas'} onClick={() => setFArea('todas')}>Todas</BotonFiltro>
        {AREAS.map(a => (<BotonFiltro key={a} activo={fArea === a} onClick={() => setFArea(a)}>
          {a}
        </BotonFiltro>))}
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5">
      {visibles.length === 0 ? (<Vacio msg={hayFiltro
        ? 'Ninguna incidencia coincide con los filtros seleccionados.'
        : 'No hay incidencias reportadas. Las que registren Limpieza o Recepción aparecerán aquí.'} />) : (<div className="space-y-3">
          {visibles.map(inc => {
            const orden = ordenDe(inc.id);
            const pm = PRIORIDAD_META[inc.prioridad];
            const em = INC_META[inc.estado];
            const hab = habitaciones.find(h => h.numero === inc.habitacionNumero);
            const visual = hab ? publicRoomForHotelType(hab.tipo) : null;
            return (<div
              key={inc.id}
              className={`bg-white border rounded-xl px-4 py-4 ${inc.impideUso && inc.estado !== 'resuelta' ? 'border-[#FCA5A5]' : 'border-[#E5E0D8]'}`}>
              <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                {visual ? <img src={visual.image} alt={`Habitación ${hab?.numero}`} className="h-24 w-32 shrink-0 rounded-lg object-cover" /> : <div className="w-10 h-10 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0 text-[#18345C]">
                  <BedIcon size={18} />
                </div>}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[20px] font-semibold text-[#18345C] leading-none">
                      {hab ? `Piso ${hab.piso} · Habitación ${hab.numero}` : inc.habitacionNumero}
                    </p>
                    <Chip cls={pm.chip}>
                      {pm.label}
                    </Chip>
                    <Chip cls={em.chip}>
                      {em.label}
                    </Chip>
                    {inc.impideUso && inc.estado !== 'resuelta' && (<Chip cls="bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">Impide el uso</Chip>)}
                  </div>

                  <p className="text-[15px] font-medium text-[#18345C] mt-2">
                    {inc.tipo}
                  </p>
                  <p className="text-[14px] text-[#6B7280] mt-0.5">
                    {inc.descripcion}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap mt-2 text-[12px] text-[#AEBCC1]">
                    <span className="flex items-center gap-1">
                      <ClockIcon size={12} />
                      {inc.hora}
                    </span>
                    <span>Reportó: {inc.area ?? 'Limpieza'}</span>
                    {orden && <span className="text-[#1E40AF] font-semibold">
                      {orden.codigo}
                    </span>}
                  </div>
                </div>

                <div className="w-full sm:w-auto shrink-0">
                  {orden ? (<button
                    onClick={() => onAbrirOrden(orden.id)}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-[14px] font-semibold border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#18345C] hover:text-white transition-colors">
                    Ver detalles
                  </button>) : inc.estado === 'resuelta' ? (<div className="w-full sm:w-auto px-4 py-2.5 text-[14px] font-semibold text-[#166534] bg-[#F0FAF4] border border-[#86EFAC] rounded-md text-center">
                    ✓ Resuelta
                  </div>) : (<button
                    onClick={() => setConvertir(inc)}
                    className="w-full sm:w-auto px-4 py-2.5 min-h-[44px] text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
                    Atender incidencia
                  </button>)}
                </div>
              </div>
            </div>);
          })}
        </div>)}
    </div>

    {convertir && (<ModalConvertir
      incidencia={convertir}
      onCerrar={() => setConvertir(null)}
      onConfirmar={(prioridad, descripcion) => {
        onGenerarOrden(convertir.id, prioridad, descripcion);
        setConvertir(null);
      }} />)}
  </div>);
}
function ModalConvertir({ incidencia, onCerrar, onConfirmar, }: {
  incidencia: Incidencia;
  onCerrar: () => void;
  onConfirmar: (prioridad: PrioridadIncidencia, descripcion: string) => void;
}) {
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>(incidencia.prioridad);
  const [descripcion, setDescripcion] = useState(incidencia.descripcion);
  const [error, setError] = useState('');
  function guardar() {
    if (!descripcion.trim()) {
      setError('Describe el trabajo a realizar.');
      return;
    }
    onConfirmar(prioridad, descripcion.trim());
  }
  return (<Modal titulo="Atender incidencia" subtitulo={`${incidencia.habitacionNumero} · ${incidencia.tipo}`} onCerrar={onCerrar} ancho="sm:max-w-lg">
    <div className="space-y-4">
      <div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
        <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">Reporte original</p>
        <p className="text-[14px] text-[#1F2933] mt-1">
          {incidencia.descripcion}
        </p>
        <p className="text-[12px] text-[#AEBCC1] mt-1">
          {incidencia.area ?? 'Limpieza'} · {incidencia.hora}
        </p>
      </div>

      <Campo label="Descripción del trabajo" error={error}>
        <textarea
          value={descripcion}
          onChange={e => {
            setDescripcion(e.target.value);
            if (error)
              setError('');
          }}
          rows={3}
          className={INPUT_CLS}
          placeholder="Qué hay que reparar y cómo" />
      </Campo>

      <Campo label="Prioridad">
        <div className="flex gap-2 flex-wrap">
          {(['alta', 'media', 'baja'] as PrioridadIncidencia[]).map(p => (<button
            key={p}
            onClick={() => setPrioridad(p)}
            className={`px-4 py-2.5 min-h-[44px] text-[14px] font-medium rounded-md border transition-colors ${prioridad === p
              ? 'bg-[#18345C] text-white border-[#18345C]'
              : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
            {PRIORIDAD_META[p].label}
          </button>))}
        </div>
      </Campo>

      <div className="rounded-lg bg-[#F8F6F0] p-3">
        <p className="text-[10px] uppercase tracking-wider text-[#AEBCC1]">Compromiso</p>
        <p className="mt-1 text-sm font-semibold text-[#18345C]">
          {prioridad === 'alta' ? 'Hoy' : prioridad === 'media' ? 'Mañana' : 'En 3 días'}
        </p>
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={onCerrar}
          className="flex-1 px-4 py-3 min-h-[44px] text-[15px] font-semibold border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors">
          Cancelar
        </button>
        <button
          onClick={guardar}
          className="flex-1 px-4 py-3 min-h-[44px] text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          Atender incidencia
        </button>
      </div>
    </div>
  </Modal>);
}
