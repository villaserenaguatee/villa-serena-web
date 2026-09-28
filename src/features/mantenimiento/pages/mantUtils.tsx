import { useEffect } from 'react';
import type { ReactNode } from 'react';
import type { EstadoOT, TipoAveria, CategoriaActivo, EstadoActivo, FrecuenciaPreventivo, OrigenOT, OrdenTrabajo, } from '@/lib/pms/types';
import { fechaHoyISO } from '@/data/pms';
export { dinero, Chip, Campo, INPUT_CLS, HAB_META, PRIORIDAD_META, HAB_TRANSICIONES, validarCambioEstadoHab, BedIcon, PlusIcon, CloseIcon, CalendarIcon, UserIcon, SearchIcon, } from '@/features/recepcion/pages/recUtils';
export const ESTADO_OT_META: Record<EstadoOT, {
  label: string;
  chip: string;
  dot: string;
}> = {
  'abierta': { label: 'Abierta', chip: 'bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]', dot: '#F3D98B' },
  'asignada': { label: 'Pendiente', chip: 'bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]', dot: '#D8B94E' },
  'en-proceso': { label: 'En proceso', chip: 'bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]', dot: '#FB923C' },
  'resuelta': { label: 'Resuelta', chip: 'bg-[#FEFCE8] text-[#854D0E] border-[#FACC15]', dot: '#EAB308' },
  'cerrada': { label: 'Cerrada', chip: 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]', dot: '#22C55E' },
  'cancelada': { label: 'Cancelada', chip: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]', dot: '#EF4444' },
};
export const SIGUIENTE_ESTADO_OT: Record<EstadoOT, EstadoOT | null> = {
  'abierta': 'en-proceso',
  'asignada': 'en-proceso',
  'en-proceso': 'resuelta',
  'resuelta': 'cerrada',
  'cerrada': null,
  'cancelada': null,
};
export const ACCION_AVANZAR_OT: Record<EstadoOT, string> = {
  'abierta': 'Iniciar tarea',
  'asignada': 'Iniciar tarea',
  'en-proceso': 'Resuelta',
  'resuelta': 'Finalizar trabajo',
  'cerrada': '',
  'cancelada': '',
};
export function esTerminalOT(estado: EstadoOT): boolean {
  return estado === 'cerrada' || estado === 'cancelada';
}
export const ORIGEN_LABEL: Record<OrigenOT, string> = {
  incidencia: 'Incidencia reportada',
  interna: 'Detección interna',
  preventivo: 'Plan preventivo',
};
export const TIPOS_AVERIA: TipoAveria[] = [
  'Fuga de agua',
  'Avería técnica',
  'Daño en mobiliario',
  'Problema eléctrico',
  'Otro',
];
export const CATEGORIAS_ACTIVO: CategoriaActivo[] = [
  'Climatización',
  'Electricidad',
  'Fontanería',
  'Mobiliario',
  'Ascensores',
  'Cocina',
  'Refrigeración',
  'Equipos de Spa',
  'Gimnasio',
  'Piscina',
  'Seguridad',
  'Lavandería',
  'Otros',
];
export const ACTIVO_META: Record<EstadoActivo, {
  label: string;
  chip: string;
}> = {
  'operativo': { label: 'Operativo', chip: 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]' },
  'en-reparacion': { label: 'En reparación', chip: 'bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]' },
  'fuera-servicio': { label: 'Fuera de servicio', chip: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]' },
};
export const FRECUENCIA_LABEL: Record<FrecuenciaPreventivo, string> = {
  semanal: 'Semanal',
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  otra: 'Otra',
};
export function diasHastaFecha(iso: string): number {
  const hoy = new Date(fechaHoyISO() + 'T00:00:00').getTime();
  const f = new Date(iso + 'T00:00:00').getTime();
  return Math.round((f - hoy) / 86400000);
}
export function estaAtrasada(o: OrdenTrabajo): boolean {
  if (esTerminalOT(o.estado) || o.estado === 'resuelta')
    return false;
  return diasHastaFecha(o.fechaCompromiso) < 0;
}
export function costoRepuestos(o: OrdenTrabajo): number {
  return o.repuestos.reduce((s, r) => s + r.cantidad * r.costoUnitario, 0);
}
export function Modal({ titulo, subtitulo, onCerrar, children, ancho = 'sm:max-w-2xl', }: {
  titulo: string;
  subtitulo?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape')
        onCerrar();
    }
    document.addEventListener('keydown', onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previo;
    };
  },
    [onCerrar]);
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={titulo}>
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

    <div className={`relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${ancho} max-h-[92vh] overflow-y-auto`}>
      <div className="sticky top-0 bg-white border-b border-[#E5E0D8] px-4 sm:px-6 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] font-semibold text-[#18345C] leading-tight">
            {titulo}
          </h2>
          {subtitulo && <div className="text-[13px] text-[#6B7280] mt-0.5">
            {subtitulo}
          </div>}
        </div>
        <button
          onClick={onCerrar}
          aria-label="Cerrar"
          className="shrink-0 w-11 h-11 -mr-2 -mt-1 flex items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#F8F6F0] hover:text-[#18345C] transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="px-4 sm:px-6 py-5">
        {children}
      </div>
    </div>
  </div>);
}
export function Kpi({ valor, label, color = '#18345C' }: {
  valor: string;
  label: string;
  color?: string;
}) {
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <p className="text-[20px] font-bold leading-none" style={{ color }}>
      {valor}
    </p>
    <p className="text-[11px] text-[#6B7280] mt-1">
      {label}
    </p>
  </div>);
}
export function BotonFiltro({ activo, onClick, children, }: {
  activo: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (<button
    onClick={onClick}
    className={`text-[13px] font-medium px-3 py-2 rounded-md border transition-colors ${activo
      ? 'bg-[#18345C] text-white border-[#18345C]'
      : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
    {children}
  </button>);
}
export function Vacio({ msg }: {
  msg: string;
}) {
  return (<div className="bg-white border border-[#E5E0D8] rounded-xl p-5 text-center">
    <p className="text-[15px] text-[#AEBCC1]">
      {msg}
    </p>
  </div>);
}
export function Cabecera({ titulo, subtitulo, children, }: {
  titulo: string;
  subtitulo: string;
  children?: ReactNode;
}) {
  return (<div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
    <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
      <div>
        <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">
          {titulo}
        </h1>
        <p className="text-[14px] text-[#AEBCC1] mt-1">
          {subtitulo}
        </p>
      </div>
      {children && <div className="flex gap-2 flex-wrap">
        {children}
      </div>}
    </div>
  </div>);
}
function ip(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}
export function WrenchIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
  </svg>);
}
export function AlertIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>);
}
export function ClockIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>);
}
export function CheckIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <polyline points="20 6 9 17 4 12" />
  </svg>);
}
export function BoxIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M20 7 12 3 4 7l8 4 8-4Z" />
    <path d="M4 7v10l8 4 8-4V7" />
    <path d="M12 11v10" />
  </svg>);
}
