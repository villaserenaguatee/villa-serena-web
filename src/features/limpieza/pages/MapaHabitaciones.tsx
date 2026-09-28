import { useState } from "react";
import type { Habitacion, Solicitud, EstadoHabitacion } from "@/lib/pms/types";
type FiltroPiso = "todos" | "1" | "2" | "3";
type FiltroEstado = "todos" | "limpia" | "pendiente" | "en-limpieza" | "prioritarias";
const ESTADO_CONFIG = {
  limpia: {
    label: "Limpia",
    bg: "#ECFDF3",
    border: "#86EFAC",
    text: "#15803D",
  },
  pendiente: {
    label: "Pendiente",
    bg: "#FFF9E8",
    border: "#F3D98B",
    text: "#9A6700",
  },
  "en-limpieza": {
    label: "En limpieza",
    bg: "#EFF6FF",
    border: "#93C5FD",
    text: "#1D4ED8",
  },
} as const;
type EstadoLimpiezaVisual = keyof typeof ESTADO_CONFIG;
function obtenerTipoHabitacion(tipo: string): string {
  if (tipo === "Standard")
    return "Estándar";
  return tipo;
}
function obtenerEstadoLimpieza(hab: Habitacion): EstadoLimpiezaVisual {
  const total = hab.tareas.length;
  const completadas = hab.tareas.filter((t) => t.completada).length;
  if (hab.estado === "limpia" && total > 0 && completadas === total) {
    return "limpia";
  }
  if (completadas === 0) {
    return "pendiente";
  }
  return "en-limpieza";
}
function esPrioritaria(hab: Habitacion) {
  return Boolean(hab.proximaLlegada) && obtenerEstadoLimpieza(hab) !== "limpia";
}
function TarjetaHabitacion({ hab, onClick }: {
  hab: Habitacion;
  onClick?: () => void;
}) {
  const estadoVisual = obtenerEstadoLimpieza(hab);
  const estadoFueraServicio = hab.estado === "fuera-servicio";
  const cfg = estadoFueraServicio
    ? {
      label: "Fuera de servicio",
      bg: "#FEF2F2",
      border: "#FCA5A5",
      text: "#DC2626",
    }
    : ESTADO_CONFIG[estadoVisual];
  return (<button
    type="button"
    onClick={onClick}
    className="
        text-left w-full rounded-xl
        border
        border-[#E5E0D8]
        bg-white
        p-4
        min-h-[130px]
        flex
        flex-col
        justify-center
      ">
    <img src={hab.foto} alt={`Habitación ${hab.numero}`} className="w-full h-24 object-cover rounded-lg mb-3" />
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[#F8F6F0] flex items-center justify-center shrink-0">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#18345C"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true">
              <path d="M3 7v10" />
              <path d="M21 10v7" />
              <path d="M3 13h18" />
              <path d="M5 13V9.5A1.5 1.5 0 0 1 6.5 8h3A1.5 1.5 0 0 1 11 9.5V13" />
              <path d="M11 13v-2a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v1" />
            </svg>
          </span>

          <p className="text-[28px] font-semibold text-[#18345C] leading-none">
            {hab.numero}
          </p>
        </div>

        <p className="text-[14px] text-[#6B7280] mt-1 ml-10">
          {obtenerTipoHabitacion(hab.tipo)}
        </p>
      </div>

      <span
        className="text-[10px] sm:text-[11px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide whitespace-nowrap"
        style={{
          color: cfg.text,
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.border}`,
        }}>
        {cfg.label}
      </span>
    </div>
  </button>);
}
interface PanelProps {
  hab: Habitacion;
  solicitudes: Solicitud[];
  usuarioActual: string;
  onClose: () => void;
  onComenzarLimpieza: (id: string) => void;
  onToggleTarea: (habId: string, tareaId: string) => void;
  onFinalizarLimpieza: (id: string) => void;
  onGuardarObservaciones: (id: string, obs: string) => void;
  onIrIncidencias: () => void;
}
function PanelDetalle({ hab, solicitudes, usuarioActual, onClose, onComenzarLimpieza, onToggleTarea, onFinalizarLimpieza, onGuardarObservaciones, onIrIncidencias, }: PanelProps) {
  const [obs, setObs] = useState(hab.observaciones ?? "");
  const [mostrarTareasRealizadas, setMostrarTareasRealizadas] = useState(false);
  const estadoVisual = obtenerEstadoLimpieza(hab);
  const cfg = ESTADO_CONFIG[estadoVisual];
  const tareasDone = hab.tareas.filter((t) => t.completada).length;
  const total = hab.tareas.length;
  const porcentaje = total > 0 ? Math.round((tareasDone / total) * 100) : 0;
  const todasCompletadas = total > 0 && tareasDone === total;
  const esPropia = hab.personal === usuarioActual;
  const solHab = solicitudes.filter((s) => s.habitacionNumero === hab.numero);
  const tareasNormales = hab.tareas.filter((t) => t.nombre.toLowerCase() !== "realizar inspección final");
  const tareaInspeccion = hab.tareas.find((t) => t.nombre.toLowerCase() === "realizar inspección final");
  const todasAnterioresCompletadas = tareasNormales.length > 0 && tareasNormales.every((t) => t.completada);
  const manejarTarea = (tareaId: string,
    yaCompletada: boolean) => {
    if (!esPropia)
      return;
    const esInspeccionFinal = tareaInspeccion?.id === tareaId;
    if (esInspeccionFinal && !todasAnterioresCompletadas) {
      return;
    }
    if (!yaCompletada && tareasDone === 0 && estadoVisual === "pendiente") {
      onComenzarLimpieza(hab.id);
    }
    onToggleTarea(hab.id, tareaId);
  };
  const renderTarea = (t: (typeof hab.tareas)[number],
    destacada = false) => {
    const bloqueadaPorSecuencia = destacada && !todasAnterioresCompletadas && !t.completada;
    return (<button
      key={t.id}
      type="button"
      onClick={() => manejarTarea(t.id, t.completada)}
      disabled={!esPropia || bloqueadaPorSecuencia}
      className={`
          w-full
          text-left
          flex
          items-center
          gap-2.5
          rounded-md
          border
          px-3
          py-2
          transition-all

          ${destacada
          ? bloqueadaPorSecuencia
            ? "border-[#E5E0D8] bg-[#F8F6F0]"
            : "border-[#D8B94E] bg-[#FFFBEF]"
          : t.completada
            ? "border-[#DDE7E2] bg-[#F8FCFA]"
            : "border-[#E5E0D8] bg-white"}

          ${esPropia && !bloqueadaPorSecuencia
          ? "hover:border-[#D8B94E] cursor-pointer"
          : "cursor-not-allowed"}
        `}>
      <span className={`
            w-[18px]
            h-[18px]
            rounded
            border-2
            flex
            items-center
            justify-center
            shrink-0

            ${t.completada
          ? "bg-[#18345C] border-[#18345C]"
          : bloqueadaPorSecuencia
            ? "bg-[#F8F6F0] border-[#CBD5E1]"
            : "bg-white border-[#AEBCC1]"}
          `}>
        {t.completada && (<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
          <polyline points="20 6 9 17 4 12" />
        </svg>)}
      </span>

      <span className={`
            block
            text-[13px]
            leading-snug
            font-medium
            ${bloqueadaPorSecuencia
          ? "text-[#AEBCC1]"
          : t.completada
            ? "text-[#6B7280]"
            : "text-[#1F2933]"}
          `}>
        {t.nombre}
      </span>

      {bloqueadaPorSecuencia && (<svg
        className="ml-auto shrink-0 text-[#AEBCC1]"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden="true">
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>)}
    </button>);
  };
  return (<div className="absolute inset-0 z-20 flex items-stretch justify-end">
    <div className="absolute inset-0 bg-black/25" onClick={onClose} />

    <div className="
          relative
          z-10
          w-full
          sm:max-w-lg
          bg-[#F8F6F0]
          shadow-2xl
          flex
          flex-col
          overflow-hidden
        ">

      <div className="relative h-36 sm:h-40 shrink-0 overflow-hidden">
        <img src={hab.foto} alt={`Habitación ${hab.numero}`} className="w-full h-full object-cover" />

        <div className="absolute inset-0 bg-gradient-to-t from-[#102747]/90 via-[#18345C]/20 to-transparent" />

        <button
          onClick={onClose}
          className="
              absolute
              top-3
              right-3
              w-9
              h-9
              bg-white/25
              backdrop-blur-sm
              rounded-full
              flex
              items-center
              justify-center
              hover:bg-white/40
              transition-colors
            ">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="absolute bottom-4 left-4">
          <div className="flex items-center gap-2 text-white">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v10" />
              <path d="M21 10v7" />
              <path d="M3 13h18" />
              <path d="M5 13V9.5A1.5 1.5 0 0 1 6.5 8h3A1.5 1.5 0 0 1 11 9.5V13" />
              <path d="M11 13v-2a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v1" />
            </svg>

            <p className="text-2xl sm:text-3xl font-bold leading-none">
              {hab.numero}
            </p>
          </div>

          <p className="text-white/85 text-sm mt-1 ml-8">
            {obtenerTipoHabitacion(hab.tipo)}
          </p>
        </div>

        <div className="absolute bottom-4 right-4">
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-md uppercase tracking-wide border"
            style={{
              color: cfg.text,
              backgroundColor: cfg.bg,
              borderColor: cfg.border,
            }}>
            {cfg.label}
          </span>
        </div>
      </div>

      {(hab.proximaLlegada || hab.estado === "fuera-servicio") && (<div className="px-4 py-3 bg-white border-b border-[#E5E0D8] flex gap-3 flex-wrap">
        {hab.proximaLlegada && (<div className="flex items-center gap-1.5 text-xs text-[#B88A18] font-medium">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          Próxima llegada: {hab.proximaLlegada}
        </div>)}

        {hab.estado === "fuera-servicio" && (<span className="text-xs font-semibold text-red-600">
          Fuera de servicio
        </span>)}
      </div>)}

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">

        {estadoVisual === "limpia" && !mostrarTareasRealizadas ? (<section className="bg-white border border-[#DDE7E2] rounded-lg p-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#ECFDF3] flex items-center justify-center shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#15803D" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#18345C]">
                Limpieza completada
              </h3>

              <p className="text-xs text-[#6B7280] mt-0.5">
                {tareasDone} de {total} tareas realizadas
              </p>

              <div className="mt-2 h-1 bg-[#EEF0F2] rounded-full overflow-hidden">
                <div className="h-full w-full bg-[#15803D] rounded-full" />
              </div>

              <button
                type="button"
                onClick={() => setMostrarTareasRealizadas(true)}
                className="mt-3 text-[11px] font-semibold text-[#18345C] hover:text-[#D8B94E] transition-colors">
                Ver tareas realizadas
              </button>
            </div>
          </div>
        </section>) : (<section className="bg-white border border-[#E5E0D8] rounded-lg p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <div>
              <h3 className="text-sm font-semibold text-[#18345C]">
                Tareas de limpieza
              </h3>

              <p className="text-[10px] text-[#AEBCC1] mt-0.5">
                Completa todas las tareas antes de finalizar.
              </p>
            </div>

            <div className="text-right">
              <span className="block text-sm font-semibold text-[#18345C]">
                {tareasDone} de {total}
              </span>
              <span className="text-[10px] text-[#AEBCC1]">
                {porcentaje}%
              </span>
            </div>
          </div>

          <div className="h-1 bg-[#EEF0F2] rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full bg-[#18345C] transition-all" style={{ width: `${porcentaje}%` }} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
            {tareasNormales.map((t) => renderTarea(t))}
          </div>

          {tareaInspeccion && (<div className="mt-2 md:col-span-2">
            {renderTarea(tareaInspeccion, true)}
          </div>)}

          {estadoVisual === "limpia" && mostrarTareasRealizadas && (<button
            type="button"
            onClick={() => setMostrarTareasRealizadas(false)}
            className="mt-3 text-[11px] font-semibold text-[#18345C] hover:text-[#D8B94E] transition-colors">
            Ocultar tareas realizadas
          </button>)}
        </section>)}

        {solHab.length > 0 && (<section className="bg-white border border-[#E5E0D8] rounded-lg p-3">
          <h3 className="text-sm font-semibold text-[#18345C] mb-3">
            Solicitudes relacionadas
          </h3>

          <div className="space-y-2">
            {solHab.map((s) => (<div key={s.id} className="flex items-center gap-3 bg-[#F8F6F0] rounded-lg px-3 py-2.5">
              <span className={`
                        w-2
                        h-2
                        rounded-full
                        shrink-0

                        ${s.estado === "pendiente"
                  ? "bg-yellow-400"
                  : s.estado === "en-proceso" || s.estado === "en-limpieza"
                    ? "bg-blue-400"
                    : "bg-green-400"}
                      `} />

              <span className="flex-1 text-[#1F2933] text-xs">
                {s.descripcion}
                {s.cantidad ? ` (${s.cantidad})` : ""}
              </span>

              <span className="text-[10px] text-[#AEBCC1] shrink-0">
                {s.hora}
              </span>
            </div>))}
          </div>
        </section>)}

        <section className="bg-white border border-[#E5E0D8] rounded-lg p-3">
          <div className="flex items-center justify-between gap-2 mb-2">
            <h3 className="text-sm font-semibold text-[#18345C]">
              Observaciones de limpieza
            </h3>

            {estadoVisual !== "limpia" && (<span className="text-[10px] text-[#AEBCC1]">
              Opcional
            </span>)}
          </div>

          {estadoVisual === "limpia" ? (<div className="text-sm text-[#6B7280] bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-3 whitespace-pre-wrap">
            {hab.observaciones?.trim() || ""}
          </div>) : esPropia ? (<>
            <textarea
              rows={3}
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Agregar una observación sobre el servicio..."
              className="
                    w-full
                    border
                    border-[#E5E0D8]
                    rounded-lg
                    px-3
                    py-2.5
                    text-sm
                    text-[#1F2933]
                    placeholder:text-[#AEBCC1]
                    resize-none
                    focus:outline-none
                    focus:border-[#18345C]
                    transition-colors
                    bg-[#F8F6F0]
                  "/>

            <button
              type="button"
              onClick={() => onGuardarObservaciones(hab.id, obs)}
              className="mt-2 text-xs text-[#18345C] hover:text-[#D8B94E] font-medium transition-colors">
              Guardar observación
            </button>
          </>) : (<div className="text-sm text-[#6B7280] bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-3 whitespace-pre-wrap">
            {hab.observaciones?.trim() || ""}
          </div>)}
        </section>
      </div>

      {esPropia && estadoVisual !== "limpia" && (<div className="px-3 py-3 bg-white border-t border-[#E5E0D8] flex flex-col sm:flex-row gap-3 shrink-0">
        <button
          onClick={onIrIncidencias}
          className="flex-1 py-2.5 text-xs font-medium border border-[#18345C] text-[#18345C] rounded-lg hover:bg-[#F8F6F0] transition-colors">
          Reportar incidencia
        </button>

        <button
          onClick={() => onFinalizarLimpieza(hab.id)}
          disabled={!todasCompletadas}
          className="
                flex-1
                py-3
                text-xs
                font-semibold
                bg-[#18345C]
                text-white
                rounded-lg
                hover:bg-[#102747]
                transition-colors
                disabled:opacity-40
                disabled:cursor-not-allowed
              ">
          Finalizar limpieza
        </button>
      </div>)}

      {esPropia && estadoVisual === "limpia" && (<div className="px-3 py-3 bg-white border-t border-[#E5E0D8] shrink-0">
        <div className="w-full py-2.5 rounded-md bg-[#ECFDF3] border border-[#86EFAC] text-[#15803D] text-[11px] font-semibold text-center">
          ✓ Limpieza finalizada
        </div>
      </div>)}
    </div>
  </div>);
}
interface Props {
  habitaciones: Habitacion[];
  solicitudes: Solicitud[];
  onComenzarLimpieza: (id: string) => void;
  onFinalizarLimpieza: (id: string) => void;
  onActualizarEstado: (id: string, estado: EstadoHabitacion) => void;
  onToggleTarea: (habId: string, tareaId: string) => void;
  onGuardarObservaciones: (id: string, obs: string) => void;
  onIrIncidencias: () => void;
  usuarioActual?: string;
  habitacionInicialNumero?: string | null;
  onHabitacionInicialProcesada?: () => void;
  soloDetalle?: boolean;
  onCerrarSoloDetalle?: () => void;
}
export default function Mapa({ habitaciones, solicitudes, onComenzarLimpieza, onFinalizarLimpieza, onToggleTarea, onGuardarObservaciones, onIrIncidencias, usuarioActual = "Personal de limpieza", habitacionInicialNumero = null, onHabitacionInicialProcesada, soloDetalle = false, onCerrarSoloDetalle, }: Props) {
  const [filtroPiso, setFiltroPiso] = useState<FiltroPiso>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>("todos");
  const [habitacionSeleccionada, setHabitacionSeleccionada] = useState<Habitacion | null>(null);
  const filtradas = habitaciones.filter((h) => {
    if (filtroPiso !== "todos" && h.piso !== Number(filtroPiso)) {
      return false;
    }
    if (filtroEstado === "todos") {
      return true;
    }
    if (filtroEstado === "prioritarias") {
      return esPrioritaria(h);
    }
    return obtenerEstadoLimpieza(h) === filtroEstado;
  });
  const stats = {
    limpias: habitaciones.filter((h) => obtenerEstadoLimpieza(h) === "limpia").length,
    pendientes: habitaciones.filter((h) => obtenerEstadoLimpieza(h) === "pendiente").length,
    enLimpieza: habitaciones.filter((h) => obtenerEstadoLimpieza(h) === "en-limpieza").length,
    prioritarias: habitaciones.filter((h) => esPrioritaria(h)).length,
  };
  if (soloDetalle) {
    const habDetalle = habitaciones.find((h) => h.numero === habitacionInicialNumero && h.personal === usuarioActual);
    if (!habDetalle)
      return null;
    return (<div className="fixed inset-0 z-[60]">
      <PanelDetalle
        hab={habDetalle}
        solicitudes={solicitudes}
        usuarioActual={usuarioActual}
        onClose={() => onCerrarSoloDetalle?.()}
        onComenzarLimpieza={onComenzarLimpieza}
        onToggleTarea={onToggleTarea}
        onFinalizarLimpieza={(id) => {
          onFinalizarLimpieza(id);
          onCerrarSoloDetalle?.();
        }}
        onGuardarObservaciones={onGuardarObservaciones}
        onIrIncidencias={onIrIncidencias} />
    </div>);
  }
  return (<div className="flex-1 flex flex-col overflow-hidden bg-[#F8F6F0] relative" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="
          px-4
          sm:px-6
          py-4
          bg-white
          border-b
          border-[#E5E0D8]
          shrink-0
        ">
      <div className="
            flex
            items-center
            justify-between
            gap-4
            flex-wrap
            mb-4
          ">
        <div>
          <h1 className="
                text-xl
                sm:text-2xl
                font-semibold
                text-[#18345C]
              ">
            Mapa de habitaciones
          </h1>

          <p className="text-xs text-[#AEBCC1] mt-1">
            {habitaciones.length} habitaciones
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:grid-cols-4">
          {[
            {
              label: "Limpias",
              val: stats.limpias,
              color: "#4ADE80",
              fondo: "#F0FAF4",
              filtro: "limpia" as FiltroEstado,
            },
            {
              label: "Pendientes",
              val: stats.pendientes,
              color: "#F3D98B",
              fondo: "#FFF9E8",
              filtro: "pendiente" as FiltroEstado,
            },
            {
              label: "En limpieza",
              val: stats.enLimpieza,
              color: "#60A5FA",
              fondo: "#EFF6FF",
              filtro: "en-limpieza" as FiltroEstado,
            },
            {
              label: "Prioritarias",
              val: stats.prioritarias,
              color: "#D8B94E",
              fondo: "#FFF8DD",
              filtro: "prioritarias" as FiltroEstado,
            },
          ].map((s) => (<button
            key={s.label}
            type="button"
            onClick={() => setFiltroEstado(s.filtro)}
            className={`min-w-[112px] rounded-xl border px-3 py-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${filtroEstado === s.filtro ? 'border-[#18345C] ring-1 ring-[#18345C]' : 'border-[#E5E0D8]'}`}
            style={{ backgroundColor: s.fondo }}>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-[11px] font-medium text-[#71839B]">
                {s.label}
              </span>
            </div>
            <p className="mt-1 text-2xl font-bold leading-none text-[#18345C]">
              {s.val}
            </p>
          </button>))}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-2">
        {(["todos", "1", "2", "3"] as FiltroPiso[]).map((p) => (<button
          key={p}
          onClick={() => setFiltroPiso(p)}
          className={`
                  px-3
                  py-2
                  text-xs
                  rounded-md
                  font-medium
                  transition-colors

                  ${filtroPiso === p
              ? "bg-[#18345C] text-white"
              : "bg-[#F8F6F0] text-[#6B7280] hover:bg-[#E5E0D8]"}
                `}>
          {p === "todos" ? "Todos" : `Piso ${p}`}
        </button>))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {([
          {
            val: "todos",
            label: "Todos",
          },
          {
            val: "limpia",
            label: "Limpias",
          },
          {
            val: "pendiente",
            label: "Pendientes",
          },
          {
            val: "en-limpieza",
            label: "En limpieza",
          },
          {
            val: "prioritarias",
            label: "Prioritarias",
          },
        ] as {
          val: FiltroEstado;
          label: string;
        }[]).map((f) => (<button
          key={f.val}
          onClick={() => setFiltroEstado(f.val)}
          className={`
                  px-3
                  py-2
                  text-xs
                  rounded-md
                  font-medium
                  transition-colors

                  ${filtroEstado === f.val
              ? "bg-[#D8B94E] text-[#102747]"
              : "bg-[#F8F6F0] text-[#6B7280] hover:bg-[#E5E0D8]"}
                `}>
          {f.label}
        </button>))}
      </div>
    </div>

    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
      {[1, 2, 3].map((piso) => {
        const habsPiso = filtradas.filter((h) => h.piso === piso);
        if (habsPiso.length === 0) {
          return null;
        }
        return (<div key={piso} className="mb-7">
          <div className="flex items-center gap-3 mb-3">
            <p className="
                      text-xs
                      text-[#AEBCC1]
                      uppercase
                      tracking-widest
                      font-semibold
                    ">
              Piso {piso}
            </p>

            <div className="flex-1 h-px bg-[#E5E0D8]" />

            <span className="text-[10px] text-[#AEBCC1]">
              {habsPiso.length} habitaciones
            </span>
          </div>

          <div className="
                    grid
                    grid-cols-1
                    sm:grid-cols-2
                    md:grid-cols-3
                    lg:grid-cols-4
                    xl:grid-cols-5
                    gap-3
                  ">
            {habsPiso.map((h) => (<TarjetaHabitacion key={h.id} hab={h} onClick={() => setHabitacionSeleccionada(h)} />))}
          </div>
        </div>);
      })}

      {filtradas.length === 0 && (<div className="text-center py-6 text-[#AEBCC1] text-sm">
        No hay habitaciones que coincidan con los filtros seleccionados.
      </div>)}
    </div>
    {habitacionSeleccionada && (<PanelDetalle
      hab={habitacionSeleccionada}
      solicitudes={solicitudes}
      usuarioActual={usuarioActual}
      onClose={() => setHabitacionSeleccionada(null)}
      onComenzarLimpieza={onComenzarLimpieza}
      onToggleTarea={onToggleTarea}
      onFinalizarLimpieza={onFinalizarLimpieza}
      onGuardarObservaciones={onGuardarObservaciones}
      onIrIncidencias={onIrIncidencias} />)}
  </div>);
}
