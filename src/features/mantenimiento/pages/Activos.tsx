import CategoriaActivoSelect from "./CategoriaActivoSelect";
import { useState } from 'react';
import {validPublicDate} from '@/lib/publicStayValidation';
import type { Activo, OrdenTrabajo, CategoriaActivo, EstadoActivo } from '@/lib/pms/types';
import { formatoFecha } from '@/data/pms';
import { Chip, dinero, ACTIVO_META, ESTADO_OT_META, costoRepuestos, Kpi, Vacio, Modal, BoxIcon, } from '@/features/mantenimiento/pages/mantUtils';
const UMBRAL_RECURRENTE = 2;
interface Props {
  activos: Activo[];
  ordenes: OrdenTrabajo[];
  onCambiarEstado: (id: string, estado: EstadoActivo) => void;
  onAbrirOrden: (id: string) => void;
  onAgregarActivo: (a: Omit<Activo, 'id'>) => void | boolean | Promise<void | boolean>;
}
export default function Activos({ activos, ordenes, onCambiarEstado, onAbrirOrden, onAgregarActivo }: Props) {
  const [filtro, setFiltro] = useState<CategoriaActivo | 'todas'>('todas');
  const [detalle, setDetalle] = useState<Activo | null>(null);
  const [nuevo, setNuevo] = useState(false);
  const ordenesDe = (id: string) => ordenes.filter(o => o.activoId === id);
  const costoDe = (id: string) => ordenesDe(id).reduce((s, o) => s + costoRepuestos(o), 0);
  const operativos = activos.filter(a => a.estado === 'operativo');
  const fueraServicio = activos.filter(a => a.estado === 'fuera-servicio');
  const recurrentes = activos.filter(a => ordenesDe(a.id).length >= UMBRAL_RECURRENTE);
  const visibles = activos
    .filter(a => filtro === 'todas' || a.categoria === filtro)
    .sort((a, b) => ordenesDe(b.id).length - ordenesDe(a.id).length || a.nombre.localeCompare(b.nombre));
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div data-vs-page-header="mantenimiento" className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D8] bg-[#F8F6F0] px-4 py-5 sm:px-6">
      <div><h1 data-vs-page-title="mantenimiento" className="text-[32px] font-semibold text-[#18345C]">Activos y equipos</h1><p className="text-sm text-[#71839B]">{activos.length} equipos registrados</p></div>
      <button onClick={() => setNuevo(true)} className="rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white">+ Nuevo equipo</button>
    </div>

    <div className="px-4 sm:px-6 pt-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi valor={String(activos.length)} label="Equipos" />
        <Kpi valor={String(operativos.length)} label="Operativos" />
        <Kpi valor={String(fueraServicio.length)} label="Fuera de servicio" />
        <Kpi valor={String(recurrentes.length)} label="Con fallas repetidas" />
      </div>
    </div>

    <div className="px-4 sm:px-6 pt-5 flex gap-2 flex-wrap">
      <div className="w-full sm:w-[220px]"><span className="text-sm font-medium text-[#18345C]">Categoría</span><CategoriaActivoSelect value={filtro} onChange={setFiltro} incluirTodas/></div>
    </div>

    <div className="px-4 sm:px-6 py-5">
      {visibles.length === 0 ? (<Vacio msg="No hay equipos en esta categoría." />) : (<div className="grid gap-3 sm:grid-cols-2">
        {visibles.map(a => {
          const intervenciones = ordenesDe(a.id).length;
          const am = ACTIVO_META[a.estado];
          return (<button
            key={a.id}
            onClick={() => setDetalle(a)}
            className="bg-white border border-[#E5E0D8] rounded-xl px-4 py-4 text-left hover:border-[#18345C] transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0 text-[#18345C]">
                <BoxIcon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-[#18345C] leading-tight">
                  {a.nombre}
                </p>
                <p className="text-[13px] text-[#6B7280] mt-0.5">{a.ubicacion} · {a.categoria}</p>

                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <Chip cls={am.chip}>
                    {am.label}
                  </Chip>
                  {intervenciones >= UMBRAL_RECURRENTE && (<Chip cls="bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]">Recurrente</Chip>)}
                </div>

                <p className="text-[12px] text-[#AEBCC1] mt-2">
                  {intervenciones} intervención{intervenciones === 1 ? '' : 'es'}
                  {costoDe(a.id) > 0 && ` · ${dinero(costoDe(a.id))} en repuestos`}
                </p>
              </div>
            </div>
          </button>);
        })}
      </div>)}
    </div>

    {nuevo && <NuevoActivo onCerrar={() => setNuevo(false)} onGuardar={async a => {
      if(await onAgregarActivo(a)===false)return false;
      setNuevo(false);
    }} />}

    {detalle && (<ModalActivo
      activo={detalle}
      ordenes={ordenesDe(detalle.id)}
      costo={costoDe(detalle.id)}
      onCerrar={() => setDetalle(null)}
      onCambiarEstado={estado => onCambiarEstado(detalle.id, estado)}
      onAbrirOrden={id => {
        setDetalle(null);
        onAbrirOrden(id);
      }} />)}
  </div>);
}
function ModalActivo({ activo, ordenes, costo, onCerrar, onCambiarEstado, onAbrirOrden, }: {
  activo: Activo;
  ordenes: OrdenTrabajo[];
  costo: number;
  onCerrar: () => void;
  onCambiarEstado: (estado: EstadoActivo) => void;
  onAbrirOrden: (id: string) => void;
}) {
  const estados: EstadoActivo[] = ['operativo', 'en-reparacion', 'fuera-servicio'];
  return (<Modal titulo={activo.nombre} subtitulo={`${activo.ubicacion} · ${activo.categoria}`} onCerrar={onCerrar}>
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">Marca</p>
          <p className="text-[14px] font-medium text-[#1F2933] mt-0.5">
            {activo.marca || activo.marcaModelo || '—'}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">Instalado</p>
          <p className="text-[14px] font-medium text-[#1F2933] mt-0.5">
            {formatoFecha(activo.instaladoEn)}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">Intervenciones</p>
          <p className="text-[14px] font-medium text-[#1F2933] mt-0.5">
            {ordenes.length}
          </p>
        </div>
        <div>
          <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">Costo acumulado</p>
          <p className="text-[14px] font-medium text-[#1F2933] mt-0.5">
            {dinero(costo)}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest mb-2">Estado del equipo</p>
        <div className="flex gap-2 flex-wrap">
          {estados.map(e => (<button
            key={e}
            onClick={() => onCambiarEstado(e)}
            className={`px-4 py-2.5 min-h-[44px] text-[14px] font-medium rounded-md border transition-colors ${activo.estado === e
              ? 'bg-[#18345C] text-white border-[#18345C]'
              : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
            {ACTIVO_META[e].label}
          </button>))}
        </div>
      </div>

      <div>
        <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest mb-2">Historial de trabajos</p>
        {ordenes.length === 0 ? (<p className="text-[14px] text-[#AEBCC1]">Este equipo aún no tiene trabajos registrados.</p>) : (<div className="space-y-2">
          {ordenes.map(o => {
            const em = ESTADO_OT_META[o.estado];
            return (<button
              key={o.id}
              onClick={() => onAbrirOrden(o.id)}
              className="w-full flex items-center gap-3 bg-white border border-[#E5E0D8] rounded-lg px-3 py-3 min-h-[44px] text-left hover:border-[#18345C] transition-colors">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: em.dot }} />
              <span className="flex-1 min-w-0">
                <span className="text-[14px] font-semibold text-[#18345C] block">
                  {o.codigo}
                </span>
                <span className="text-[13px] text-[#6B7280] block truncate">
                  {o.descripcion}
                </span>
              </span>
              <Chip cls={em.chip}>
                {em.label}
              </Chip>
            </button>);
          })}
        </div>)}
      </div>
    </div>
  </Modal>);
}
function NuevoActivo({ onCerrar, onGuardar }: {
  onCerrar: () => void;
  onGuardar: (a: Omit<Activo, 'id'>) => void;
}) {
  const [nombre, setNombre] = useState(''),
    [categoria, setCategoria] = useState<CategoriaActivo>('Climatización'),
    [ubicacion, setUbicacion] = useState(''),
    [marca, setMarca] = useState(''),
    [modelo, setModelo] = useState(''),
    [fecha, setFecha] = useState(''),
    [costo, setCosto] = useState(''),
    [estado, setEstado] = useState<EstadoActivo>('operativo');
  const pref: Record<string, string> = {
    'Climatización': 'CLI',
    'Electricidad': 'ELE',
    'Fontanería': 'FON',
    'Mobiliario': 'MOB',
    'Ascensores': 'ASC',
    'Cocina': 'COC',
    'Refrigeración': 'REF',
    'Equipos de Spa': 'SPA',
    'Gimnasio': 'GIM',
    'Piscina': 'PIS',
    'Seguridad': 'SEG',
    'Lavandería': 'LAV',
    'Otros': 'OTR'
  };
    const codigo = `${pref[categoria] || 'ACT'}-${String(Date.now()).slice(-3)}`;
    const [validationError,setValidationError]=useState('');
  const cls = 'mt-1 w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2.5 outline-none focus:border-[#B8C4D0]';
  return <Modal titulo="Nuevo equipo" onCerrar={onCerrar}>
    <div className="grid gap-3 sm:grid-cols-2">
      <label>Nombre *<input className={cls} value={nombre} onChange={e => setNombre(e.target.value)} /></label>
      <div><span>Categoría *</span><CategoriaActivoSelect value={categoria} onChange={v=>setCategoria(v as CategoriaActivo)}/></div>
      <label>Ubicación *<input className={cls} value={ubicacion} onChange={e => setUbicacion(e.target.value)} /></label>
      <label>Marca<input className={cls} value={marca} onChange={e => setMarca(e.target.value)} /></label>
      <label>Modelo<input className={cls} value={modelo} onChange={e => setModelo(e.target.value)} /></label>
      <label>Fecha de instalación *<input type="date" className={cls} value={fecha} onChange={e => setFecha(e.target.value)} /></label>
        <label>Costo<span className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#18345C]">Q</span><input type="number" min="0" step="0.01" inputMode="decimal" className={`${cls} pl-8`} value={costo} onChange={e => {setCosto(e.target.value);setValidationError('');}} /></span></label>
      <label>Estado<select className={cls} value={estado} onChange={e => setEstado(e.target.value as EstadoActivo)}>
        <option value="operativo">Operativo</option>
        <option value="en-reparacion">En reparación</option>
        <option value="fuera-servicio">Fuera de servicio</option>
      </select></label>
    </div>
      {validationError&&<p role="alert" className="mt-3 text-red-800">{validationError}</p>}
      <div data-vs-actions="compact" className="mt-5 flex justify-end gap-2">
      <button onClick={onCerrar} className="rounded-lg border border-[#E5E0D8] px-4 py-2">Cancelar</button>
      <button
        disabled={!nombre.trim() || !ubicacion.trim() || !fecha}
          onClick={() => {
            if(!validPublicDate(fecha)||!Number.isFinite(Number(costo))||Number(costo)<0){setValidationError('Revisa la fecha y utiliza un costo válido mayor o igual a cero.');return;}
            onGuardar({
          nombre: nombre.trim(),
          categoria,
          ubicacion: ubicacion.trim(),
          marca,
          modelo,
          marcaModelo: [marca, modelo].filter(Boolean).join(' ') || '—',
          codigo,
          costo: Number(costo) || 0,
          instaladoEn: fecha,
          estado
          });}}
        className="rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white disabled:opacity-40">Guardar equipo</button>
    </div>
  </Modal>;
}
