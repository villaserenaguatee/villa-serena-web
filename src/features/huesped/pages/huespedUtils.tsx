import { useEffect } from "react";
import type { ReactNode } from "react";
import type { EstadoPedidoHuesped, PedidoHuesped, CargoHuesped, CategoriaCargo, MetodoPagoHuesped, TurnoAmenidad, } from "@/lib/pms/types";
import { PUNTOS_POR_MONEDA } from "@/data/pms";
import { Campo as CampoBase } from "@/features/recepcion/pages/recUtils";
import { useUiText } from "@/i18n/UiText";
export { dinero, Chip, INPUT_CLS, RESERVA_META, habitacionesDisponibles, BedIcon, PlusIcon, CloseIcon, CalendarIcon, UserIcon, SearchIcon, } from "@/features/recepcion/pages/recUtils";
export function Campo({ label, error, children }: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const ui = useUiText();
  return <CampoBase label={ui(label)} error={error ? ui(error) : undefined}>
    {children}
  </CampoBase>;
}
export const ESTADO_PEDIDO_META: Record<EstadoPedidoHuesped, {
  label: string;
  chip: string;
  dot: string;
  descripcion: string;
}> = {
  recibido: {
    label: "Recibido",
    chip: "bg-[#FFFBEF] text-[#78450A] border-[#F3D98B]",
    dot: "#F3D98B",
    descripcion: "Tu pedido llegó al área correspondiente.",
  },
  "en-preparacion": {
    label: "En preparación",
    chip: "bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]",
    dot: "#3B82F6",
    descripcion: "Lo estamos preparando en este momento.",
  },
  "en-camino": {
    label: "En camino",
    chip: "bg-[#FFF7ED] text-[#9A3412] border-[#FDBA74]",
    dot: "#FB923C",
    descripcion: "Va en camino a tu habitación.",
  },
  entregado: {
    label: "Entregado",
    chip: "bg-[#F0FAF4] text-[#166534] border-[#86EFAC]",
    dot: "#22C55E",
    descripcion: "Entregado. ¡Que lo disfrutes!",
  },
  cancelado: {
    label: "Cancelado",
    chip: "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]",
    dot: "#EF4444",
    descripcion: "El pedido fue cancelado.",
  },
};
export const SIGUIENTE_ESTADO_PEDIDO: Record<EstadoPedidoHuesped, EstadoPedidoHuesped | null> = {
  recibido: "en-preparacion",
  "en-preparacion": "en-camino",
  "en-camino": "entregado",
  entregado: null,
  cancelado: null,
};
export const PASOS_PEDIDO: EstadoPedidoHuesped[] = [
  "recibido",
  "en-preparacion",
  "en-camino",
  "entregado",
];
export function pedidoActivo(p: PedidoHuesped): boolean {
  return p.estado !== "entregado" && p.estado !== "cancelado";
}
export function totalPedido(p: PedidoHuesped): number {
  return p.lineas.reduce((s, l) => s + l.cantidad * l.precioUnitario, 0);
}
export const CATEGORIAS_CARGO: CategoriaCargo[] = [
  "Estancia",
  "Restaurante",
  "Room service",
  "Servicios",
  "Spa y experiencias",
];
export interface ResumenCuentaHuesped {
  noches: number;
  precioNoche: number;
  alojamiento: number;
  extras: number;
  descuento: number;
  total: number;
  anticipo: number;
  abonado: number;
  pagado: number;
  saldo: number;
}
export function totalCargos(cargos: CargoHuesped[]): number {
  return cargos.reduce((s, c) => s + c.cantidad * c.precioUnitario, 0);
}
export const METODO_PAGO_LABEL: Record<MetodoPagoHuesped, string> = {
  tarjeta: "Tarjeta de crédito",
  debito: "Tarjeta de débito",
  puntos: "Puntos de fidelidad",
  recepcion: "Pagar en Recepción",
};
export function puntosDeMonto(monto: number): number {
  return Math.ceil(monto * PUNTOS_POR_MONEDA);
}
export function montoDePuntos(puntos: number): number {
  return Math.round((puntos / PUNTOS_POR_MONEDA) * 100) / 100;
}
export function formatoPuntos(p: number): string {
  return p.toLocaleString("es-GT");
}
export function plazasLibres(t: TurnoAmenidad): number {
  return Math.max(0, t.aforo - t.ocupados);
}
export function turnoLleno(t: TurnoAmenidad): boolean {
  return plazasLibres(t) === 0;
}
export function correoValido(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}
export function telefonoValido(v: string): boolean {
  return v.replace(/\D/g, "").length >= 8;
}
export function ultimos4(numero: string): string {
  const d = numero.replace(/\D/g, "");
  return d.slice(-4).padStart(4, "•");
}
export function formatoTarjeta(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 16);
  return d.replace(/(.{4})/g, "$1 ").trim();
}
export function Modal({ titulo, subtitulo, onCerrar, children, ancho = "sm:max-w-2xl", }: {
  titulo: string;
  subtitulo?: ReactNode;
  onCerrar: () => void;
  children: ReactNode;
  ancho?: string;
}) {
  const ui = useUiText();
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape")
        onCerrar();
    }
    document.addEventListener("keydown", onKey);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previo;
    };
  },
    [onCerrar]);
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-label={ui(titulo)}>
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

    <div className={`relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full ${ancho} max-h-[92vh] overflow-y-auto`}>
      <div className="sticky top-0 bg-white border-b border-[#E5E0D8] px-4 sm:px-6 py-4 flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <h2 className="text-[20px] font-semibold text-[#18345C] leading-tight">
            {ui(titulo)}
          </h2>
          {subtitulo && (<div className="text-[13px] text-[#6B7280] mt-0.5">
            {typeof subtitulo === "string" ? ui(subtitulo) : subtitulo}
          </div>)}
        </div>
        <button
          onClick={onCerrar}
          aria-label={ui("Cerrar")}
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
export function Cabecera({ titulo, subtitulo, children, }: {
  titulo: string;
  subtitulo: string;
  children?: ReactNode;
}) {
  const ui = useUiText();
  return (<div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div>
        <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">
          {ui(titulo)}
        </h1>
        <p className="text-[14px] text-[#AEBCC1] mt-1">
          {ui(subtitulo)}
        </p>
      </div>
      {children && <div className="flex gap-2 flex-wrap">
        {children}
      </div>}
    </div>
  </div>);
}
export function Kpi({ valor, label, color = "#18345C", }: {
  valor: string;
  label: string;
  color?: string;
}) {
  const ui = useUiText();
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <p className="text-[20px] font-bold leading-none" style={{ color }}>
      {valor}
    </p>
    <p className="text-[11px] text-[#6B7280] mt-1">
      {ui(label)}
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
      ? "bg-[#18345C] text-white border-[#18345C]"
      : "bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]"}`}>
    {children}
  </button>);
}
export function Vacio({ msg }: {
  msg: string;
}) {
  const ui = useUiText();
  return (<div className="bg-white border border-[#E5E0D8] rounded-xl p-8 text-center">
    <p className="text-[15px] text-[#AEBCC1]">
      {ui(msg)}
    </p>
  </div>);
}
export function Tarjeta({ titulo, extra, children, }: {
  titulo?: string;
  extra?: ReactNode;
  children: ReactNode;
}) {
  const ui = useUiText();
  return (<div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
    {titulo && (<div className="px-4 sm:px-5 py-3.5 border-b border-[#E5E0D8] flex items-center gap-3">
      <h2 className="text-[17px] font-semibold text-[#18345C] flex-1">
        {ui(titulo)}
      </h2>
      {extra}
    </div>)}
    <div className="px-4 sm:px-5 py-4">
      {children}
    </div>
  </div>);
}
export function BotonPrimario({ onClick, children, ancho = false, disabled = false, }: {
  onClick: () => void;
  children: ReactNode;
  ancho?: boolean;
  disabled?: boolean;
}) {
  return (<button
    onClick={onClick}
    disabled={disabled}
    className={`px-4 py-3 min-h-[44px] text-[15px] font-semibold rounded-md transition-colors ${ancho ? "w-full" : ""} ${disabled
      ? "bg-[#E5E0D8] text-[#AEBCC1] cursor-not-allowed"
      : "bg-[#18345C] text-white hover:bg-[#102747]"}`}>
    {children}
  </button>);
}
export function BotonSecundario({ onClick, children, ancho = false, }: {
  onClick: () => void;
  children: ReactNode;
  ancho?: boolean;
}) {
  return (<button
    onClick={onClick}
    className={`px-4 py-3 min-h-[44px] text-[15px] font-semibold border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors ${ancho ? "w-full" : ""}`}>
    {children}
  </button>);
}
export function Aviso({ tono = "info", children, }: {
  tono?: "info" | "exito" | "alerta" | "error";
  children: ReactNode;
}) {
  const cls = {
    info: "bg-[#EFF6FF] border-[#93C5FD] text-[#1E40AF]",
    exito: "bg-[#F0FAF4] border-[#86EFAC] text-[#166534]",
    alerta: "bg-[#FFFBEF] border-[#F3D98B] text-[#78450A]",
    error: "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]",
  }[tono];
  return (<div className={`border rounded-lg px-4 py-3 text-[13px] ${cls}`}>
    {children}
  </div>);
}
const QR_LADO = 25;
function esquina(f: number,
  c: number): boolean {
  const zonas = [
    [0, 0],
    [0, QR_LADO - 7],
    [QR_LADO - 7, 0],
  ];
  return zonas.some(([zf, zc]) => {
    const df = f - zf;
    const dc = c - zc;
    if (df < 0 || df > 6 || dc < 0 || dc > 6)
      return false;
    const borde = df === 0 || df === 6 || dc === 0 || dc === 6;
    const centro = df >= 2 && df <= 4 && dc >= 2 && dc <= 4;
    return borde || centro;
  });
}
function enZonaEsquina(f: number, c: number): boolean {
  return ((f <= 7 && c <= 7) ||
    (f <= 7 && c >= QR_LADO - 8) ||
    (f >= QR_LADO - 8 && c <= 7));
}
export function CodigoQR({ texto, tamano = 180, }: {
  texto: string;
  tamano?: number;
}) {
  let semilla = 7;
  for (const ch of texto)
    semilla = (semilla * 33 + ch.charCodeAt(0)) % 100003;
  const celdas: boolean[] = [];
  for (let f = 0; f < QR_LADO; f++) {
    for (let c = 0; c < QR_LADO; c++) {
      if (esquina(f, c)) {
        celdas.push(true);
      }
      else if (enZonaEsquina(f, c)) {
        celdas.push(false);
      }
      else {
        semilla = (semilla * 1103515245 + 12345) % 2147483648;
        celdas.push(semilla % 100 < 46);
      }
    }
  }
  return (<div className="bg-white p-3 rounded-xl border border-[#E5E0D8] shrink-0" role="img" aria-label={`Código QR de acceso ${texto}`}>
    <div
      className="grid"
      style={{
        width: tamano,
        height: tamano,
        gridTemplateColumns: `repeat(${QR_LADO}, 1fr)`,
        gridTemplateRows: `repeat(${QR_LADO}, 1fr)`,
      }}>
      {celdas.map((activa, i) => (<div key={i} style={{ backgroundColor: activa ? "#102747" : "transparent" }} />))}
    </div>
  </div>);
}
function ip(size: number) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
}
export function KeyIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m10.7 12.3 8.8-8.8" />
    <path d="m17 6 3 3" />
    <path d="m14 9 3 3" />
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
export function AlertIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>);
}
export function CartIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.3 4.3A1 1 0 0 0 6 19h12" />
    <circle cx="9" cy="21" r="1" />
    <circle cx="18" cy="21" r="1" />
  </svg>);
}
export function ChatIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>);
}
export function WifiIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M5 12.55a11 11 0 0 1 14 0" />
    <path d="M8.5 16.05a6 6 0 0 1 7 0" />
    <path d="M2 8.82a15 15 0 0 1 20 0" />
    <line x1="12" y1="20" x2="12.01" y2="20" />
  </svg>);
}
export function ThermoIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z" />
  </svg>);
}
export function LightIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M12 2a7 7 0 0 0-4 12.7V18h8v-3.3A7 7 0 0 0 12 2Z" />
  </svg>);
}
export function CurtainIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M3 3h18" />
    <path d="M6 3v18c3 0 5-4 5-9V3" />
    <path d="M18 3v18c-3 0-5-4-5-9V3" />
  </svg>);
}
export function DoorIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M14 21V4a1 1 0 0 0-1.2-1L6.6 4.3A1 1 0 0 0 6 5.2V21" />
    <path d="M4 21h16" />
    <circle cx="11" cy="12.5" r="0.6" fill="currentColor" />
  </svg>);
}
export function ReceiptIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M5 3v18l2.5-1.5L10 21l2-1.5L14 21l2.5-1.5L19 21V3z" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="9" y1="12" x2="15" y2="12" />
  </svg>);
}
export function SparkIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    <path d="M6.3 6.3 9 9M15 15l2.7 2.7M17.7 6.3 15 9M9 15l-2.7 2.7" />
  </svg>);
}
export function UploadIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>);
}
export function PenIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>);
}
export function CardIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <line x1="2" y1="10" x2="22" y2="10" />
  </svg>);
}
export function StarIcon({ size = 16 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>);
}
export function MailIcon({ size = 14 }: {
  size?: number;
}) {
  return (<svg {...ip(size)}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 6-10 7L2 6" />
  </svg>);
}
