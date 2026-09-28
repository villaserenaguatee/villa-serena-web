import type { TipoHabitacion, ReglaTarifa, Reserva, HabitacionHotel, EstadoAsistencia, CategoriaInsumo, PermisoModulo, } from '@/lib/pms/types';
export { dinero, Chip, HAB_META, Campo, INPUT_CLS, BedIcon } from '@/features/recepcion/pages/recUtils';
export function tarifaEfectiva(tipo: TipoHabitacion,
  base: number,
  reglas: ReglaTarifa[],
  ocupacionPct: number,
  fechaISO: string): {
    precio: number;
    aplicadas: ReglaTarifa[];
  } {
  let precio = base;
  const aplicadas: ReglaTarifa[] = [];
  for (const r of reglas) {
    if (!r.activa)
      continue;
    if (r.tipoHabitacion !== 'Todas' && r.tipoHabitacion !== tipo)
      continue;
    let aplica: boolean;
    if (r.criterio === 'ocupacion') {
      aplica = ocupacionPct >= (r.umbralOcupacion ?? 100);
    }
    else {
      aplica = (!r.desde || fechaISO >= r.desde) && (!r.hasta || fechaISO <= r.hasta);
    }
    if (!aplica)
      continue;
    aplicadas.push(r);
    if (r.ajuste === 'fijo')
      precio = r.valor;
    else
      precio = precio * (1 + r.valor / 100);
  }
  return { precio: Math.round(precio * 100) / 100, aplicadas };
}
export const CRITERIO_LABEL: Record<ReglaTarifa['criterio'], string> = {
  temporada: 'Temporada',
  ocupacion: 'Ocupación',
  evento: 'Evento',
};
const ESTADOS_CONTABLES: Reserva['estado'][] = ['confirmada', 'en-curso', 'finalizada'];
export interface MetricasReporte {
  dias: number;
  totalHabitaciones: number;
  nochesDisponibles: number;
  nochesVendidas: number;
  ocupacionPct: number;
  ingresoAlojamiento: number;
  ingresoServicios: number;
  ingresoTotal: number;
  adr: number;
  revpar: number;
  porDia: {
    fecha: string;
    ocupadas: number;
    ocupacionPct: number;
    ingreso: number;
  }[];
  porTipo: {
    tipo: TipoHabitacion;
    noches: number;
    ingreso: number;
  }[];
}
function sumarDia(iso: string,
  n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}
export function calcularMetricas(desde: string,
  hasta: string,
  reservas: Reserva[],
  habitaciones: HabitacionHotel[],
  tarifasBase: Record<TipoHabitacion, number>): MetricasReporte {
  const habPorId = new Map(habitaciones.map(h => [h.id, h]));
  const totalHabitaciones = habitaciones.length;
  let dias = 0;
  const porDia: MetricasReporte['porDia'] = [];
  const porTipoMap = new Map<TipoHabitacion, {
    noches: number;
    ingreso: number;
  }>();
  let nochesVendidas = 0;
  let ingresoAlojamiento = 0;
  for (let d = desde; d < hasta; d = sumarDia(d, 1)) {
    dias++;
    let ocupadas = 0;
    let ingresoDia = 0;
    for (const r of reservas) {
      if (!ESTADOS_CONTABLES.includes(r.estado))
        continue;
      if (!(r.fechaEntrada <= d && d < r.fechaSalida))
        continue;
      const hab = r.habitacionId ? habPorId.get(r.habitacionId) ?? null : null;
      const tarifa = hab ? hab.precioNoche : tarifasBase[r.tipoHabitacion];
      ocupadas++;
      nochesVendidas++;
      ingresoAlojamiento += tarifa;
      ingresoDia += tarifa;
      const acc = porTipoMap.get(r.tipoHabitacion) ?? { noches: 0, ingreso: 0 };
      acc.noches++;
      acc.ingreso += tarifa;
      porTipoMap.set(r.tipoHabitacion, acc);
    }
    porDia.push({
      fecha: d,
      ocupadas,
      ocupacionPct: totalHabitaciones > 0 ? Math.round((ocupadas / totalHabitaciones) * 100) : 0,
      ingreso: Math.round(ingresoDia * 100) / 100,
    });
  }
  let ingresoServicios = 0;
  for (const r of reservas) {
    if (!ESTADOS_CONTABLES.includes(r.estado))
      continue;
    for (const s of r.servicios) {
      const f = s.fecha.slice(0, 10);
      if (f >= desde && f < hasta)
        ingresoServicios += s.cantidad * s.precioUnitario;
    }
  }
  const nochesDisponibles = totalHabitaciones * dias;
  const ingresoTotal = ingresoAlojamiento + ingresoServicios;
  return {
    dias,
    totalHabitaciones,
    nochesDisponibles,
    nochesVendidas,
    ocupacionPct: nochesDisponibles > 0 ? Math.round((nochesVendidas / nochesDisponibles) * 100) : 0,
    ingresoAlojamiento: Math.round(ingresoAlojamiento * 100) / 100,
    ingresoServicios: Math.round(ingresoServicios * 100) / 100,
    ingresoTotal: Math.round(ingresoTotal * 100) / 100,
    adr: nochesVendidas > 0 ? Math.round((ingresoAlojamiento / nochesVendidas) * 100) / 100 : 0,
    revpar: nochesDisponibles > 0 ? Math.round((ingresoAlojamiento / nochesDisponibles) * 100) / 100 : 0,
    porDia,
    porTipo: Array.from(porTipoMap.entries())
      .map(([tipo, v]) => ({ tipo, noches: v.noches, ingreso: Math.round(v.ingreso * 100) / 100 }))
      .sort((a, b) => b.ingreso - a.ingreso),
  };
}
export function descargarCSV(nombre: string,
  filas: (string | number)[][]) {
  const csv = filas
    .map(fila => fila.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
export const ASISTENCIA_META: Record<EstadoAsistencia, {
  label: string;
  chip: string;
}> = {
  'presente': { label: 'Presente', chip: 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]' },
  'ausente': { label: 'Ausente', chip: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]' },
  'descanso': { label: 'Descanso', chip: 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]' },
  'pendiente': { label: 'Pendiente', chip: 'bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]' },
};
export const PERMISO_LABEL: Record<PermisoModulo, string> = {
  limpieza: 'Limpieza',
  roomservice: 'Room Service',
  recepcion: 'Recepción',
  admin: 'Administración',
  mantenimiento: 'Mantenimiento',
};
export const CATEGORIA_INSUMO: CategoriaInsumo[] = [
  'Lencería',
  'Amenidades',
  'Limpieza',
  'Minibar',
  'Alimentos y bebidas',
  'Mantenimiento',
  'Recepción y oficina',
];
export function diasHasta(iso: string): number {
  const a = new Date().setHours(0, 0, 0, 0);
  const b = new Date(iso + 'T00:00:00').getTime();
  return Math.round((b - a) / 86400000);
}
export function iconProps(size: number) {
  return { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75 } as const;
}
export function DownloadIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg {...iconProps(size)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>);
}
export function PlusIcon({ size = 12 }: {
  size?: number;
}) {
  return (<svg {...iconProps(size)} strokeWidth={2}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>);
}
export function AlertIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg {...iconProps(size)} strokeWidth={2}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>);
}
