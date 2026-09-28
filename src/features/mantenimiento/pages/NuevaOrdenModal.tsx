import { useState } from 'react';
import type { Activo, TipoAveria, PrioridadIncidencia } from '@/lib/pms/types';
import { HABITACIONES_HOTEL } from '@/data/pms';
import { Campo, INPUT_CLS, PRIORIDAD_META, TIPOS_AVERIA, Modal } from '@/features/mantenimiento/pages/mantUtils';
interface Props {
  activos: Activo[];
  onCerrar: () => void;
  onGuardar: (datos: {
    ubicacion: string;
    esHabitacion: boolean;
    tipo: TipoAveria;
    descripcion: string;
    prioridad: PrioridadIncidencia;
    impideUso: boolean;
    activoId?: string;
  }) => void;
}
export default function NuevaOrdenModal({ activos, onCerrar, onGuardar }: Props) {
  const [esHabitacion, setEsHabitacion] = useState(true);
  const [piso, setPiso] = useState('1');
  const [habitacion, setHabitacion] = useState('');
  const [areas, setAreas] = useState<string[]>([]);
  const [otraArea, setOtraArea] = useState('');
  const area = areas.includes('Otros') ? [...areas.filter(x => x !== 'Otros'), otraArea.trim()].filter(Boolean).join(', ') : areas.join(', ');
  const [tipo, setTipo] = useState<TipoAveria | ''>('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>('media');
  const [impideUso, setImpideUso] = useState(false);
  const [activoId, setActivoId] = useState('');
  const [errores, setErrores] = useState<{
    ubicacion?: string;
    tipo?: string;
    descripcion?: string;
  }>({});
  const activosUbicacion = activos.filter((activo) => {
    const objetivo = esHabitacion ? `Habitación ${habitacion}` : area.trim();
    return Boolean(objetivo) && activo.ubicacion.toLowerCase() === objetivo.toLowerCase();
  });
  function guardar() {
    const ubicacion = esHabitacion ? habitacion : area.trim();
    const e: typeof errores = {};
    if (!ubicacion)
      e.ubicacion = esHabitacion ? 'Elige la habitación.' : 'Indica el área.';
    if (!tipo)
      e.tipo = 'Selecciona el tipo de avería.';
    if (!descripcion.trim())
      e.descripcion = 'Describe el problema detectado.';
    setErrores(e);
    if (Object.keys(e).length > 0)
      return;
    onGuardar({
      ubicacion,
      esHabitacion,
      tipo: tipo as TipoAveria,
      descripcion: descripcion.trim(),
      prioridad,
      impideUso: esHabitacion && impideUso,
      activoId: activoId || undefined,
    });
  }
  return (<Modal titulo="Registrar avería" onCerrar={onCerrar} ancho="sm:max-w-lg">
    <div className="space-y-4">

      <Campo label="¿Dónde está la avería?">
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEsHabitacion(true);
              setErrores(x => ({ ...x, ubicacion: undefined }));
            }}
            className={`flex-1 px-4 py-2.5 min-h-[44px] text-[14px] font-medium rounded-md border transition-colors ${esHabitacion
              ? 'bg-[#18345C] text-white border-[#18345C]'
              : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
            Habitación
          </button>
          <button
            onClick={() => {
              setEsHabitacion(false);
              setImpideUso(false);
              setErrores(x => ({ ...x, ubicacion: undefined }));
            }}
            className={`flex-1 px-4 py-2.5 min-h-[44px] text-[14px] font-medium rounded-md border transition-colors ${!esHabitacion
              ? 'bg-[#18345C] text-white border-[#18345C]'
              : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
            Área común
          </button>
        </div>
      </Campo>

      {esHabitacion ? (<div className="grid grid-cols-2 gap-3">
        <Campo label="Piso">
          <select value={piso} onChange={e => {
            setPiso(e.target.value);
            setHabitacion('');
          }} className={INPUT_CLS}>
            {[1, 2, 3].map(n => <option key={n} value={String(n)}>Piso {n}</option>)}
          </select>
        </Campo>
        <Campo label="Habitación" error={errores.ubicacion}>
          <select
            value={habitacion}
            onChange={e => {
              setHabitacion(e.target.value);
              setErrores(x => ({ ...x, ubicacion: undefined }));
            }}
            className={INPUT_CLS}>
            <option value="">Seleccionar…</option>
            {HABITACIONES_HOTEL.filter(n => String(n).startsWith(piso)).map(n => <option key={n} value={n}>Habitación {n}</option>)}
          </select>
        </Campo>
      </div>) : (<Campo label="Área" error={errores.ubicacion}>
        <div className="flex flex-wrap gap-2">
          {['Restaurante', 'Piscina', 'Sótano', 'Gimnasio', 'Spa', 'Otros'].map(a => <button
            type="button"
            key={a}
            onClick={() => setAreas(v => v.includes(a) ? v.filter(x => x !== a) : [...v, a])}
            className={`rounded-lg border px-3 py-2 text-sm ${areas.includes(a) ? 'border-[#18345C] bg-[#EEF4FB] text-[#18345C]' : 'border-[#E5E0D8] bg-white text-[#52677F]'}`}>
            {a}
          </button>)}
        </div>
        {areas.includes('Otros') && <input value={otraArea} onChange={e => setOtraArea(e.target.value)} className={`${INPUT_CLS} mt-2`} placeholder="Especificar área" />}
      </Campo>)}

      <Campo label="Tipo de daño" error={errores.tipo}>
        <select
          value={tipo}
          onChange={e => {
            setTipo(e.target.value as TipoAveria);
            setErrores(x => ({ ...x, tipo: undefined }));
          }}
          className={INPUT_CLS}>
          <option value="">Seleccionar…</option>
          {TIPOS_AVERIA.map(t => (<option key={t} value={t}>
            {t}
          </option>))}
        </select>
      </Campo>

      <Campo label="Descripción" error={errores.descripcion}>
        <textarea
          value={descripcion}
          onChange={e => {
            setDescripcion(e.target.value);
            setErrores(x => ({ ...x, descripcion: undefined }));
          }}
          rows={3}
          className={INPUT_CLS}
          placeholder="Qué falla y desde cuándo" />
      </Campo>

      <Campo label="Equipo relacionado">
        {activosUbicacion.length > 0 ? <select value={activoId} onChange={e => setActivoId(e.target.value)} className={INPUT_CLS}>
          <option value="">Ninguno</option>
          {activosUbicacion.map(a => <option key={a.id} value={a.id}>
            {a.nombre}
          </option>)}
        </select> : null}
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

      {esHabitacion && (<button
        onClick={() => setImpideUso(v => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-lg border text-left transition-colors ${impideUso ? 'bg-[#FEF2F2] border-[#FCA5A5]' : 'bg-white border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
        <span className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${impideUso ? 'bg-[#991B1B] border-[#991B1B]' : 'border-[#AEBCC1]'}`}>
          {impideUso && (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>)}
        </span>
        <span className="flex-1">
          <span className={`text-[14px] font-medium block ${impideUso ? 'text-[#991B1B]' : 'text-[#1F2933]'}`}>
            Impide el uso de la habitación
          </span>
        </span>
      </button>)}

      <div className="flex flex-wrap justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCerrar}
          className="min-h-[44px] rounded-md border border-[#E5E0D8] px-4 py-2.5 text-[14px] font-semibold text-[#6B7280] transition-colors hover:bg-[#F8F6F0]">
          Cancelar
        </button>
        <button
          type="button"
          onClick={guardar}
          className="min-h-[44px] rounded-md bg-[#18345C] px-4 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#102747]">
          Registrar tarea
        </button>
      </div>
    </div>
  </Modal>);
}
