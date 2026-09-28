import { useState } from 'react';
import type { OrdenTrabajo, EstadoOT, PrioridadIncidencia } from '@/lib/pms/types';
import { formatoFecha } from '@/data/pms';
import { Chip, PRIORIDAD_META, ESTADO_OT_META, ORIGEN_LABEL, estaAtrasada, diasHastaFecha, esTerminalOT, Cabecera, Kpi, BotonFiltro, Vacio, PlusIcon, WrenchIcon, AlertIcon, } from '@/features/mantenimiento/pages/mantUtils';
const ORDEN_PRIORIDAD: Record<PrioridadIncidencia, number> = { alta: 0, media: 1, baja: 2 };
const ESTADOS: EstadoOT[] = ['abierta', 'en-proceso', 'resuelta', 'cerrada', 'cancelada'];
interface Props {
  ordenes: OrdenTrabajo[];
  onAbrirOrden: (id: string) => void;
  onNuevaOrden: () => void;
}
export default function OrdenesTrabajo({ ordenes, onAbrirOrden, onNuevaOrden }: Props) {
  const [fEstado, setFEstado] = useState<EstadoOT | 'todos' | 'activas'>('activas');
  const [fPrioridad, setFPrioridad] = useState<PrioridadIncidencia | 'todas'>('todas');
  const [soloAtrasadas, setSoloAtrasadas] = useState(false);
  const abiertas = ordenes.filter(o => o.estado === 'abierta');
  const enCurso = ordenes.filter(o => o.estado === 'asignada' || o.estado === 'en-proceso');
  const atrasadas = ordenes.filter(estaAtrasada);
  const cerradas = ordenes.filter(o => o.estado === 'cerrada');
  const visibles = ordenes
    .filter(o => {
      if (fEstado === 'todos')
        return true;
      if (fEstado === 'activas')
        return !esTerminalOT(o.estado);
      return o.estado === fEstado;
    })
    .filter(o => fPrioridad === 'todas' || o.prioridad === fPrioridad)
    .filter(o => !soloAtrasadas || estaAtrasada(o))
    .sort((a,
      b) => {
      const atrA = estaAtrasada(a) ? 0 : 1;
      const atrB = estaAtrasada(b) ? 0 : 1;
      if (atrA !== atrB)
        return atrA - atrB;
      const terA = esTerminalOT(a.estado) ? 1 : 0;
      const terB = esTerminalOT(b.estado) ? 1 : 0;
      if (terA !== terB)
        return terA - terB;
      return ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad];
    });
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <Cabecera titulo="Tareas de mantenimiento" subtitulo={`${ordenes.length} tareas registradas`}>
      <button
        onClick={onNuevaOrden}
        className="flex items-center gap-2 px-4 py-2.5 min-h-[44px] text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
        <PlusIcon /> Nueva tarea
      </button>
    </Cabecera>

    <div className="px-4 sm:px-6 pt-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi valor={String(abiertas.length)} label="Pendientes de iniciar" color={abiertas.length ? '#9A3412' : '#166534'} />
        <Kpi valor={String(enCurso.length)} label="En curso" />
        <Kpi valor={String(atrasadas.length)} label="Atrasadas" color={atrasadas.length ? '#991B1B' : '#166534'} />
        <Kpi valor={String(cerradas.length)} label="Cerradas" color="#166534" />
      </div>
    </div>

    {atrasadas.length > 0 && (<div className="px-4 sm:px-6 pt-5">
      <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl px-4 py-3">
        <p className="text-[13px] font-semibold text-[#991B1B] flex items-center gap-2">
          <AlertIcon /> Trabajos atrasados ({atrasadas.length})
        </p>
        <p className="text-[13px] text-[#7F1D1D] mt-1">
          {atrasadas.map(o => `${o.codigo} · ${o.ubicacion}`).join(' · ')}
        </p>
      </div>
    </div>)}

    <div className="px-4 sm:px-6 pt-5 space-y-2">
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] text-[#AEBCC1] uppercase tracking-widest w-full sm:w-auto sm:mr-1">Estado</span>
        <BotonFiltro activo={fEstado === 'activas'} onClick={() => setFEstado('activas')}>En curso</BotonFiltro>
        <BotonFiltro activo={fEstado === 'todos'} onClick={() => setFEstado('todos')}>Todas</BotonFiltro>
        {ESTADOS.map(e => (<BotonFiltro key={e} activo={fEstado === e} onClick={() => setFEstado(e)}>
          {ESTADO_OT_META[e].label}
        </BotonFiltro>))}
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-[11px] text-[#AEBCC1] uppercase tracking-widest w-full sm:w-auto sm:mr-1">Prioridad</span>
        <BotonFiltro activo={fPrioridad === 'todas'} onClick={() => setFPrioridad('todas')}>Todas</BotonFiltro>
        {(['alta', 'media', 'baja'] as PrioridadIncidencia[]).map(p => (<BotonFiltro key={p} activo={fPrioridad === p} onClick={() => setFPrioridad(p)}>
          {PRIORIDAD_META[p].label}
        </BotonFiltro>))}
        <BotonFiltro activo={soloAtrasadas} onClick={() => setSoloAtrasadas(v => !v)}>Solo atrasadas</BotonFiltro>
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5">
      {visibles.length === 0 ? (<Vacio msg="Ningún trabajo coincide con los filtros seleccionados." />) : (<div className="space-y-3">
        {visibles.map(o => {
          const em = ESTADO_OT_META[o.estado];
          const pm = PRIORIDAD_META[o.prioridad];
          const atrasada = estaAtrasada(o);
          const dias = diasHastaFecha(o.fechaCompromiso);
          return (<div key={o.id} className={`bg-white border rounded-xl overflow-hidden ${atrasada ? 'border-[#FCA5A5]' : 'border-[#E5E0D8]'}`}>
            <button onClick={() => onAbrirOrden(o.id)} className="w-full text-left px-4 py-4 hover:bg-[#FCFBF8] transition-colors">
              <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#F8F6F0', color: em.dot }}>
                  <WrenchIcon size={18} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-[17px] font-bold text-[#18345C] leading-none">
                      {o.codigo}
                    </p>
                    <Chip cls={em.chip}>
                      {em.label}
                    </Chip>
                    <Chip cls={pm.chip}>
                      {pm.label}
                    </Chip>
                    {atrasada && <Chip cls="bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">Atrasada</Chip>}
                    {o.impideUso && !esTerminalOT(o.estado) && (<Chip cls="bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">Impide el uso</Chip>)}
                  </div>

                  <p className="text-[15px] font-medium text-[#18345C] mt-2">
                    {o.esHabitacion ? `Habitación ${o.ubicacion}` : o.ubicacion} · {o.tipo}
                  </p>
                  <p className="text-[14px] text-[#6B7280] mt-0.5 line-clamp-2">
                    {o.descripcion}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap mt-2 text-[12px] text-[#AEBCC1]">
                    <span>
                      {ORIGEN_LABEL[o.origen]}
                    </span>
                    <span>
                      Compromiso: {formatoFecha(o.fechaCompromiso)}
                      {!esTerminalOT(o.estado) && o.estado !== 'resuelta' && (<span className={atrasada ? 'text-[#991B1B] font-semibold' : ''}>
                        {atrasada
                          ? ` · ${Math.abs(dias)} día${Math.abs(dias) === 1 ? '' : 's'} de retraso`
                          : dias === 0
                            ? ' · hoy'
                            : ` · en ${dias} día${dias === 1 ? '' : 's'}`}
                      </span>)}
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {!esTerminalOT(o.estado) && (<div className="px-4 pb-4 flex gap-2 flex-wrap">
              <button
                onClick={() => onAbrirOrden(o.id)}
                className="flex-1 sm:flex-none px-4 py-2.5 min-h-[44px] text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
                Ver detalles
              </button>
            </div>)}
          </div>);
        })}
      </div>)}
    </div>

  </div>);
}
