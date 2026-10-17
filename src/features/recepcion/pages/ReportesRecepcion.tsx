import ReceptionCloseButton from './ReceptionCloseButton';
import { useMemo, useState } from 'react';
import type { HabitacionHotel, Huesped, Reserva } from '@/lib/pms/types';
type Area = 'Limpieza' | 'Room Service' | 'Mantenimiento';
type Reporte = {
  id: string;
  habitacion: string;
  piso: number;
  huesped: string;
  area: Area;
  tipo: string;
  descripcion: string;
  prioridad: 'Alta' | 'Media' | 'Baja';
  estado: 'Pendiente' | 'En proceso' | 'Completada';
  fecha: string;
};
const KEY = 'vs-reportes-recepcion';
function leer(): Reporte[] {
  if (typeof window === 'undefined')
    return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  }
  catch {
    return [];
  }
}
function fotoHabitacion(numero: string) {
  const n = Number(numero);
  const tipo = n % 5;
  return tipo === 0 ? 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=500&h=320&fit=crop' : tipo === 1 ? 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=500&h=320&fit=crop' : 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=500&h=320&fit=crop';
}
export default function ReportesRecepcion({ habitaciones, reservas, huespedes }: {
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  huespedes: Huesped[];
}) {
  const [items, setItems] = useState<Reporte[]>(leer),
    [abierto, setAbierto] = useState(false),
    [piso, setPiso] = useState('1'),
    [habitacion, setHabitacion] = useState(''),
    [area, setArea] = useState<Area>('Limpieza'),
    [tipo, setTipo] = useState('Solicitud de servicio'),
    [descripcion, setDescripcion] = useState(''),
    [prioridad, setPrioridad] = useState<'Alta' | 'Media' | 'Baja'>('Media');
  const habs = habitaciones.filter(h => String(h.piso) === piso);
  const reserva = useMemo(() => reservas.find(r => r.habitacionId === `hh-${habitacion}` && (r.estado === 'en-curso' || r.estado === 'confirmada')), [reservas, habitacion]);
  const huesped = huespedes.find(h => h.id === reserva?.huespedId);
  function guardar() {
    if (!habitacion || !descripcion.trim())
      return;
    const r: Reporte = {
      id: `rep-${Date.now()}`,
      habitacion,
      piso: Number(piso),
      huesped: huesped?.nombre || 'Sin asignar',
      area,
      tipo,
      descripcion: descripcion.trim(),
      prioridad,
      estado: 'Pendiente',
      fecha: new Date().toISOString()
    };
    const next = [r, ...items];
    setItems(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    setAbierto(false);
    setDescripcion('');
  }
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-5">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-semibold text-[#18345C]">Reportes</h1>
        <p className="text-sm text-[#71839B]">Solicitudes operativas para Limpieza, Room Service y Mantenimiento.</p>
      </div>
      <button onClick={() => setAbierto(true)} className="rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white">+ Nuevo reporte</button>
    </div>
    <div className="mt-5 grid gap-3 lg:grid-cols-2">
      {items.map(r => <article key={r.id} className="flex gap-4 rounded-xl border bg-white p-4">
        <img src={fotoHabitacion(r.habitacion)} alt="" className="h-24 w-32 rounded-lg object-cover" />
        <div>
          <div className="flex flex-wrap gap-2">
            <b className="text-[#18345C]">Habitación {r.habitacion} · Piso {r.piso}</b>
            <span className="rounded-full bg-[#F3F6FA] px-2 text-xs">
              {r.prioridad}
            </span>
            <span className="rounded-full bg-[#FFF7DF] px-2 text-xs">
              {r.estado}
            </span>
          </div>
          <p className="text-sm text-[#71839B]">{r.huesped} · {r.area} · {r.tipo}</p>
          <p className="mt-2 text-sm text-[#354A63]">
            {r.descripcion}
          </p>
          <p className="mt-1 text-xs text-[#93A3B3]">
            {new Date(r.fecha).toLocaleString('es-GT')}
          </p>
        </div>
      </article>)}
      {!items.length && <div className="rounded-xl border border-dashed bg-white p-6 text-center text-[#93A3B3]">No hay reportes registrados.</div>}
    </div>
    {abierto && <div className="fixed inset-0 z-50 grid place-items-center bg-[#071D34]/45 p-4">
      <section className="w-full max-w-lg rounded-2xl border border-[#E1DDD4] bg-white shadow-2xl">
        <header className="flex justify-between border-b px-4 py-3">
          <h2 className="text-xl font-semibold text-[#18345C]">Nuevo reporte</h2>
          <ReceptionCloseButton onClick={() => setAbierto(false)} />
        </header>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <label>Piso<select
            value={piso}
            onChange={e => {
              setPiso(e.target.value);
              setHabitacion('');
            }}
            className="mt-1 w-full rounded-lg border border-[#D9D5CC] bg-white p-2 outline-none focus:border-[#B58B2A]">
            <option>1</option>
            <option>2</option>
            <option>3</option>
          </select></label>
          <label>Habitación<select
            value={habitacion}
            onChange={e => setHabitacion(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D9D5CC] bg-white p-2 outline-none focus:border-[#B58B2A]">
            <option value="">Seleccionar</option>
            {habs.map(h => <option key={h.id}>
              {h.numero}
            </option>)}
          </select></label>
          <label className="sm:col-span-2">Huésped<div className="mt-1 rounded-lg border border-[#D9D5CC] bg-[#FBFAF6] p-2 text-[#18345C]">
            {huesped?.nombre || 'Sin asignar'}
          </div></label>
          <label>Área responsable<select
            value={area}
            onChange={e => setArea(e.target.value as Area)}
            className="mt-1 w-full rounded-lg border border-[#D9D5CC] bg-white p-2 outline-none focus:border-[#B58B2A]">
            <option>Limpieza</option>
            <option>Room Service</option>
            <option>Mantenimiento</option>
          </select></label>
          <label>Tipo<input
            value={tipo}
            onChange={e => setTipo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[#D9D5CC] bg-white p-2 outline-none focus:border-[#B58B2A]" /></label>
          <label>Prioridad<select
            value={prioridad}
            onChange={e => setPrioridad(e.target.value as any)}
            className="mt-1 w-full rounded-lg border border-[#D9D5CC] bg-white p-2 outline-none focus:border-[#B58B2A]">
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select></label>
          <label className="sm:col-span-2">Descripción<textarea
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-lg border border-[#D9D5CC] bg-white p-2 outline-none focus:border-[#B58B2A]" /></label>
        </div>
        <footer className="flex justify-end gap-2 border-t px-4 py-3">
          <button onClick={() => setAbierto(false)} className="rounded-lg border border-[#D9D5CC] px-4 py-2 text-[#18345C]">Cancelar</button>
          <button onClick={guardar} className="rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white">Registrar reporte</button>
        </footer>
      </section>
    </div>}
  </div>;
}
