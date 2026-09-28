import { fechaHotel } from "@/lib/hotel";
import { useMemo, useState } from 'react';
import type { Reserva, HabitacionHotel, TipoHabitacion } from '@/lib/pms/types';
import { fechaRelativaISO, formatoFecha } from '@/data/pms';
import { dinero, calcularMetricas, descargarCSV, DownloadIcon } from '@/features/admin/pages/adminUtils';
type Periodo = '7d' | '30d' | 'mes' | 'anio';
interface Props {
  reservas: Reserva[];
  habitaciones: HabitacionHotel[];
  tarifasBase: Record<TipoHabitacion, number>;
}
function rango(periodo: Periodo): {
  desde: string;
  hasta: string;
  label: string;
} {
  const hasta = fechaRelativaISO(1);
  const now = new Date();
  switch (periodo) {
    case '7d':
      return { desde: fechaRelativaISO(-6), hasta, label: 'Últimos 7 días' };
    case '30d':
      return { desde: fechaRelativaISO(-29), hasta, label: 'Últimos 30 días' };
    case 'mes': {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { desde: fechaHotel(d), hasta, label: 'Este mes' };
    }
    case 'anio': {
      const d = new Date(now.getFullYear(), 0, 1);
      return { desde: fechaHotel(d), hasta, label: 'Este año' };
    }
  }
}
export default function Reportes({ reservas, habitaciones, tarifasBase }: Props) {
  const [periodo, setPeriodo] = useState<Periodo>('30d');
  const { desde, hasta, label } = rango(periodo);
  const m = useMemo(() => calcularMetricas(desde, hasta, reservas, habitaciones, tarifasBase), [desde, hasta, reservas, habitaciones, tarifasBase]);
  const maxIngresoTipo = Math.max(1, ...m.porTipo.map(t => t.ingreso));
  const diasVisibles = m.porDia.slice(-31);
  function exportar() {
    const filas: (string | number)[][] = [
      ['Reporte de desempeño', label],
      ['Período', `${formatoFecha(desde)} a ${formatoFecha(fechaRelativaISO(0))}`],
      [],
      ['Métrica', 'Valor'],
      ['Ocupación media (%)', m.ocupacionPct],
      ['ADR (tarifa media diaria)', m.adr],
      ['RevPAR', m.revpar],
      ['Noches vendidas', m.nochesVendidas],
      ['Noches disponibles', m.nochesDisponibles],
      ['Ingreso alojamiento', m.ingresoAlojamiento],
      ['Ingreso servicios', m.ingresoServicios],
      ['Ingreso total', m.ingresoTotal],
      [],
      ['Fecha', 'Ocupadas', 'Ocupación (%)', 'Ingreso alojamiento'],
      ...m.porDia.map(d => [d.fecha, d.ocupadas, d.ocupacionPct, d.ingreso]),
      [],
      ['Tipo de habitación', 'Noches vendidas', 'Ingreso'],
      ...m.porTipo.map(t => [t.tipo, t.noches, t.ingreso]),
    ];
    descargarCSV(`reporte-${periodo}-${fechaRelativaISO(0)}.csv`, filas);
  }
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Reportes de desempeño</h1>
          <p className="text-[14px] text-[#AEBCC1] mt-1">
            {label} · {formatoFecha(desde)} → {formatoFecha(fechaRelativaISO(0))} · {m.dias} días
          </p>
        </div>
        <button
          onClick={exportar}
          className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          <DownloadIcon /> Exportar CSV
        </button>
      </div>

      <div className="flex gap-2 flex-wrap mt-4">
        {([['7d', 'Últimos 7 días'], ['30d', 'Últimos 30 días'], ['mes', 'Este mes'], ['anio', 'Este año']] as [
          Periodo,
          string
        ][]).map(([id, txt]) => (<button
          key={id}
          onClick={() => setPeriodo(id)}
          className={`text-[13px] font-medium px-3 py-1.5 rounded-md border transition-colors ${periodo === id ? 'bg-[#18345C] text-white border-[#18345C]' : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
          {txt}
        </button>))}
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5 space-y-7">

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        <Kpi valor={`${m.ocupacionPct}%`} label="Ocupación promedio" detalle="Porcentaje de habitaciones ocupadas" destacado />
        <Kpi valor={dinero(m.adr)} label="Tarifa promedio vendida" detalle="Ingreso medio por noche reservada" />
        <Kpi valor={dinero(m.revpar)} label="Ingreso por habitación disponible" detalle="Incluye habitaciones que no se vendieron" destacado />
        <Kpi valor={dinero(m.ingresoTotal)} label="Ingresos totales" detalle="Alojamiento y servicios" />
        <Kpi valor={dinero(m.ingresoAlojamiento)} label="Ingreso por alojamiento" />
        <Kpi valor={dinero(m.ingresoServicios)} label="Ingreso por servicios" />
        <Kpi valor={String(m.nochesVendidas)} label="Noches vendidas" />
        <Kpi valor={`${m.nochesVendidas} / ${m.nochesDisponibles}`} label="Vendidas / disponibles" />
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-[#D9E4F0] bg-[#F4F8FC] p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71839B]">Lectura del período</p>
          <p className="mt-2 text-sm text-[#18345C]">El hotel tuvo una ocupación promedio de <b>{m.ocupacionPct}%</b> y vendió <b>
            {m.nochesVendidas}
          </b> noches.</p>
        </div>
        <div className="rounded-xl border border-[#E5E0D8] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71839B]">Alojamiento</p>
          <p className="mt-2 text-xl font-bold text-[#18345C]">
            {dinero(m.ingresoAlojamiento)}
          </p>
          <p className="text-xs text-[#71839B]">Ingresos generados por habitaciones</p>
        </div>
        <div className="rounded-xl border border-[#E5E0D8] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#71839B]">Servicios</p>
          <p className="mt-2 text-xl font-bold text-[#18345C]">
            {dinero(m.ingresoServicios)}
          </p>
          <p className="text-xs text-[#71839B]">Ingresos adicionales registrados</p>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.65fr_.75fr]">
        <section className="rounded-xl border border-[#E5E0D8] bg-white p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[17px] font-semibold text-[#18345C]">Ocupación diaria</h2>
              <p className="text-[12px] text-[#71839B]">Porcentaje de habitaciones ocupadas cada día</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-[#52677F]"><span className="h-2.5 w-2.5 rounded-full bg-[#2E78E8]" />Ocupación</div>
          </div>
          <OcupacionChart datos={diasVisibles} />
        </section>
        <DistribucionIngresos alojamiento={m.ingresoAlojamiento} servicios={m.ingresoServicios} total={m.ingresoTotal} />
      </div>

      <section className="bg-white border border-[#E5E0D8] rounded-xl p-4">
        <div className="mb-4">
          <h2 className="text-[17px] font-semibold text-[#18345C]">Ingresos por tipo de habitación</h2>
          <p className="text-[12px] text-[#71839B]">Cada fila muestra claramente cuánto generó la categoría y cuántas noches vendió.</p>
        </div>
        {m.porTipo.length === 0 ? (<p className="text-[13px] text-[#AEBCC1]">Sin datos en el período.</p>) : (<div className="space-y-2.5">
          {m.porTipo.map((t,
            index) => (<div key={t.tipo} className="flex items-center gap-3">
              <span className="text-[13px] font-medium text-[#1F2933] w-28 shrink-0">
                {t.tipo}
              </span>
              <div className="flex-1 bg-[#F1F5F9] rounded-full h-7 overflow-hidden">
                <div
                  className="h-full rounded-full flex items-center justify-end pr-3 transition-all"
                  style={{ width: `${(t.ingreso / maxIngresoTipo) * 100}%`, minWidth: 72, backgroundColor: ['#2E78E8', '#42C2C5', '#8B6CE0', '#E7B84B', '#18345C'][index % 5] }}>
                  <span className="text-[11px] font-semibold text-white">
                    {dinero(t.ingreso)}
                  </span>
                </div>
              </div>
              <span className="text-[12px] text-[#52677F] w-20 shrink-0 text-right">
                {t.noches}
                {t.noches === 1 ? 'noche' : 'noches'}
              </span>
            </div>))}
        </div>)}
      </section>

      <section className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
        <div className="grid grid-cols-4 px-4 py-3 bg-[#F8F6F0] border-b border-[#E5E0D8] text-[11px] text-[#AEBCC1] uppercase tracking-widest font-medium">
          <span>Fecha</span>
          <span className="text-right">Ocupadas</span>
          <span className="text-right">Ocupación</span>
          <span className="text-right">Ingreso aloj.</span>
        </div>
        <div className="divide-y divide-[#F0EBE3] max-h-80 overflow-y-auto">
          {m.porDia.map(d => (<div key={d.fecha} className="grid grid-cols-4 px-4 py-2.5 text-[13px]">
            <span className="text-[#1F2933]">
              {formatoFecha(d.fecha)}
            </span>
            <span className="text-right text-[#6B7280]">
              {d.ocupadas}
            </span>
            <span className="text-right text-[#6B7280]">{d.ocupacionPct}%</span>
            <span className="text-right font-medium text-[#18345C]">
              {dinero(d.ingreso)}
            </span>
          </div>))}
        </div>
      </section>
    </div>
  </div>);
}
function Kpi({ valor, label, detalle, destacado }: {
  valor: string;
  label: string;
  detalle?: string;
  destacado?: boolean;
}) {
  return (<div className={`rounded-xl px-4 py-3.5 border ${destacado ? 'bg-[#18345C] border-[#18345C]' : 'bg-white border-[#E5E0D8]'}`}>
    <p className={`text-[24px] font-bold leading-none ${destacado ? 'text-white' : 'text-[#18345C]'}`}>
      {valor}
    </p>
    <p className={`text-[11px] mt-1.5 ${destacado ? 'text-[#AEBCC1]' : 'text-[#6B7280]'}`}>
      {label}
    </p>
    {detalle && <p className={`mt-1 text-[10px] ${destacado ? 'text-white/55' : 'text-[#AEBCC1]'}`}>
      {detalle}
    </p>}
  </div>);
}
function OcupacionChart({ datos }: {
  datos: {
    fecha: string;
    ocupadas: number;
    ocupacionPct: number;
    ingreso: number;
  }[];
}) {
  const ancho = 760, alto = 250, izq = 48, der = 18, arriba = 22, abajo = 42;
  const w = ancho - izq - der, h = alto - arriba - abajo;
  if (!datos.length)
    return <div className="grid h-64 place-items-center text-sm text-[#AEBCC1]">Sin datos en el período.</div>;
  const punto = (d: typeof datos[number], i: number) => ({ x: izq + (datos.length === 1 ? w / 2 : (i * w) / (datos.length - 1)), y: arriba + h - (d.ocupacionPct / 100) * h });
  const puntos = datos.map(punto);
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`).join(' ');
  const area = `${linea} L ${puntos[puntos.length - 1].x} ${arriba + h} L ${puntos[0].x} ${arriba + h} Z`;
  const salto = Math.max(1, Math.ceil(datos.length / 6));
  return <div className="w-full overflow-x-auto">
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="min-w-[620px] w-full" role="img" aria-label="Gráfica de ocupación diaria">
      <defs>
        <linearGradient id="ocupacionArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2E78E8" stopOpacity=".28" />
          <stop offset="1" stopColor="#2E78E8" stopOpacity=".02" />
        </linearGradient>
      </defs>
      {[0, 25, 50, 75, 100].map(v => {
        const y = arriba + h - (v / 100) * h;
        return <g key={v}>
          <line x1={izq} y1={y} x2={ancho - der} y2={y} stroke="#E8EDF3" />
          <text x={izq - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#8CA0B3">{v}%</text>
        </g>;
      })}
      <path d={area} fill="url(#ocupacionArea)" />
      <path d={linea} fill="none" stroke="#2E78E8" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
      {datos.map((d,
        i) => {
          const p = puntos[i];
        const mostrar = i % salto === 0 || i === datos.length - 1;
        return <g key={d.fecha}>
          <circle cx={p.x} cy={p.y} r="5" fill="white" stroke="#2E78E8" strokeWidth="3">
            <title>{formatoFecha(d.fecha)}: {d.ocupacionPct}% · {d.ocupadas} habitaciones · {dinero(d.ingreso)}</title>
          </circle>
          {mostrar && <><text x={p.x} y={Math.max(14, p.y - 11)} textAnchor="middle" fontSize="10" fontWeight="700" fill="#18345C">{d.ocupacionPct}%</text><text x={p.x} y={alto - 14} textAnchor="middle" fontSize="9" fill="#71839B">
            {formatoFecha(d.fecha).replace(` ${new Date(d.fecha + 'T00:00:00').getFullYear()}`, '')}
          </text></>}
        </g>;
      })}
    </svg>
  </div>;
}
function DistribucionIngresos({ alojamiento, servicios, total }: {
  alojamiento: number;
  servicios: number;
  total: number;
}) {
  const pa = total ? Math.round(alojamiento / total * 100) : 0, ps = total ? 100 - pa : 0;
  return <section className="rounded-xl border border-[#E5E0D8] bg-white p-5">
    <h2 className="text-[17px] font-semibold text-[#18345C]">Origen de los ingresos</h2>
    <p className="text-[12px] text-[#71839B]">Distribución del total generado</p>
    <div className="mt-5 flex items-center justify-center">
      <div className="grid h-40 w-40 place-items-center rounded-full" style={{ background: `conic-gradient(#2E78E8 0 ${pa}%, #E7B84B ${pa}% 100%)` }}>
        <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-center">
          <div>
            <b className="block text-xl text-[#18345C]">
              {dinero(total)}
            </b>
            <span className="text-[10px] text-[#71839B]">Total</span>
          </div>
        </div>
      </div>
    </div>
    <div className="mt-5 space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-[#52677F]"><i className="h-3 w-3 rounded-full bg-[#2E78E8]" />Alojamiento</span>
        <b className="text-[#18345C]">{pa}% · {dinero(alojamiento)}</b>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2 text-[#52677F]"><i className="h-3 w-3 rounded-full bg-[#E7B84B]" />Servicios</span>
        <b className="text-[#18345C]">{ps}% · {dinero(servicios)}</b>
      </div>
    </div>
  </section>;
}
