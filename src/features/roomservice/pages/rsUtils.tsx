import type { ReactNode } from 'react';
import type { EstadoPedido, LineaPedido } from '@/lib/pms/types';
import { MONEDA } from '@/data/pms';
export function precio(n: number): string {
  return `${MONEDA}${n.toFixed(2)}`;
}
export function totalLineas(lineas: Pick<LineaPedido, 'precioUnitario' | 'cantidad'>[]): number {
  return lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0);
}
export const ESTADO_META: Record<EstadoPedido, {
  label: string;
  chip: string;
  dot: string;
  barra: string;
}> = {
  'nuevo': {
    label: 'Nuevo',
    chip: 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]',
    dot: '#3B82F6',
    barra: '#3B82F6',
  },
  'en-preparacion': {
    label: 'En preparación',
    chip: 'bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]',
    dot: '#FB923C',
    barra: '#FB923C',
  },
  'en-camino': {
    label: 'En camino',
    chip: 'bg-[#FEFCE8] text-[#854D0E] border-[#FACC15]',
    dot: '#EAB308',
    barra: '#EAB308',
  },
  'entregado': {
    label: 'Entregado',
    chip: 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]',
    dot: '#22C55E',
    barra: '#22C55E',
  },
  'cancelado': {
    label: 'Cancelado',
    chip: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]',
    dot: '#EF4444',
    barra: '#EF4444',
  },
};
export const SIGUIENTE_ESTADO: Record<EstadoPedido, EstadoPedido | null> = {
  'nuevo': 'en-preparacion',
  'en-preparacion': 'en-camino',
  'en-camino': 'entregado',
  'entregado': null,
  'cancelado': null,
};
export const ACCION_AVANZAR: Record<EstadoPedido, string> = {
  'nuevo': 'Marcar en preparación',
  'en-preparacion': 'Marcar en camino',
  'en-camino': 'Marcar entregado',
  'entregado': '',
  'cancelado': '',
};
export function esTerminal(estado: EstadoPedido): boolean {
  return estado === 'entregado' || estado === 'cancelado';
}
export function ChipEstado({ estado }: {
  estado: EstadoPedido;
}) {
  const m = ESTADO_META[estado];
  return (<span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide border ${m.chip}`}>
    {m.label}
  </span>);
}
export function BedIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true">
    <path d="M3 7v10" />
    <path d="M21 10v7" />
    <path d="M3 13h18" />
    <path d="M5 13V9.5A1.5 1.5 0 0 1 6.5 8h3A1.5 1.5 0 0 1 11 9.5V13" />
    <path d="M11 13v-2a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v1" />
  </svg>);
}
export function ClockIcon({ size = 12 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>);
}
export function BellIcon({ size = 18 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>);
}
export function PhoneIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>);
}
export function PlusIcon({ size = 12 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>);
}
export function CloseIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>);
}
export function Campo({ label, error, children, }: {
  label: string;
  error?: string;
  children: ReactNode;
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
