import { useMemo, useState } from 'react';
import type { EntradaHistorial, Habitacion } from '@/lib/pms/types';
interface Props {
  historial: EntradaHistorial[];
  habitaciones: Habitacion[];
  usuarioActual?: string;
}
type TipoFiltro = 'Todas' | 'Limpieza' | 'Incidencia' | 'Objeto olvidado';
type FechaFiltro = 'Todas' | 'Hoy' | 'Ayer' | 'Últimos 7 días' | 'Últimos 30 días' | 'Personalizada';
function categoria(tipo: string): TipoFiltro {
  const t = tipo.toLowerCase();
  if (t.includes('incidencia'))
    return 'Incidencia';
  if (t.includes('objeto'))
    return 'Objeto olvidado';
  return 'Limpieza';
}
function fechaDeEntrada(fecha: string) {
  const iso = fecha.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  return iso ? new Date(`${iso}T12:00:00`) : new Date();
}
function cumpleFecha(fecha: string,
  filtro: FechaFiltro,
  desde: string,
  hasta: string) {
  if (filtro === 'Todas')
    return true;
  const ahora = new Date();
  const dia = fechaDeEntrada(fecha);
  ahora.setHours(23, 59, 59, 999);
  dia.setHours(12, 0, 0, 0);
  const diferencia = Math.floor((ahora.getTime() - dia.getTime()) / 86400000);
  if (filtro === 'Hoy')
    return diferencia === 0;
  if (filtro === 'Ayer')
    return diferencia === 1;
  if (filtro === 'Últimos 7 días')
    return diferencia >= 0 && diferencia <= 7;
  if (filtro === 'Últimos 30 días')
    return diferencia >= 0 && diferencia <= 30;
  if (!desde && !hasta)
    return true;
  const inicio = desde ? new Date(`${desde}T00:00:00`) : new Date('1900-01-01T00:00:00');
  const fin = hasta ? new Date(`${hasta}T23:59:59`) : new Date('2999-12-31T23:59:59');
  return dia >= inicio && dia <= fin;
}
function estadoCls(estado: string) {
  return ['limpia', 'finalizada', 'resuelta', 'guardado', 'notificado'].includes(estado.toLowerCase())
    ? 'border-[#86EFAC] bg-[#F0FAF4] text-[#166534]'
    : 'border-[#F3D98B] bg-[#FFFBEF] text-[#78450A]';
}
export default function Historial({ historial, habitaciones, usuarioActual = 'Personal de limpieza' }: Props) {
  const [piso, setPiso] = useState('Todos');
  const [habitacion, setHabitacion] = useState('Todas');
  const [tipo, setTipo] = useState<TipoFiltro>('Todas');
  const [fecha, setFecha] = useState<FechaFiltro>('Todas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const base = useMemo(() => historial.filter(e => e.responsable === usuarioActual), [historial, usuarioActual]);
  const habitacionesPiso = habitaciones.filter(h => piso === 'Todos' || h.piso === Number(piso)).sort((a, b) => a.numero.localeCompare(b.numero));
  const visibles = base.filter(e => {
    const h = habitaciones.find(x => x.numero === e.habitacionNumero);
    return (piso === 'Todos' || h?.piso === Number(piso)) &&
      (habitacion === 'Todas' || e.habitacionNumero === habitacion) &&
      (tipo === 'Todas' || categoria(e.tipo) === tipo) &&
      cumpleFecha(e.fechaHora, fecha, desde, hasta);
  });
  function limpiar() {
    setPiso('Todos');
    setHabitacion('Todas');
    setTipo('Todas');
    setFecha('Todas');
    setDesde('');
    setHasta('');
  }
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0]">
    <header className="border-b border-[#E5E0D8] bg-white px-4 py-5 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#18345C]">Historial</h1>
          <p className="mt-1 text-sm text-[#AEBCC1]">{visibles.length} {visibles.length === 1 ? 'registro' : 'registros'} · Actividad de {usuarioActual}</p>
        </div>
        <button onClick={limpiar} className="rounded-lg border border-[#D9DDE2] bg-white px-3 py-2 text-sm font-medium text-[#71839B] hover:text-[#18345C]">Limpiar filtros</button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Filtro label="Piso" value={piso} options={['Todos', '1', '2', '3']} onChange={v => {
          setPiso(v);
          setHabitacion('Todas');
        }} />
        <Filtro label="Habitación" value={habitacion} options={['Todas', ...habitacionesPiso.map(h => h.numero)]} onChange={setHabitacion} />
        <Filtro
          label="Tipo de actividad"
          value={tipo}
          options={['Todas', 'Limpieza', 'Incidencia', 'Objeto olvidado']}
          onChange={v => setTipo(v as TipoFiltro)} />
        <Filtro
          label="Fecha"
          value={fecha}
          options={['Todas', 'Hoy', 'Ayer', 'Últimos 7 días', 'Últimos 30 días', 'Personalizada']}
          onChange={v => setFecha(v as FechaFiltro)} />
      </div>
      {fecha === 'Personalizada' && <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#AEBCC1]">Desde</span>
          <input
            type="date"
            value={desde}
            onChange={e => setDesde(e.target.value)}
            className="w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2.5 text-sm text-[#1F2933]" />
        </label>
        <label>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#AEBCC1]">Hasta</span>
          <input
            type="date"
            value={hasta}
            onChange={e => setHasta(e.target.value)}
            className="w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2.5 text-sm text-[#1F2933]" />
        </label>
      </div>}
    </header>
    <main className="p-4 sm:p-6">
      {visibles.length ? <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {visibles.map(e => {
          const h = habitaciones.find(x => x.numero === e.habitacionNumero);
          return <article key={e.id} className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white sm:flex">
            <img src={h?.foto || '/villa-serena-logo.png'} alt={`Habitación ${e.habitacionNumero}`} className="h-44 w-full object-cover sm:h-auto sm:w-48" />
            <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#B38719]">Habitación {e.habitacionNumero} · Piso {h?.piso ?? '—'}</p>
                  <h2 className="mt-1 text-lg font-semibold text-[#18345C]">
                    {e.tipo}
                  </h2>
                  <p className="mt-1 text-sm text-[#71839B]">
                    {h?.tipo ?? ''}
                  </p>
                </div>
                <span className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase ${estadoCls(e.estado)}`}>
                  {e.estado}
                </span>
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-[#EEE9E1] pt-3">
                <span className="rounded-full bg-[#F8F6F0] px-3 py-1 text-xs font-semibold text-[#52677F]">
                  {categoria(e.tipo)}
                </span>
                <time className="text-sm text-[#71839B]">
                  {e.fechaHora}
                </time>
              </div>
            </div>
          </article>;
        })}
      </div> : <div className="rounded-xl border border-dashed border-[#D8D1C7] bg-white py-6 text-center">
        <p className="font-semibold text-[#52677F]">No hay registros con estos filtros.</p>
        <p className="mt-1 text-sm text-[#AEBCC1]">Prueba otra habitación, actividad o período.</p>
      </div>}
    </main>
  </div>;
}
function Filtro({ label, value, options, onChange }: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return <label>
    <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-widest text-[#AEBCC1]">
      {label}
    </span>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full rounded-lg border border-[#E5E0D8] bg-white px-3 py-2.5 text-sm text-[#1F2933] outline-none focus:border-[#18345C]">
      {options.map(o => <option key={o}>
        {o}
      </option>)}
    </select>
  </label>;
}
