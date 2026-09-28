import { useState } from 'react';
import type { AreaSolicitud, HabitacionHotel, Incidencia, PrioridadIncidencia } from '@/lib/pms/types';
import { generarId, horaActual } from '@/data/pms';
const TIPOS = ['Fuga de agua', 'Avería técnica', 'Daño en mobiliario', 'Problema eléctrico', 'Suciedad grave', 'Otro'];
const AREAS = ['Piscina', 'Restaurante', 'Lobby principal', 'Gimnasio', 'Sótano', 'Estacionamiento', 'Cocina', 'Lavandería', 'Otra área'];
interface Props {
  areaReporta: Extract<AreaSolicitud, 'Recepción' | 'Room Service'>;
  incidencias: Incidencia[];
  habitaciones: HabitacionHotel[];
  onRegistrar: (incidencia: Incidencia) => void;
}
export default function IncidenciasArea({ areaReporta, incidencias, habitaciones, onRegistrar }: Props) {
  const [abierto, setAbierto] = useState(false);
  const [ubicacionTipo, setUbicacionTipo] = useState<'habitacion' | 'area'>('habitacion');
  const [piso, setPiso] = useState('');
  const [habitacion, setHabitacion] = useState('');
  const [area, setArea] = useState('');
  const [otraArea, setOtraArea] = useState('');
  const [tipo, setTipo] = useState('');
  const [otroTipo, setOtroTipo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadIncidencia>('media');
  const [impideUso, setImpideUso] = useState(false);
  const [error, setError] = useState('');
  const propias = incidencias.filter(i => i.area === areaReporta);
  const pisos = [...new Set(habitaciones.map(h => h.piso))].sort((a, b) => a - b);
  function cerrar() {
    setAbierto(false);
    setError('');
  }
  function registrar() {
    const ubicacion = ubicacionTipo === 'habitacion' ? habitacion : area === 'Otra área' ? otraArea.trim() : area;
    const problema = tipo === 'Otro' ? otroTipo.trim() : tipo;
    if (!ubicacion || !problema || !descripcion.trim()) {
      setError('Completa la ubicación, el tipo de problema y la descripción.');
      return;
    }
    onRegistrar({
      id: generarId(),
      habitacionNumero: ubicacion,
      tipo: problema,
      descripcion: descripcion.trim(),
      prioridad,
      hora: horaActual(),
      estado: 'pendiente',
      impideUso,
      area: areaReporta,
    });
    setPiso('');
    setHabitacion('');
    setArea('');
    setOtraArea('');
    setTipo('');
    setOtroTipo('');
    setDescripcion('');
    setPrioridad('media');
    setImpideUso(false);
    cerrar();
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E5E0D8] bg-white px-4 py-5 sm:px-6">
      <div>
        <h1 className="text-[32px] font-semibold leading-tight text-[#18345C]">Incidencias</h1>
        <p className="mt-1 text-[15px] text-[#AEBCC1]">Daños y desperfectos reportados</p>
      </div>
      <button
        onClick={() => setAbierto(true)}
        className="min-h-11 rounded-md bg-[#18345C] px-4 py-2.5 text-[15px] font-semibold text-white hover:bg-[#102747]">+ Nueva incidencia</button>
    </div>

    <div className="space-y-3 px-4 py-5 sm:px-6">
      {propias.length === 0 && <div className="rounded-xl border border-[#E5E0D8] bg-white py-8 text-center text-sm text-[#AEBCC1]">No hay incidencias reportadas.</div>}
      {propias.map(i => {
        const h = habitaciones.find(x => x.numero === i.habitacionNumero);
        return <div key={i.id} className="flex gap-4 rounded-xl border border-[#E5E0D8] bg-white p-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <b className="text-[#18345C]">
                {h ? `Habitación ${h.numero}` : i.habitacionNumero}
              </b>
              <Etiqueta prioridad={i.prioridad} />
              <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${i.estado === 'resuelta' ? 'border-[#86EFAC] bg-[#F0FAF4] text-[#166534]' : i.estado === 'en-proceso' ? 'border-[#93C5FD] bg-[#EFF6FF] text-[#1E40AF]' : 'border-[#F3D98B] bg-[#FFFBEF] text-[#78450A]'}`}>
                {i.estado === 'en-proceso' ? 'En proceso' : i.estado}
              </span>
            </div>
            {h && <p className="text-xs text-[#71839B]">Piso {h.piso} · {h.tipo === 'Standard' ? 'Estándar' : h.tipo}</p>}
            <p className="mt-1 text-sm font-semibold text-[#18345C]">
              {i.tipo}
            </p>
            <p className="text-sm text-[#6B7280]">
              {i.descripcion}
            </p>
            <p className="mt-1 text-xs text-[#AEBCC1]">Reportado: {i.hora}</p>
          </div>
        </div>;
      })}
    </div>

    {abierto && <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button aria-label="Cerrar" onClick={cerrar} className="absolute inset-0 bg-black/35" />
      <div className="relative z-10 max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-xl sm:rounded-2xl">
        <div className="sticky top-0 flex items-center justify-between border-b bg-white px-4 py-3">
          <h2 className="text-xl font-semibold text-[#18345C]">Reportar incidencia</h2>
          <button onClick={cerrar} className="text-2xl text-[#AEBCC1]">×</button>
        </div>
        <div className="space-y-3 p-4">
          <Campo label="¿Dónde está el problema?">
            <div className="grid grid-cols-2 gap-2">
              <Selector activo={ubicacionTipo === 'habitacion'} onClick={() => {
                setUbicacionTipo('habitacion');
                setArea('');
              }}>Habitación</Selector>
              <Selector activo={ubicacionTipo === 'area'} onClick={() => {
                setUbicacionTipo('area');
                setHabitacion('');
                setPiso('');
              }}>Área común</Selector>
            </div>
          </Campo>
          {ubicacionTipo === 'habitacion' ? <div className="grid gap-3 sm:grid-cols-2">
            <Campo label="Piso">
              <select value={piso} onChange={e => {
                setPiso(e.target.value);
                setHabitacion('');
              }} className={INPUT}>
                <option value="">Seleccionar piso…</option>
                {pisos.map(p => <option key={p} value={p}>Piso {p}</option>)}
              </select>
            </Campo>
            <Campo label="Habitación">
              <select disabled={!piso} value={habitacion} onChange={e => setHabitacion(e.target.value)} className={INPUT}>
                <option value="">Seleccionar habitación…</option>
                {habitaciones.filter(h => String(h.piso) === piso).map(h => <option key={h.id} value={h.numero}>Habitación {h.numero}</option>)}
              </select>
            </Campo>
          </div> : <><Campo label="Área común">
            <select value={area} onChange={e => setArea(e.target.value)} className={INPUT}>
              <option value="">Seleccionar área…</option>
              {AREAS.map(a => <option key={a}>
                {a}
              </option>)}
            </select>
          </Campo>{area === 'Otra área' && <Campo label="Nombre del área">
            <input value={otraArea} onChange={e => setOtraArea(e.target.value)} className={INPUT} />
          </Campo>}</>}
          <Campo label="Tipo de problema">
            <select value={tipo} onChange={e => setTipo(e.target.value)} className={INPUT}>
              <option value="">Seleccionar tipo…</option>
              {TIPOS.map(t => <option key={t}>
                {t}
              </option>)}
            </select>
          </Campo>
          {tipo === 'Otro' && <Campo label="Especifica el problema">
            <input value={otroTipo} onChange={e => setOtroTipo(e.target.value)} className={INPUT} />
          </Campo>}
          <Campo label="Descripción">
            <textarea rows={3} value={descripcion} onChange={e => setDescripcion(e.target.value)} className={INPUT} />
          </Campo>
          <Campo label="Prioridad">
            <div className="grid grid-cols-3 gap-2">
              {(['alta', 'media', 'baja'] as PrioridadIncidencia[]).map(p => <Selector key={p} activo={prioridad === p} onClick={() => setPrioridad(p)}>
                {p[0].toUpperCase() + p.slice(1)}
              </Selector>)}
            </div>
          </Campo>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#E5E0D8] p-3">
            <input type="checkbox" checked={impideUso} onChange={e => setImpideUso(e.target.checked)} className="h-4 w-4" />
            <span className="text-sm font-medium text-[#18345C]">Impide utilizar {ubicacionTipo === 'habitacion' ? 'la habitación' : 'el área'}</span>
          </label>
          {error && <p className="text-sm text-[#991B1B]">
            {error}
          </p>}
          <div className="flex flex-wrap justify-end gap-2 pt-1">
            <button onClick={cerrar} className="min-h-11 rounded-md border border-[#E5E0D8] px-4 text-sm text-[#6B7280]">Cancelar</button>
            <button onClick={registrar} className="min-h-11 rounded-md bg-[#18345C] px-4 text-sm font-semibold text-white">Registrar incidencia</button>
          </div>
        </div>
      </div>
    </div>}
  </div>);
}
const INPUT = 'w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2.5 text-sm text-[#1F2933] outline-none focus:border-[#18345C] disabled:bg-[#F3F4F6]';
function Campo({ label, children }: {
  label: string;
  children: React.ReactNode;
}) {
  return <div>
    <p className="mb-1.5 text-[10px] uppercase tracking-widest text-[#AEBCC1]">
      {label}
    </p>
    {children}
  </div>;
}
function Selector({ activo, onClick, children }: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <button
    type="button"
    onClick={onClick}
    className={`min-h-11 rounded-md border px-3 text-sm font-semibold ${activo ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E5E0D8] bg-white text-[#6B7280]'}`}>
    {children}
  </button>;
}
function Etiqueta({ prioridad }: {
  prioridad: PrioridadIncidencia;
}) {
  const c = prioridad === 'alta' ? 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]' : prioridad === 'media' ? 'border-[#F3D98B] bg-[#FFFBEF] text-[#78450A]' : 'border-[#86EFAC] bg-[#F0FAF4] text-[#166534]';
  return <span className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase ${c}`}>
    {prioridad}
  </span>;
}
