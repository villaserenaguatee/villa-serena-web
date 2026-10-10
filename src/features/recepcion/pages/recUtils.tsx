import { statusBadge, statusTone } from './statusStyle';
import { calcularCuentaEstancia } from '@/lib/pms/cuentaEstancia';
import type { ReactNode } from 'react';
import type { EstadoReserva, EstadoHabHotel, EstadoSolicitudHuesped, PrioridadSolicitud, HabitacionHotel, Reserva, } from '@/lib/pms/types';
import { MONEDA, nochesEntre } from '@/data/pms';
import { leerTarifas } from '@/store/tarifasStore';
export function dinero(n: number): string {
  return `Q ${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}
export const RESERVA_META: Record<EstadoReserva, {
  label: string;
  chip: string;
}> = {
  'pendiente': { label: 'Pendiente', chip: 'bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]' },
  'confirmada': { label: 'Confirmada', chip: 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]' },
  'en-curso': { label: 'En curso', chip: 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]' },
  'finalizada': { label: 'Finalizada', chip: 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]' },
  'cancelada': { label: 'Cancelada', chip: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]' },
};
export const RECEPTION_RESERVA_META = Object.fromEntries(Object.entries(RESERVA_META).map(([key, value]) => [key, { ...value, chip: statusTone(key) }])) as typeof RESERVA_META;
export const HAB_META: Record<EstadoHabHotel, {
  label: string;
  chip: string;
  dot: string;
}> = {
  'disponible': { label: 'Disponible', chip: statusTone("disponible"), dot: '#22C55E' },
  'ocupada': { label: 'Ocupada', chip: statusTone("ocupada"), dot: '#EF4444' },
  'reservada': { label: 'Reservada', chip: statusTone("reservada"), dot: '#3B82F6' },
  'en-limpieza': { label: 'En limpieza', chip: statusTone("en-limpieza"), dot: '#FB923C' },
  'mantenimiento': { label: 'En mantenimiento', chip: statusTone("mantenimiento"), dot: '#94A3B8' },
};
export const HAB_TRANSICIONES: Record<EstadoHabHotel, EstadoHabHotel[]> = {
  'disponible': ['reservada', 'mantenimiento', 'en-limpieza'],
  'reservada': ['disponible', 'ocupada', 'mantenimiento'],
  'ocupada': ['en-limpieza'],
  'en-limpieza': ['disponible', 'mantenimiento'],
  'mantenimiento': ['disponible', 'en-limpieza'],
};
export function validarCambioEstadoHab(hab: HabitacionHotel,
  nuevo: EstadoHabHotel,
  reservas: Reserva[]): string | null {
  if (hab.estado === nuevo)
    return 'La habitación ya está en ese estado.';
  if (!HAB_TRANSICIONES[hab.estado].includes(nuevo)) {
    return `No se permite pasar de "${HAB_META[hab.estado].label}" a "${HAB_META[nuevo].label}".`;
  }
  const tieneEstanciaEnCurso = reservas.some(r => r.habitacionId === hab.id && r.estado === 'en-curso');
  if (tieneEstanciaEnCurso && (nuevo === 'disponible' || nuevo === 'mantenimiento' || nuevo === 'reservada')) {
    return 'La habitación tiene una estancia en curso; primero registra el check-out.';
  }
  return null;
}
export const SOLICITUD_META: Record<EstadoSolicitudHuesped, {
  label: string;
  chip: string;
}> = {
  'pendiente': { label: 'Pendiente', chip: statusTone('pendiente') },
  'en-proceso': { label: 'En proceso', chip: statusTone("en-proceso") },
  'atendida': { label: 'Atendida', chip: statusTone("atendida") },
};
export const PRIORIDAD_META: Record<PrioridadSolicitud, {
  label: string;
  chip: string;
  dot: string;
}> = {
  'alta': { label: 'Alta', chip: 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]', dot: '#F87171' },
  'media': { label: 'Media', chip: 'bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]', dot: '#F3D98B' },
  'baja': { label: 'Baja', chip: 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]', dot: '#4ADE80' },
};
export function Chip({ cls, children }: {
  cls: string;
  children: ReactNode;
}) {
  return (<span className={`inline-flex h-fit w-fit shrink-0 items-center whitespace-nowrap text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide border ${cls}`}>
    {children}
  </span>);
}
export function rangosSeSolapan(aIn: string, aOut: string, bIn: string, bOut: string): boolean {
  return aIn < bOut && bIn < aOut;
}
const ESTADOS_BLOQUEANTES: EstadoReserva[] = ['pendiente', 'confirmada', 'en-curso'];
export function habitacionTieneConflicto(habitacionId: string,
  entrada: string,
  salida: string,
  reservas: Reserva[],
  ignorarReservaId?: string): boolean {
  return reservas.some(r => r.id !== ignorarReservaId &&
    r.habitacionId === habitacionId &&
    ESTADOS_BLOQUEANTES.includes(r.estado) &&
    rangosSeSolapan(entrada, salida, r.fechaEntrada, r.fechaSalida));
}
export function habitacionesDisponibles(entrada: string,
  salida: string,
  habitaciones: HabitacionHotel[],
  reservas: Reserva[],
  opciones?: {
    personas?: number;
    tipo?: string;
    ignorarReservaId?: string;
  }): HabitacionHotel[] {
  const { personas, tipo, ignorarReservaId } = opciones ?? {};
  return habitaciones.filter(h => {
    if (h.estado === 'mantenimiento')
      return false;
    if (tipo && h.tipo !== tipo)
      return false;
    if (personas && h.capacidad < personas)
      return false;
    return !habitacionTieneConflicto(h.id, entrada, salida, reservas, ignorarReservaId);
  });
}
export interface ResumenCuenta {
  noches: number;
  precioNoche: number;
  alojamiento: number;
  servicios: number;
  subtotal: number;
  descuento: number;
  total: number;
  pagado: number;
  saldo: number;
}
export function calcularCuenta(reserva: Reserva,
  habitacion: HabitacionHotel | null): ResumenCuenta {
  return calcularCuentaEstancia(reserva, habitacion);
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
export function UserIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>);
}
export function CalendarIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>);
}
export function SearchIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
export const INPUT_CLS = 'w-full border border-[#E5E0D8] rounded-md px-3 py-2.5 text-sm text-[#1F2933] focus:outline-none focus:border-[#18345C] bg-white placeholder:text-[#AEBCC1]';
