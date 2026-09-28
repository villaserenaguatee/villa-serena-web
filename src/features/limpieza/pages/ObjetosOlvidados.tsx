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
  objetos: ObjetoOlvidado[];
  habitaciones: Habitacion[];
  onRegistrar: (obj: ObjetoOlvidado) => void;
}
export default function Objetos({ objetos, habitaciones, onRegistrar }: Props) {
  const [mostrarForm, setMostrarForm] = useState(false);
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
    setErrores(e);
    return Object.keys(e).length === 0;
  }
  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo)
      return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(f => ({ ...f, foto: String(reader.result ?? '') }));
    };
    reader.readAsDataURL(archivo);
  }
  function handleGuardar() {
    if (!validar())
      return;
    const id = generarId();
    onRegistrar({
      id,
      habitacionNumero: form.habitacionNumero,
      descripcion: form.descripcion.trim(),
      fechaHora: form.fechaHora.trim() || `Hoy, ${horaActual()}`,
      observaciones: form.observaciones.trim(),
      foto: form.foto || undefined,
      estado: 'guardado',
      origen: 'limpieza',
    });
    setMostrarForm(false);
    setForm({
      habitacionNumero: '',
      descripcion: '',
      fechaHora: fechaLocal(),
      observaciones: '',
      foto: '',
    });
    setErrores({});
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">
            Objetos olvidados
          </h1>
        </div>
        <button
          onClick={() => setMostrarForm(true)}
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
      {objetos.length === 0 && (<div className="text-center py-6 text-[#AEBCC1] text-sm">No hay objetos olvidados registrados.</div>)}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {objetos.map(obj => {
          const habitacion = habitaciones.find(h => h.numero === obj.habitacionNumero);
          const estadoLabel = obj.estado === 'notificado' ? 'Huésped notificado' : obj.estado === 'encontrado' ? 'Encontrado' : obj.estado === 'guardado' ? 'En resguardo' : 'Devuelto';
          return (<div key={obj.id} className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
            <div className="relative h-40 bg-[#F8F6F0]">
              {obj.foto ? (<img src={obj.foto} alt={obj.descripcion} className="w-full h-full object-cover" />) : (<div className="w-full h-full flex flex-col items-center justify-center text-[#AEBCC1]">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="8.5" cy="10" r="1.5" />
                  <path d="m21 15-5-5L5 19" />
                </svg>
                <span className="text-[12px] mt-2">Sin fotografía</span>
              </div>)}

              <span className={`absolute top-3 right-3 text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide ${obj.estado === 'devuelto'
                ? 'bg-[#F0FAF4] text-[#166534] border border-[#86EFAC]'
                : obj.estado === 'notificado'
                  ? 'bg-[#EFF6FF] text-[#1E40AF] border border-[#93C5FD]'
                  : obj.estado === 'guardado'
                    ? 'bg-[#FFFBEF] text-[#78450A] border border-[#F3D98B]'
                    : 'bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1]'}`}>
                {estadoLabel}
              </span>
            </div>

            <div className="p-4">
              <p className="text-[16px] font-semibold text-[#18345C] mb-3">
                {obj.descripcion}
              </p>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-[14px] text-[#6B7280]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  Habitación {obj.habitacionNumero}
                </div>
                {habitacion && <p className="ml-[18px] text-[12px] font-medium text-[#8290A3]">Piso {habitacion.piso} · {habitacion.tipo === 'Standard' ? 'Estándar' : habitacion.tipo}</p>}

                <div className="flex items-center gap-1.5 text-[14px] text-[#6B7280]">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {mostrarFecha(obj.fechaHora)}
                </div>
              </div>

              {obj.observaciones && (<p className="text-[13px] text-[#AEBCC1] mt-3 italic border-t border-[#F0EBE3] pt-3">
                {obj.observaciones}
              </p>)}
            </div>
          </div>);
        })}
      </div>
    </div>

    {mostrarForm && (<div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/30" onClick={() => setMostrarForm(false)} />
      <div className="relative z-10 bg-white rounded-t-xl sm:rounded-xl shadow-2xl w-full sm:max-w-lg max-h-[88vh] overflow-y-auto">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#E5E0D8] sticky top-0 bg-white">
          <h2 className="text-[21px] font-semibold text-[#18345C]">
            Registrar objeto olvidado
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
            <Campo label="Piso">
              <select
                value={piso}
                onChange={e => {
                  setPiso(e.target.value);
                  setForm(f => ({ ...f, habitacionNumero: '' }));
                }}
                className="w-full border border-[#E5E0D8] rounded-lg px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white">
                <option value="">Seleccionar piso…</option>
                {[...new Set(habitaciones.map(h => h.piso))].sort().map(n => <option key={n} value={n}>Piso {n}</option>)}
              </select>
            </Campo>
            <Campo label="Habitación" error={errores.habitacionNumero}>
              <select
                disabled={!piso}
                value={form.habitacionNumero}
                onChange={e => setForm(f => ({ ...f, habitacionNumero: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-lg px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white disabled:bg-[#F3F4F6]">
                <option value="">
                  {piso ? 'Seleccionar habitación…' : 'Primero selecciona un piso'}
                </option>
                {habitaciones.filter(h => String(h.piso) === piso).map(h => <option key={h.id} value={h.numero}>Habitación {h.numero} · {h.tipo === 'Standard' ? 'Estándar' : h.tipo}</option>)}
              </select>
            </Campo>

            <Campo label="Descripción del objeto" error={errores.descripcion}>
              <input
                type="text"
                value={form.descripcion}
                onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-md px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] placeholder:text-[#AEBCC1]" />
            </Campo>

            <Campo label="Foto del objeto">
              <label className="flex h-32 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-[#D7D1C7] bg-[#F8F6F0] text-sm text-[#71839B]">
                {form.foto ? <img src={form.foto} alt="Vista previa" className="h-full w-full object-cover" /> : <span>+ Agregar fotografía</span>}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFoto} />
              </label>
              {form.foto && (<div className="mt-2 overflow-hidden rounded-lg border border-[#E5E0D8] bg-[#F8F6F0]">
                <img src={form.foto} alt="Objeto olvidado" className="h-28 w-full object-contain" />
              </div>)}
            </Campo>

            <Campo label="Fecha y hora del hallazgo">
              <input
                type="datetime-local"
                value={form.fechaHora}
                onChange={e => setForm(f => ({ ...f, fechaHora: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-md px-3 py-3 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] placeholder:text-[#AEBCC1]" />
            </Campo>

            <Campo label="¿Dónde fue encontrado?">
              <textarea
                rows={3}
                value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                className="w-full border border-[#E5E0D8] rounded-md px-3 py-3 text-sm text-[#1F2933] resize-none focus:outline-none focus:border-[#18345C] placeholder:text-[#AEBCC1]" />
            </Campo>
          </div>

        </div>

        <div className="px-4 pb-4 flex justify-end gap-2">
          <button
            onClick={() => setMostrarForm(false)}
            className="flex-1 py-3 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors">
            Cancelar
          </button>
          <button onClick={handleGuardar} className="flex-1 py-3 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            Guardar registro
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
  return (<div>
    <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-1.5">
      {label}
    </p>
    {children}
    {error && <p className="text-xs text-[#991B1B] mt-1">
      {error}
    </p>}
  </div>);
}
