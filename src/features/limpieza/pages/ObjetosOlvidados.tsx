import SelectPlaceholder from '@/components/common/SelectPlaceholder';
import PhotoPicker from '@/components/common/PhotoPicker';
import { useState } from 'react';
import type { Habitacion, ObjetoOlvidado } from '@/lib/pms/types';
import { generarId, horaActual } from '@/data/pms';
const fechaLocal = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
};
const mostrarFecha = (v: string) => /^\d{4}-\d{2}-\d{2}T/.test(v) ? new Date(v).toLocaleString('es-GT', { dateStyle: 'medium', timeStyle: 'short' }) : v;
interface FormNuevo {
  habitacionNumero: string;
  descripcion: string;
  fechaHora: string;
  observaciones: string;
  foto: string;
}
interface Props {
  mensajeError?:string;
  onEditar?: (obj: ObjetoOlvidado) => void | Promise<boolean>;
  objetos: ObjetoOlvidado[];
  habitaciones: Habitacion[];
  onRegistrar: (obj: ObjetoOlvidado) => void | Promise<boolean>;
}
export default function Objetos({ objetos, habitaciones, onRegistrar, mensajeError, onEditar }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState<ObjetoOlvidado | null>(null);
  const [tab, setTab] = useState<'resguardo' | 'devueltos'>('resguardo');
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState('');
  const visibles = objetos.filter(o => tab === 'devueltos' ? o.estado === 'devuelto' : o.estado !== 'devuelto');
  const [piso, setPiso] = useState('');
  const [form, setForm] = useState<FormNuevo>({
    habitacionNumero: '',
    descripcion: '',
    fechaHora: fechaLocal(),
    observaciones: '',
    foto: '',
  });
  const [errores, setErrores] = useState<Partial<FormNuevo>>({});
  function validar(): boolean {
    const e: Partial<FormNuevo> = {};
    if (!form.habitacionNumero)
      e.habitacionNumero = 'Selecciona una habitación';
    if (!form.descripcion.trim())
      e.descripcion = 'Describe el objeto';
    if(!form.fechaHora||Number.isNaN(new Date(form.fechaHora).getTime()))e.fechaHora='Indica una fecha y hora válidas.';
    setErrores(e);
    return Object.keys(e).length === 0;
  }
  function handleFoto(archivo: File) {
    if (!archivo)
      return;
    if(archivo.size>5*1024*1024||!['image/jpeg','image/png'].includes(archivo.type)){setErrores(e=>({...e,foto:'Usa JPEG o PNG de hasta 5 MiB.'}));return;}
    setErrores(e=>({...e,foto:undefined}));
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, foto: String(reader.result ?? '') }));
    };
    reader.readAsDataURL(archivo);
  }
  async function handleGuardar() {
    if (!validar())
      return;
    if (guardando || (editando && !onEditar)) return;
    setGuardando(true);
    setErrorGuardar('');
    try {
    const id = editando?.id ?? generarId();
    const result=await (editando ? onEditar! : onRegistrar)({
      ...editando,
      id,
      habitacionNumero: form.habitacionNumero,
      descripcion: form.descripcion.trim(),
      fechaHora: form.fechaHora.trim() || `Hoy, ${horaActual()}`,
      observaciones: form.observaciones.trim(),
      foto: form.foto || undefined,
      estado: editando?.estado ?? 'guardado',
      origen: 'limpieza',
    });
    if(result===false)return;
    setMostrarForm(false);
    setEditando(null);
    setForm({
      habitacionNumero: '',
      descripcion: '',
      fechaHora: fechaLocal(),
      observaciones: '',
      foto: '',
    });
    setErrores({});
    } catch {
      setErrorGuardar('No se pudo guardar el objeto. Conservamos los datos para que puedas intentarlo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div data-vs-page-header="limpieza" className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 data-vs-page-title="limpieza" className="text-[32px] font-semibold text-[#18345C] leading-tight">
            Objetos olvidados
          </h1>
        </div>
        <button
          onClick={() => { setEditando(null); setForm({ habitacionNumero: '', descripcion: '', fechaHora: fechaLocal(), observaciones: '', foto: '' }); setErrores({}); setErrorGuardar(''); setMostrarForm(true); }}
          className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors shrink-0">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Registrar objeto
        </button>
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5">
      <div className="mb-3 flex flex-wrap gap-2" role="tablist" aria-label="Estado de objetos">
        {(['resguardo', 'devueltos'] as const).map(t => <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={'rounded-lg border px-3 py-2 text-sm font-semibold ' + (tab === t ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E5E0D8] bg-white text-[#18345C]')}>{t === 'resguardo' ? 'En resguardo' : 'Devueltos'} ({objetos.filter(o => t === 'devueltos' ? o.estado === 'devuelto' : o.estado !== 'devuelto').length})</button>)}
      </div>
      {!visibles.length && <p className="py-6 text-center text-sm text-[#71839B]">No hay objetos en esta sección.</p>}
      <div className="space-y-3">
        {visibles.map(obj => { const h = habitaciones.find(h => h.numero === obj.habitacionNumero); return <article data-vs-card="limpieza" key={obj.id} className="flex min-w-0 gap-3 rounded-xl border border-[#E5E0D8] bg-white p-3 sm:gap-4">
          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-[#F8F6F0] sm:h-28 sm:w-36">{obj.foto ? <img src={obj.foto} alt={obj.descripcion} className="h-full w-full object-cover"/> : <div className="flex h-full items-center justify-center px-1 text-center text-xs text-[#71839B]">Sin fotografía</div>}</div>
          <div className="min-w-0 flex-1 space-y-1 break-words">
            <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="font-semibold text-[#18345C]">{obj.descripcion}</h2><span className="rounded-md border border-[#E5E0D8] bg-[#F8F6F0] px-2 py-1 text-[10px] font-semibold text-[#52677F]">{obj.estado === 'devuelto' ? 'DEVUELTO' : 'EN RESGUARDO'}</span></div>
            <p className="text-sm text-[#71839B]">Habitación {obj.habitacionNumero}{h ? ' · Piso ' + h.piso : ''}</p>
            <p className="text-sm text-[#71839B]">{mostrarFecha(obj.fechaHora)}</p>
            {obj.observaciones && <p className="text-sm text-[#52677F]">{obj.observaciones}</p>}
            {obj.estado !== 'devuelto' && onEditar && <button className="rounded-lg border border-[#18345C] px-3 py-1.5 text-sm font-semibold text-[#18345C]" onClick={() => { setEditando(obj); setPiso(h ? String(h.piso) : ''); setForm({ habitacionNumero: obj.habitacionNumero, descripcion: obj.descripcion, fechaHora: obj.fechaHora, observaciones: obj.observaciones, foto: obj.foto ?? '' }); setErrores({}); setErrorGuardar(''); setMostrarForm(true); }}>Editar</button>}
          </div>
        </article>; })}
      </div>
    </div>
    {mostrarForm && (<div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30" onClick={() => setMostrarForm(false)} />
      <div data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="standard" role="dialog" aria-label={editando ? "Editar objeto olvidado" : "Registrar objeto olvidado"} className="relative z-10 bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8] sticky top-0 bg-white">
          <h2 className="text-[21px] font-semibold text-[#18345C]">
            {editando ? 'Editar objeto olvidado' : 'Registrar objeto olvidado'}
          </h2>
          <button onClick={() => setMostrarForm(false)} className="text-[#AEBCC1] hover:text-[#1F2933] p-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="space-y-4">
            <div className="vs-short-fields grid grid-cols-1 gap-3 sm:grid-cols-2">
<Campo label="Piso">
              <select
                value={piso}
                onChange={e => {
                  setPiso(e.target.value);
                  setForm(f => ({ ...f, habitacionNumero: '' }));
                }}
                className="w-full border border-[#E5E0D8] rounded-lg px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white">
                <option value="">Todos los pisos</option>
                {[...new Set(habitaciones.map(h => h.piso))].sort().map(n => <option key={n} value={n}>Piso {n}</option>)}
              </select>
            </Campo>
            <Campo label="Habitación" error={errores.habitacionNumero}>
              <select

                value={form.habitacionNumero}
                onChange={e => setForm(f => ({ ...f, habitacionNumero: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-lg px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white disabled:bg-[#F3F4F6]">
                <SelectPlaceholder/>
                {habitaciones.filter(h => !piso || String(h.piso) === piso).map(h => <option key={h.id} value={h.numero}>Habitación {h.numero} · {h.tipo === 'Standard' ? 'Estándar' : h.tipo}</option>)}
              </select>
            </Campo>
</div>

            <Campo label="Descripción del objeto" error={errores.descripcion}>
              <input
                type="text"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-md px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] placeholder:text-[#AEBCC1]" />
            </Campo>

            <Campo label="Foto del objeto" error={errores.foto}>
              <PhotoPicker label="Foto del objeto" accept="image/jpeg,image/png" actionStyle={editando ? 'buttons' : 'links'} preview={form.foto} onSelect={handleFoto} onRemove={()=>{setForm(f=>({...f,foto:''}));setErrores(e=>({...e,foto:undefined}));}} />
            </Campo>

            <Campo label="Fecha y hora en que se encontró" error={errores.fechaHora}>
              <input
                type="datetime-local"
                value={form.fechaHora}
                onChange={e => setForm(f => ({ ...f, fechaHora: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-md px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] placeholder:text-[#AEBCC1]" />
            </Campo>

            <Campo label="Lugar donde se encontró">
              <textarea
                rows={3}
                value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-md px-3 py-3 text-sm text-[#1F2933] resize-none focus:outline-none focus:border-[#18345C] placeholder:text-[#AEBCC1]" />
            </Campo>
          </div>

        </div>

        {errorGuardar && <p role="alert" className="px-4 pb-3 text-red-800">{errorGuardar}</p>}
        {mensajeError&&<p role="alert" className="px-4 pb-3 text-red-800">{mensajeError}</p>}
        <div data-vs-actions="compact" className="px-4 pb-4 flex justify-end gap-2">
          <button
            onClick={() => setMostrarForm(false)}
            className="flex-1 py-3 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors">
            Cancelar
          </button>
          <button disabled={guardando} onClick={handleGuardar} className="flex-1 py-3 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar registro'}
          </button>
        </div>
      </div>
    </div>)}
  </div>);
}
function Campo({ label, error, children }: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (<div data-vs-field="compact">
    <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-1.5">
      {label}
    </p>
    {children}
    {error && <p className="text-xs text-[#991B1B] mt-1">
      {error}
    </p>}
  </div>);
}
