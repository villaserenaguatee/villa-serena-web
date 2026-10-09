import { calcularCuentaEstancia } from "@/lib/pms/cuentaEstancia";
import { useAuth } from "@/hooks/useAuth";
import { UiText, useUiText } from "@/i18n/UiText";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { translateChatMessage } from "@/lib/translation/client";
import { useEffect, useMemo, useState } from "react";
import { guardarAccesoPostCheckout, leerAccesoPostCheckout } from "@/store/guestAccountAccess";
import type { Modulo, SeccionHuesped, Huesped, Reserva, CheckInWeb, PedidoHuesped, MensajeChat, Domotica, TurnoAmenidad, ReservaAmenidad, CargoHuesped, DatosFiscales, PagoHuespedApp, MetodoPagoHuesped, ReservaHuesped, TipoPedidoHuesped, LineaPedidoHuesped, DocumentoCargado, EstadoHabHotel, Acompanante, } from "@/lib/pms/types";
import { PEDIDOS_HUESPED_INICIALES, DOMOTICA_INICIAL, TURNOS_AMENIDAD_INICIALES, RESERVAS_AMENIDAD_INICIALES, DATOS_FISCALES_INICIALES, PUNTOS_FIDELIDAD_INICIALES, CATALOGO_HABITACIONES_PUBLICO, SERVICIOS_CATALOGO, generarId, ahoraISO, nochesEntre, codigoLlaveDigital, siguienteNumeroPedidoHuesped, siguienteFacturaFEL, turnoActual, } from "@/data/pms";
import { actualizarHuespedCentral } from "@/store/guestStore";
import { leerHabitaciones, HABITACIONES_EVENT } from "@/store/roomStore";
import { MENU_EVENT, leerMenu } from "@/store/menuStore";
import { leerReservas, RESERVAS_EVENT, upsertReserva } from "@/store/reservationStore";
import { aplicarTarifasHabitaciones, leerTarifas, TARIFAS_EVENT } from "@/store/tarifasStore";
import { Aviso, pedidoActivo, totalCargos, puntosDeMonto, } from "@/features/huesped/pages/huespedUtils";
import ModuloSwitcher from "@/components/common/ModuloSwitcher";
import InicioHuesped from "@/features/huesped/pages/InicioHuesped";
import ReservarEstancia from "@/features/huesped/pages/ReservarEstancia";
import CheckInWebScreen from "@/features/huesped/pages/CheckInWeb";
import ServiciosHuesped from "@/features/huesped/pages/ServiciosHuesped";
import MiHabitacion from "@/features/huesped/pages/MiHabitacion";
import CuentaHuesped from "@/features/huesped/pages/CuentaHuesped";
import ChatHuesped from "@/features/huesped/pages/ChatHuesped";
import ReservasExperiencias from "@/features/huesped/pages/ReservasExperiencias";
import PerfilHuesped from "@/features/huesped/pages/PerfilHuesped";
import { completarCheckOutReserva } from "@/store/reservationStore";
import { EVENTO_ESTADO_RS, EVENTO_PEDIDO_RS, PEDIDOS_RS_KEY, filtrarCargosLegacyRestaurante, pedidosRestauranteHuesped, publicarPedidoPortal, actualizarPedidoPortal, leerPedidosPortal, type ActualizacionPedidoRS } from "@/store/roomServiceSync";
import { actualizarMensajeChat, guardarMensajesChat, leerMensajesChat } from "@/store/chatStore";
import { useCurrentGuest } from "@/features/huesped/hooks/useCurrentGuest";
const SECCIONES: {
  id: SeccionHuesped;
  label: string;
  corto: string;
}[] = [
    { id: "inicio", label: "Mi estancia", corto: "Estancia" },
    { id: "checkin", label: "Check-in", corto: "Check-in" },
    { id: "restaurante", label: "Menú", corto: "Menú" },
    { id: "servicios", label: "Servicios", corto: "Servicios" },
    { id: "chat", label: "Chat con recepción", corto: "Chat" },
    { id: "habitacion", label: "Mi habitación", corto: "Habitación" },
    { id: "experiencias", label: "Reservas y experiencias", corto: "Reservas" },
    { id: "cuenta", label: "Cuenta y check-out", corto: "Cuenta" },
    { id: "reservar", label: "Gestionar estancia", corto: "Estancia" },
  ];
export function seccionesPortal(estado: Reserva['estado']) {
  return SECCIONES.filter(s => estado !== 'finalizada' || !['checkin', 'restaurante', 'servicios'].includes(s.id));
}
function GestionIcon({ tipo }: {
  tipo: "calendario" | "cama" | "solicitud";
}) {
  const common = {
    width: 36,
    height: 36,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  if (tipo === "calendario")
    return <svg {...common}>
      <rect x="3" y="5" width="16" height="15" rx="2" />
      <path d="M7 3v4M15 3v4M3 9h16M16 14v6M13 17h6" />
    </svg>;
  if (tipo === "cama")
    return <svg {...common}>
      <path d="M3 18v-8M21 18v-5a3 3 0 0 0-3-3H7a4 4 0 0 0-4 4v1h12M7 10V7h6a3 3 0 0 1 3 3M18 15v6M15 18h6" />
    </svg>;
  return <svg {...common}>
    <path d="M7 3h8l4 4v14H7zM15 3v5h5M10 13h6M10 17h5" />
  </svg>;
}
function ExtensionIcon({ tipo }: {
  tipo: "huesped" | "habitacion" | "fecha" | "tarifa" | "noche" | "espera" | "audifonos";
}) {
  const common = {
    width: 25,
    height: 25,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  if (tipo === "huesped")
    return <svg {...common}>
      <circle cx="12" cy="7" r="3" />
      <path d="M5.5 21v-2a6.5 6.5 0 0 1 13 0v2z" />
    </svg>;
  if (tipo === "habitacion")
    return <svg {...common}>
      <path d="M3 18V8M21 18V11a3 3 0 0 0-3-3H8a5 5 0 0 0-5 5v2h18M7 8V5h6a3 3 0 0 1 3 3" />
    </svg>;
  if (tipo === "fecha")
    return <svg {...common}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M7 3v4M17 3v4M3 10h18M8 14h2M14 14h2M8 18h2" />
    </svg>;
  if (tipo === "tarifa")
    return <svg {...common}>
      <ellipse cx="9" cy="7" rx="5" ry="3" />
      <path d="M4 7v4c0 1.7 2.2 3 5 3 1.1 0 2.1-.2 3-.6M4 11v4c0 1.7 2.2 3 5 3M14 10c3 0 5 1.3 5 3s-2 3-5 3-5-1.3-5-3 2-3 5-3zM9 13v4c0 1.7 2.2 3 5 3s5-1.3 5-3v-4" />
    </svg>;
  if (tipo === "noche")
    return <svg {...common}>
      <path d="M20 16.5A8.5 8.5 0 0 1 8 4a8.5 8.5 0 1 0 12 12.5z" />
    </svg>;
  if (tipo === "audifonos")
    return <svg {...common}>
      <path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14a2 2 0 0 1 2-2h1v7H6a2 2 0 0 1-2-2zM20 14a2 2 0 0 0-2-2h-1v7h1a2 2 0 0 0 2-2z" />
    </svg>;
  return <svg {...common}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>;
}
function SeccionIcon({ id, size = 18 }: {
  id: SeccionHuesped;
  size?: number;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (id) {
    case "inicio":
      return (<svg {...p}>
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>);
    case "checkin":
      return (<svg {...p}>
        <circle cx="7.5" cy="15.5" r="4.5" />
        <path d="m10.7 12.3 8.8-8.8" />
        <path d="m17 6 3 3" />
        <path d="m14 9 3 3" />
      </svg>);
    case "restaurante":
    case "servicios":
      return (<svg {...p}>
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.3 4.3A1 1 0 0 0 6 19h12" />
        <circle cx="9" cy="21" r="1" />
        <circle cx="18" cy="21" r="1" />
      </svg>);
    case "chat":
      return (<svg {...p}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>);
    case "habitacion":
      return (<svg {...p}>
        <path d="M3 7v10" />
        <path d="M21 10v7" />
        <path d="M3 13h18" />
        <path d="M5 13V9.5A1.5 1.5 0 0 1 6.5 8h3A1.5 1.5 0 0 1 11 9.5V13" />
        <path d="M11 13v-2a2 2 0 0 1 2-2h5a3 3 0 0 1 3 3v1" />
      </svg>);
    case "cuenta":
      return (<svg {...p}>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="2" y1="10" x2="22" y2="10" />
      </svg>);
    case "reservar":
    case "experiencias":
      return (<svg {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>);
  }
}
interface Props {
  onCambiarModulo: (m: Modulo) => void;
}
interface PortalProps extends Props {
  huesped: Huesped;
  reservaInicial: Reserva;
  reservasAutorizadas?: Reserva[];
  publicSummary?: { total: number; estadoPago: string | null };
}
export function seleccionarEstanciaHuesped(reservas: Reserva[], huespedId: string): Reserva | undefined {
  const prioridad: Record<Reserva['estado'], number> = { 'en-curso': 0, confirmada: 1, pendiente: 2, finalizada: 3, cancelada: 4 };
  return reservas.filter(r => r.huespedId === huespedId && r.estado !== 'cancelada').sort((a, b) => {
    const estado = prioridad[a.estado] - prioridad[b.estado];
    if (estado) return estado;
    const fechas = a.estado === 'finalizada' ? b.fechaSalida.localeCompare(a.fechaSalida) : a.fechaEntrada.localeCompare(b.fechaEntrada);
    return fechas || a.codigo.localeCompare(b.codigo) || a.id.localeCompare(b.id);
  }).at(0);
}

export default function HuespedApp(props: Props) {
  const huesped = useCurrentGuest();
  const [estancias, setEstancias] = useState(() => leerReservas());
  useEffect(() => {
    const sync = () => setEstancias(leerReservas());
    window.addEventListener(RESERVAS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => { window.removeEventListener(RESERVAS_EVENT, sync); window.removeEventListener("storage", sync); };
  }, []);
  if (!huesped) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F6F0] p-6 text-center">
      <div className="max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[#18345C]">No se pudo validar tu cuenta de huésped</h1>
        <p className="mt-3 text-sm text-[#6B7280]">Esta sesión no tiene un huésped asociado. Vuelve a iniciar sesión o contacta a Recepción.</p>
        <a href="/login" className="mt-5 inline-block font-semibold text-[#18345C]">Ir al inicio de sesión</a>
      </div>
    </div>;
  }
  const reservaInicial = seleccionarEstanciaHuesped(estancias, huesped.id);
  if (!reservaInicial) {
    return <div className="flex min-h-screen items-center justify-center bg-[#F8F6F0] p-6 text-center">
      <div className="max-w-md rounded-xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-[#18345C]">No encontramos una estancia asociada a tu cuenta</h1>
        <p className="mt-3 text-sm text-[#6B7280]">No se mostrarán datos de otras cuentas. Contacta a Recepción para recibir ayuda.</p>
      </div>
    </div>;
  }
  return <HuespedPortal key={`${huesped.id}:${reservaInicial.id}`} {...props} huesped={huesped} reservaInicial={reservaInicial} />;
}

export function HuespedPortal({ onCambiarModulo, huesped, reservaInicial, reservasAutorizadas, publicSummary }: PortalProps) {
  const ui = useUiText();
  const { logout } = useAuth();
  const { en, lang } = usePublicLanguage();
  const [seccion, setSeccion] = useState<SeccionHuesped>("inicio");
  const [abrirResena, setAbrirResena] = useState(false);
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("seccion") === "habitacion") setSeccion("habitacion");
  }, []);
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [nombrePerfil, setNombrePerfil] = useState(huesped.nombre);
  const [telefonoPerfil, setTelefonoPerfil] = useState(huesped.telefono);
  const [correoPerfil, setCorreoPerfil] = useState(huesped.correo);
  const [fotoPerfil, setFotoPerfil] = useState<string | null>(huesped.foto ?? null);
  const [cerrarSesionAbierto, setCerrarSesionAbierto] = useState(false);
  useEffect(() => {
    setNombrePerfil(huesped.nombre);
    setTelefonoPerfil(huesped.telefono);
    setCorreoPerfil(huesped.correo);
    setFotoPerfil(huesped.foto ?? null);
  }, [huesped.id, huesped.nombre, huesped.telefono, huesped.correo, huesped.foto]);
  const [tarifasReserva, setTarifasReserva] = useState(() => leerTarifas());
  const ofertasReserva = useMemo(() => CATALOGO_HABITACIONES_PUBLICO.map(oferta => ({ ...oferta, precioNoche: tarifasReserva[oferta.tipo] })), [tarifasReserva]);
  const habitacionesReserva = useMemo(() => aplicarTarifasHabitaciones(leerHabitaciones(), tarifasReserva), [tarifasReserva]);
  useEffect(() => {
    const sincronizarTarifas = () => setTarifasReserva(leerTarifas());
    window.addEventListener(TARIFAS_EVENT, sincronizarTarifas);
    window.addEventListener('storage', sincronizarTarifas);
    return () => {
      window.removeEventListener(TARIFAS_EVENT, sincronizarTarifas);
      window.removeEventListener('storage', sincronizarTarifas);
    };
  },
    []);
  const reservasDelPortal = () => reservasAutorizadas
    ? reservasAutorizadas.map(owned => leerReservas().find(r => r.id === owned.id && r.huespedId === huesped.id) ?? owned)
    : leerReservas();
  const [reservasHotel, setReservasHotel] = useState<Reserva[]>(reservasDelPortal);
  const [reserva, setReserva] = useState<Reserva>(reservaInicial);
  const pedidosKey = `vs-pedidos-huesped-${reserva.codigo}`;
  const [menu, setMenu] = useState(() => leerMenu());
  useEffect(() => {
    const sincronizarMenu = () => setMenu(leerMenu());
    window.addEventListener(MENU_EVENT, sincronizarMenu);
    window.addEventListener('storage', sincronizarMenu);
    return () => {
      window.removeEventListener(MENU_EVENT, sincronizarMenu);
      window.removeEventListener('storage', sincronizarMenu);
    };
  },
    []);
  useEffect(() => {
    const sincronizarReservas = () => {
      const actuales = reservasDelPortal();
      setReservasHotel(actuales);
      const sincronizada = actuales.find(r => r.id === reserva.id && r.huespedId === huesped.id);
      if (sincronizada)
        setReserva(sincronizada);
    };
    sincronizarReservas();
    window.addEventListener(RESERVAS_EVENT, sincronizarReservas);
    window.addEventListener("storage", sincronizarReservas);
    return () => {
      window.removeEventListener(RESERVAS_EVENT, sincronizarReservas);
      window.removeEventListener("storage", sincronizarReservas);
    };
  },
    [reserva.id, reserva.codigo, huesped.id]);
  const [habitacionesPortal, setHabitacionesPortal] = useState(() => leerHabitaciones());
  useEffect(() => {
    const sync = () => setHabitacionesPortal(leerHabitaciones());
    sync();
    window.addEventListener(HABITACIONES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(HABITACIONES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const habitacion = habitacionesPortal.find((h) => h.id === reserva.habitacionId);
  const estadoHabitacion: EstadoHabHotel = habitacion?.estado ?? 'reservada';
  const web = reserva.checkInWeb;
  const checkin: CheckInWeb = {
    estado: reserva.checkInEn || reserva.estado === 'en-curso' ? 'aprobado' : web?.estado ?? 'disponible',
    documento: web?.documento ?? null, documentos: web?.documentos,
    terminosAceptados: web?.terminosAceptados ?? false,
    peticiones: web?.peticiones ?? [], notaPeticiones: web?.notaPeticiones ?? '',
    completadoEn: reserva.checkInEn ?? web?.revisadoEn ?? web?.enviadoEn,
    motivoRechazo: web?.motivoRevision,
    codigoLlave: reserva.estado === 'en-curso' && habitacion ? codigoLlaveDigital(reserva.codigo, (habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar'))) : undefined,
  };
  const [pedidos, setPedidos] = useState<PedidoHuesped[]>(() => {
    if (typeof window === "undefined")
      return PEDIDOS_HUESPED_INICIALES.filter(p => p.tipo !== 'restaurante');
    try {
      const guardados = JSON.parse(localStorage.getItem(pedidosKey) || "[]");
      return [...(Array.isArray(guardados) ? guardados : PEDIDOS_HUESPED_INICIALES).filter((p: PedidoHuesped) => p.tipo !== 'restaurante'), ...pedidosRestauranteHuesped(reserva.id, huesped.id)];
    }
    catch {
      return PEDIDOS_HUESPED_INICIALES;
    }
  });
  const [avisosRoomService, setAvisosRoomService] = useState<ActualizacionPedidoRS[]>([]);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [domotica, setDomotica] = useState<Domotica>(DOMOTICA_INICIAL);
  function actualizarDomotica(cambios: Partial<Domotica>) {
    if (!estanciaActiva())
      return;
    setDomotica((actual) => ({ ...actual, ...cambios }));
  }
  function actualizarLuz(id: string,
    cambios: {
      encendida?: boolean;
      intensidad?: number;
    }) {
    if (!estanciaActiva())
      return;
    setDomotica((actual) => ({
      ...actual,
      luces: actual.luces.map((luz) => luz.id === id ? { ...luz, ...cambios } : luz),
    }));
  }
  function conectarWifi() {
    if (!estanciaActiva())
      return;
    setDomotica((actual) => ({ ...actual, wifiConectado: true }));
    mostrarAviso("Wi-Fi conectado correctamente.");
  }
  const [turnos, setTurnos] = useState<TurnoAmenidad[]>(TURNOS_AMENIDAD_INICIALES);
  const [reservasAmenidad, setReservasAmenidad] = useState<ReservaAmenidad[]>(RESERVAS_AMENIDAD_INICIALES);
  const [cargosLegacy, setCargos] = useState<CargoHuesped[]>(() => {
    try {
      const x = JSON.parse(localStorage.getItem(`vs-cargos-estancia-${reserva.codigo}`) || '[]');
      return Array.isArray(x) ? filtrarCargosLegacyRestaurante(x, reserva.id, huesped.id) : [];
    }
    catch {
      return [];
    }
  });
  // Re-evaluate after migration or canonical order updates, before totals and persistence.
  const cargos = useMemo(() => filtrarCargosLegacyRestaurante(cargosLegacy, reserva.id, huesped.id),
    [cargosLegacy, reserva.id, huesped.id, pedidos]);
  useEffect(() => {
    try {
      localStorage.setItem(`vs-cargos-estancia-${reserva.codigo}`, JSON.stringify(cargos));
    }
    catch { }
  }, [cargos, reserva.codigo]);
  const [fiscales, setFiscales] = useState<DatosFiscales>(DATOS_FISCALES_INICIALES);
  const [facturaEmitida, setFacturaEmitida] = useState<string | null>(null);
  const [puntos, setPuntos] = useState(PUNTOS_FIDELIDAD_INICIALES);
  const [reservaWeb, setReservaWeb] = useState<ReservaHuesped | null>(null);
  const estanciaCerrada = reserva.estado === 'finalizada' || reserva.estado === 'cancelada';
  const estanciaActiva = () => leerReservas().some(r => r.id === reserva.id && r.huespedId === huesped.id && r.estado === 'en-curso');
  const [aviso, setAviso] = useState<string | null>(null);
  function reservarTurno(turnoId: string,
    personas: number,
    detalle?: string) {
    if (!estanciaActiva())
      return;
    const turno = turnos.find((item) => item.id === turnoId);
    if (!turno) {
      mostrarAviso("No encontramos el horario seleccionado.");
      return;
    }
    const libres = turno.aforo - turno.ocupados;
    if (personas < 1 || personas > libres) {
      mostrarAviso("No hay cupos suficientes para esa reserva.");
      return;
    }
    const reservaNueva: ReservaAmenidad = {
      id: generarId(),
      turnoId: turno.id,
      area: turno.area,
      fecha: turno.fecha,
      hora: turno.hora,
      personas,
      detalle,
      creadaEn: ahoraISO(),
    };
    setTurnos((actuales) => actuales.map((item) => item.id === turno.id ? { ...item, ocupados: item.ocupados + personas } : item));
    setReservasAmenidad((actuales) => [reservaNueva, ...actuales]);
    mostrarAviso(`Reserva confirmada para ${turno.area} a las ${turno.hora}.`);
  }
  function cancelarTurno(reservaId: string) {
    if (!estanciaActiva())
      return;
    const reservaCancelada = reservasAmenidad.find((item) => item.id === reservaId);
    if (!reservaCancelada)
      return;
    setReservasAmenidad((actuales) => actuales.filter((item) => item.id !== reservaId));
    setTurnos((actuales) => actuales.map((item) => item.id === reservaCancelada.turnoId ? { ...item, ocupados: Math.max(0, item.ocupados - reservaCancelada.personas) } : item));
    mostrarAviso("La reserva fue cancelada.");
  }
  function guardarFiscales(datos: DatosFiscales) {
    setFiscales(datos);
    mostrarAviso("Datos fiscales guardados correctamente.");
  }
  // Frontera futura: invocar para tarjeta solo después de una aprobación real del proveedor.
  // Los formularios actuales sin procesador no llaman a esta función para tarjeta.
  function pagarSaldo(metodo: MetodoPagoHuesped,
    extra: {
      ultimos4?: string;
      puntosUsados?: number;
      descuentoPuntos?: number;
      descuentoCodigo?: number;
      codigoPromocional?: string;
      montoTarjeta?: number;
    }) {
    if (cuenta.saldo <= 0) {
      mostrarAviso("No tienes saldo pendiente por pagar.");
      return;
    }
    const descuentoAplicado = Math.max(0, (extra.descuentoPuntos ?? 0) + (extra.descuentoCodigo ?? 0));
    const montoCobrado = Math.max(0, extra.montoTarjeta ?? (cuenta.saldo - descuentoAplicado));
    const comprobante = siguienteFacturaFEL();
    const fecha = ahoraISO();
    const pagoApp: PagoHuespedApp = {
      id: generarId(),
      monto: montoCobrado,
      metodo,
      fecha,
      comprobante,
      ...extra,
    };
    const pagoCentral = montoCobrado > 0 ? {
      id: `portal-${pagoApp.id}`,
      destino: "consumos" as const,
      fecha,
      monto: montoCobrado,
      metodo: metodo === "debito" ? "tarjeta" as const : metodo === "tarjeta" ? "tarjeta" as const : "transferencia" as const,
      comprobante,
    } : null;
    const actualizada: Reserva = {
      ...reserva,
      descuento: Math.round(((reserva.descuento || 0) + descuentoAplicado) * 100) / 100,
      pagos: pagoCentral ? [...reserva.pagos, pagoCentral] : reserva.pagos,
    };
    setReserva(actualizada);
    upsertReserva(actualizada);
    if (extra.puntosUsados)
      setPuntos((actuales) => Math.max(0, actuales - extra.puntosUsados!));
    setFacturaEmitida(comprobante);
    mostrarAviso(`Pago registrado. Comprobante ${comprobante}.`);
  }
  function hacerCheckOut() {
    if (!estanciaActiva())
      return;
    const actualizada = completarCheckOutReserva(reserva.id, 'portal');
    if (!actualizada) return;
    setReserva(actualizada);
    mostrarAviso("Check-out completado correctamente. Tu cuenta permanecerá disponible durante 24 horas para consultar la estancia y gestionar tu reseña.");
  }
  useEffect(() => {
    if (!estanciaCerrada || !reserva.checkOutEn)
      return;
    guardarAccesoPostCheckout(huesped.correo, reserva.checkOutEn);
    const access = leerAccesoPostCheckout(huesped.correo);
    const expiresAt = access?.expiresAt ? new Date(access.expiresAt).getTime() : new Date(reserva.checkOutEn).getTime() + 24 * 60 * 60 * 1000;
    const cerrarSiExpirado = () => {
      if (Date.now() < expiresAt)
        return;
      localStorage.removeItem("vs-auth");
      localStorage.removeItem("villa-serena-session");
      window.location.replace("/login");
    };
    cerrarSiExpirado();
    const timer = window.setInterval(cerrarSiExpirado, 30000);
    return () => window.clearInterval(timer);
  },
    [estanciaCerrada, reserva.checkOutEn, huesped.correo]);
  const [gestionEstancia, setGestionEstancia] = useState<"extender" | "nueva" | null>(null);
  const [nuevaSalida, setNuevaSalida] = useState("2026-09-23");
  const [solicitudExtensionEnviada, setSolicitudExtensionEnviada] = useState(false);
  const [cancelarExtensionAbierto, setCancelarExtensionAbierto] = useState(false);
  const [motivoCancelacionOpcion, setMotivoCancelacionOpcion] = useState("");
  const [motivoCancelacionExtension, setMotivoCancelacionExtension] = useState("");
  const [cancelacionExtensionPendiente, setCancelacionExtensionPendiente] = useState(false);
  useEffect(() => {
    actualizarHuespedCentral(huesped.id, {
      nombre: nombrePerfil,
      telefono: telefonoPerfil,
      correo: correoPerfil,
      foto: fotoPerfil || undefined,
    });
  },
    [huesped.id, nombrePerfil, telefonoPerfil, correoPerfil, fotoPerfil]);
  const llaveActiva = checkin.estado === "aprobado" && Boolean(checkin.codigoLlave) && !estanciaCerrada;
  useEffect(() => {
    const cargar = () => {
      try {
        const guardados = leerMensajesChat([]);
        setMensajes(guardados.filter((m: MensajeChat) => m.huespedId === huesped.id));
      }
      catch { }
    };
    cargar();
    const evento = () => cargar();
    window.addEventListener("vs-chat-actualizado", evento);
    window.addEventListener("storage", evento);
    const id = window.setInterval(cargar, 1200);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("vs-chat-actualizado", evento);
      window.removeEventListener("storage", evento);
    };
  },
    []);
  async function enviarMensaje(texto: string) {
    const valor = texto.trim();
    if (!valor)
      return;
    const idiomaOriginal = en ? "en" : "es";
    const mensaje: MensajeChat = {
      id: generarId(),
      autor: "huesped",
      huespedId: huesped.id,
      texto: valor,
      ...(en ? { textoEn: valor } : { textoEs: valor }),
      idiomaOriginal,
      hora: ahoraISO(),
    };
    try {
      const traducido = await translateChatMessage(valor, undefined, en ? "es" : "en");
      if (en)
        mensaje.textoEs = traducido;
      else
        mensaje.textoEn = traducido;
    }
    catch {
    }
    setMensajes((actuales) => {
      const globales = leerMensajesChat([]);
      const siguientes = [...globales, mensaje];
      guardarMensajesChat(siguientes);
      return siguientes.filter(m => m.huespedId === huesped.id);
    });
  }
  async function editarMensaje(id: string,
    texto: string) {
    const valor = texto.trim();
    if (!valor)
      return;
    const idiomaOriginal = en ? "en" : "es";
    let textoEs: string | undefined = en ? undefined : valor;
    let textoEn: string | undefined = en ? valor : undefined;
    try {
      const traducido = await translateChatMessage(valor, undefined, en ? "es" : "en");
      if (en)
        textoEs = traducido;
      else
        textoEn = traducido;
    }
    catch { }
    const globales = leerMensajesChat([]);
    const actualizados = actualizarMensajeChat(globales, id, m => ({ ...m, texto: valor, textoEs, textoEn, idiomaOriginal, editado: true, editadoEn: ahoraISO(), eliminadoParaTodos: false }));
    setMensajes(actualizados.filter(m => m.huespedId === huesped.id));
  }
  function eliminarMensaje(id: string,
    paraTodos: boolean) {
    const globales = leerMensajesChat([]);
    const actualizados = actualizarMensajeChat(globales, id, m => paraTodos ? { ...m, eliminadoParaTodos: true, editado: false } : { ...m, eliminadoPara: Array.from(new Set([...(m.eliminadoPara ?? []), "huesped"])) });
    setMensajes(actualizados.filter(m => m.huespedId === huesped.id));
  }
  function crearPedido(datos: {
    tipo: TipoPedidoHuesped;
    lineas: LineaPedidoHuesped[];
    nota: string;
    alergias: string;
    lugarEntrega?: string;
    codigoCupon?: string;
    descuentoPct?: number;
  }): number {
    if (!habitacion || !estanciaActiva() || datos.lineas.length === 0)
      return 0;
    const numero = siguienteNumeroPedidoHuesped();
    const creadoEn = ahoraISO();
    const pedido: PedidoHuesped = {
      id: generarId(),
      numero,
      tipo: datos.tipo,
      lineas: datos.lineas,
      nota: datos.nota,
      alergias: datos.alergias,
      lugarEntrega: datos.lugarEntrega,
      codigoCupon: datos.codigoCupon,
      descuentoPct: datos.descuentoPct,
      estado: "recibido",
      creadoEn,
      historial: [{ estado: "recibido", fechaHora: creadoEn }],
    };
    if (datos.tipo === 'restaurante') {
      const guardado = publicarPedidoPortal(pedido, {
        reserva, habitacion: (habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar')), piso: habitacion.piso,
        huesped: nombrePerfil, turno: turnoActual(),
      });
      if (!guardado) return 0;
      setPedidos(actuales => [...actuales.filter(p => p.tipo !== 'restaurante'), ...pedidosRestauranteHuesped(reserva.id, huesped.id)]);
      return numero;
    }
    setPedidos((actuales) => [pedido, ...actuales]);
    const descuentoFactor = Math.max(0, 1 - (datos.descuentoPct ?? 0) / 100);
    const nuevosCargos: CargoHuesped[] = datos.lineas.filter(l => l.precioUnitario > 0).map(l => ({
      id: `pedido-${pedido.id}-${l.refId}`,
      concepto: `${datos.tipo === "restaurante" ? "Menú" : "Servicio"} · ${l.nombre}`,
      categoria: "Servicios",
      cantidad: l.cantidad,
      precioUnitario: Math.round(l.precioUnitario * descuentoFactor * 100) / 100,
      fecha: creadoEn
    }));
    setCargos(actuales => [...actuales, ...nuevosCargos.filter(n => !actuales.some(a => a.id === n.id))]);
    return numero;
  }
  function cancelarPedido(id: string,
    motivo = "Cancelado por el huésped") {
    if (pedidos.some(p => p.id === id && p.tipo === 'restaurante')) {
      const aceptado = actualizarPedidoPortal(id, 'cancelado', motivo);
      setPedidos(actuales => [...actuales.filter(p => p.tipo !== 'restaurante'), ...pedidosRestauranteHuesped(reserva.id, huesped.id)]);
      if (!aceptado) mostrarAviso('El pedido ya no permite cancelación.');
      return;
    }
    const ahora = ahoraISO();
    setPedidos((actuales) => actuales.map((pedido) => pedido.id === id ? {
      ...pedido,
      estado: "cancelado",
      motivoCancelacion: motivo,
      historial: [...pedido.historial, { estado: "cancelado", fechaHora: ahora }],
    } : pedido));
    setCargos(actuales => actuales.filter(c => !c.id.startsWith(`pedido-${id}-`)));
  }
  const cuenta = useMemo(() => {
    return calcularCuentaEstancia(reserva, habitacion ?? null, totalCargos(cargos));
  },
    [reserva, habitacion, cargos, tarifasReserva]);
  const nochesAdicionales = Math.max(0, nochesEntre(reserva.fechaSalida, nuevaSalida));
  const estimacionExtension = nochesAdicionales * cuenta.precioNoche;
  const fechaLarga = (fecha: string) => new Date(`${fecha}T12:00:00`).toLocaleDateString("es-GT", { day: "numeric", month: "long", year: "numeric" });
  const pedidosActivos = pedidos.filter(pedidoActivo);
  function mostrarAviso(texto: string) {
    setAviso(texto);
    window.setTimeout(() => setAviso((a) => (a === texto ? null : a)), 4000);
  }
  function guardarSolicitudExtension(estado: "extension-pendiente" | "cancelacion-pendiente",
    motivo = "") {
    if (!habitacion || !estanciaActiva()) return;
    localStorage.setItem("vs-solicitud-extension",
      JSON.stringify({
        id: reserva.codigo,
        huesped: nombrePerfil,
        habitacion: (habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar')),
        salidaActual: reserva.fechaSalida,
        nuevaSalida,
        noches: nochesAdicionales,
        estimacion: estimacionExtension,
        motivo,
        estado,
        creadaEn: ahoraISO(),
      }));
  }
  useEffect(() => {
    const revisar = () => {
      try {
        const solicitud = JSON.parse(localStorage.getItem("vs-solicitud-extension") || "null");
        if (solicitud?.id === reserva.codigo && solicitud.estado === "cancelacion-aceptada") {
          setSolicitudExtensionEnviada(false);
          setCancelacionExtensionPendiente(false);
          setMotivoCancelacionOpcion("");
          setMotivoCancelacionExtension("");
        }
      }
      catch { }
    };
    revisar();
    const id = window.setInterval(revisar, 1500);
    return () => window.clearInterval(id);
  },
    [reserva.codigo]);
  useEffect(() => {
    // Move only legacy restaurant orders; other service requests remain in their key.
    try {
      const legacy: PedidoHuesped[] = JSON.parse(localStorage.getItem(pedidosKey) || '[]');
      if (Array.isArray(legacy)) {
        const restantes = legacy.filter(p => {
          if (p.tipo !== 'restaurante' || !habitacion) return true;
          const existente = leerPedidosPortal().find(x => x.id === p.id);
          if (existente?.reservaId) return existente.reservaId !== reserva.id || existente.huespedId !== huesped.id;
          return !publicarPedidoPortal(existente ? {
            ...p, estado: existente.estado === 'nuevo' ? 'recibido' : existente.estado,
            entregadoEn: existente.entregadoEn, motivoCancelacion: existente.motivoCancelacion,
            historial: existente.historial.map(h => ({ ...h, estado: h.estado === 'nuevo' ? 'recibido' : h.estado })),
          } : p, { reserva, habitacion: (habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar')), piso: habitacion.piso, huesped: nombrePerfil, turno: turnoActual() });
        });
        localStorage.setItem(pedidosKey, JSON.stringify(restantes));
      }
    } catch { }
    const sincronizar = () => setPedidos(actuales => [
      ...actuales.filter(p => p.tipo !== 'restaurante'),
      ...pedidosRestauranteHuesped(reserva.id, huesped.id),
    ]);
    const evento = (e: Event) => {
      sincronizar();
      const a = (e as CustomEvent<ActualizacionPedidoRS>).detail;
      if (pedidosRestauranteHuesped(reserva.id, huesped.id).some(p => p.id === a.id))
        setAvisosRoomService(actuales => [a, ...actuales.filter(x => x.id !== a.id)].slice(0, 10));
    };
    const storage = (e: StorageEvent) => { if (e.key === PEDIDOS_RS_KEY || e.key === null) sincronizar(); };
    sincronizar();
    window.addEventListener(EVENTO_ESTADO_RS, evento);
    window.addEventListener(EVENTO_PEDIDO_RS, sincronizar);
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener(EVENTO_ESTADO_RS, evento);
      window.removeEventListener(EVENTO_PEDIDO_RS, sincronizar);
      window.removeEventListener('storage', storage);
    };
  }, [reserva.id, reserva.codigo, huesped.id]);
  useEffect(() => {
    try {
      const guardados: PedidoHuesped[] = JSON.parse(localStorage.getItem(pedidosKey) || '[]');
      const pendientes = Array.isArray(guardados) ? guardados.filter(p => p.tipo === 'restaurante') : [];
      localStorage.setItem(pedidosKey, JSON.stringify([...pendientes, ...pedidos.filter(p => p.tipo !== 'restaurante')]));
    }
    catch { }
  }, [pedidos, pedidosKey]);
  function guardarOcupantes(datos: {
    adultos: number;
    ninos: number;
    acompanantes: Acompanante[];
  }) {
    const canonica = leerReservas().find(r => r.id === reserva.id && r.huespedId === huesped.id);
    if (!canonica || canonica.estado === 'finalizada' || canonica.estado === 'cancelada') return;
    const actualizada: Reserva = {
      ...canonica,
      adultos: datos.adultos,
      ninos: datos.ninos,
      personas: datos.adultos + datos.ninos,
      acompanantes: datos.acompanantes,
    };
    setReserva(actualizada);
    upsertReserva(actualizada);
  }
  function completarCheckIn(datos: {
    documento: DocumentoCargado;
    documentos: DocumentoCargado[];
    peticiones: string[];
    notaPeticiones: string;
  }) {
    const canonica = leerReservas().find(r => r.id === reserva.id && r.huespedId === huesped.id);
    if (!canonica || canonica.estado !== 'confirmada' || canonica.checkInEn || canonica.checkInWeb?.estado === 'pendiente' || canonica.checkInWeb?.estado === 'aprobado') return;
    const enviadoEn = ahoraISO();
    const actualizada: Reserva = {
      ...canonica,
      estado: 'confirmada',
      checkInWeb: {
        estado: 'pendiente',
        documento: datos.documento,
        documentos: datos.documentos,
        terminosAceptados: true,
        peticiones: datos.peticiones,
        notaPeticiones: datos.notaPeticiones,
        enviadoEn,
      },
    };
    upsertReserva(actualizada);
    setReserva(actualizada);
    mostrarAviso("Check-in enviado. Recepción revisará la información antes de activar tu llave digital.");
  }
  const renderCuenta = () => {
    if (publicSummary) return <div className="p-6 space-y-4"><h1 className="text-2xl font-semibold text-[#18345C]">Cuenta</h1><p>{reserva.codigo}</p><p>Total original de la reserva: {new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(publicSummary.total)}</p><p>Estado del pago: {publicSummary.estadoPago ?? 'Sin iniciar'}</p><Aviso>La cuenta de la estancia todavía no está disponible.</Aviso></div>;
    return (<CuentaHuesped
          abrirResena={abrirResena}
          onResenaAbierta={() => setAbrirResena(false)}
          huesped={huesped}
          reserva={reserva}
          habitacion={habitacion}
          estadoHabitacion={estadoHabitacion}
          cargos={cargos}
          cuenta={cuenta}
          fiscales={fiscales}
          facturaEmitida={facturaEmitida}
          puntos={puntos}
          estanciaCerrada={estanciaCerrada}
          onGuardarFiscales={guardarFiscales}
          onPagar={pagarSaldo}
          onCheckOut={hacerCheckOut} />);
  };
  const contenido = (() => {
    if (reserva.estado === 'finalizada' && ['inicio', 'checkin', 'restaurante', 'servicios'].includes(seccion)) return renderCuenta();
    const dependeHabitacion = ['restaurante', 'servicios', 'habitacion', 'checkin'].includes(seccion);
    const requiereEstanciaActiva = ['restaurante', 'servicios'].includes(seccion);
    if (dependeHabitacion && (!habitacion || (requiereEstanciaActiva && reserva.estado !== 'en-curso'))) {
      const titulo = SECCIONES.find(s => s.id === seccion)?.label ?? seccion;
      return <div className="p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-[#18345C]">{ui(titulo)}</h1>
        <p className="text-sm text-[#52677F]">{reserva.codigo} · {en ? 'Reservation status' : 'Estado de la reserva'}: {ui(reserva.estado)}</p>
        <Aviso>{!habitacion
          ? (en ? 'Reception must assign a room to this reservation first.' : 'Recepción debe asignar primero una habitación a esta reserva.')
          : (en ? 'This section is available during an active stay, after check-in.' : 'Esta sección está disponible durante una estancia activa, después del check-in.')}</Aviso>
        <div className="flex flex-wrap gap-3">
          {habitacion && reserva.estado === 'confirmada' && <button onClick={() => setSeccion('checkin')} className="rounded-lg bg-[#18345C] px-4 py-2 text-white">{en ? 'Go to check-in' : 'Ir a check-in'}</button>}
          <button onClick={() => setSeccion('chat')} className="rounded-lg border border-[#18345C] px-4 py-2 text-[#18345C]">{en ? 'Contact Reception' : 'Contactar a Recepción'}</button>
          <button onClick={() => setSeccion('cuenta')} className="rounded-lg border border-[#18345C] px-4 py-2 text-[#18345C]">{en ? 'View account' : 'Ver cuenta'}</button>
        </div>
      </div>;
    }
    switch (seccion) {
      case "inicio":
        return habitacion ? (<InicioHuesped
          huesped={huesped}
          reserva={reserva}
          habitacion={habitacion}
          estadoHabitacion={estadoHabitacion}
          checkin={checkin}
          pedidos={pedidos}
          reservasAmenidad={reservasAmenidad}
          domotica={domotica}
          cuenta={cuenta}
          puntos={puntos}
          llaveActiva={llaveActiva}
          estanciaCerrada={estanciaCerrada}
          onIr={setSeccion} />) : <div className="p-6 space-y-3"><h1 className="text-xl font-semibold">{huesped.nombre}</h1><p>{reserva.codigo} · {reserva.fechaEntrada} → {reserva.fechaSalida}</p><p className="text-sm text-[#52677F]">{en ? "Reservation status" : "Estado de la reserva"}: {ui(reserva.estado)}</p><Aviso>{en ? 'Room assignment pending. You can consult your account or contact Reception in the chat.' : 'Habitación pendiente de asignación. Puedes consultar tu cuenta o contactar a Recepción por chat.'}</Aviso></div>;
      case "reservar":
        if (!gestionEstancia)
          return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-4 sm:p-6">
            <div className="mx-auto max-w-6xl">
              <p className="text-xs font-semibold uppercase tracking-[.28em] text-[#B38B2C]">Tu estancia, a tu ritmo</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#18345C] sm:text-4xl">
                <UiText text="Gestionar estancia" />
              </h1>
              <p className="mt-2 text-base text-[#6B7280]">
                <UiText text="Elige qué deseas hacer con tu alojamiento." />
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="flex flex-col rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-[#D3AE55] text-[#A77E20]">
                    <GestionIcon tipo="calendario" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-[#18345C]">
                    <UiText text="Extender mi estancia" />
                  </h2>
                  <p className="mt-2 text-base text-[#6B7280]">
                    Conserva tu habitación actual y solicita noches adicionales.
                  </p>
                  <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#F8F6F0] p-3">
                    <img
                      src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=85"
                      alt={`Habitación ${(habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar'))}`}
                      className="h-16 w-24 rounded-md object-cover" />
                    <p className="text-sm text-[#52677F]"><b className="block text-[#18345C]">Habitación {(habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar'))} · {reserva.tipoHabitacion}</b>Salida {reserva.fechaSalida}</p>
                  </div>
                  <button
                    disabled={!habitacion || !estanciaActiva()} onClick={() => setGestionEstancia("extender")}
                    className="mt-5 inline-flex w-fit items-center gap-3 self-end rounded-lg bg-[#B08A31] px-4 py-2.5 text-sm font-semibold text-white">Solicitar extensión <span>→</span></button>
                </article>
                <article className="flex flex-col rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-[#D3AE55] text-[#A77E20]">
                    <GestionIcon tipo="cama" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-[#18345C]">
                    <UiText text="Reservar otra habitación" />
                  </h2>
                  <p className="mt-2 text-base text-[#6B7280]">
                    <UiText text="Haz una reserva para ti o para otra persona." />
                  </p>
                  <div className="my-4 h-px bg-[#E5E0D8]" />
                  <p className="text-[#52677F]">Consulta fechas, disponibilidad y tarifas.</p>
                  <button
                    onClick={() => setGestionEstancia("nueva")}
                    className="mt-5 inline-flex w-fit items-center gap-3 self-end rounded-lg bg-[#B08A31] px-4 py-2.5 text-sm font-semibold text-white">Nueva reserva <span>→</span></button>
                </article>
              </div>
              <section className="mt-4 flex items-center gap-4 rounded-xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
                <span className="text-[#A77E20]">
                  <GestionIcon tipo="solicitud" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[#18345C]">Mis solicitudes</h2>
                  <p className="mt-1 text-[#6B7280]">No tienes solicitudes pendientes.</p>
                </div>
              </section>
            </div>
          </div>);
        if (gestionEstancia === "extender")
          return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-5 sm:p-8">
            <div className="mx-auto max-w-6xl">
              <button onClick={() => setGestionEstancia(null)} className="text-sm font-semibold text-[#9B7420]">← Volver a Gestionar estancia</button>
              <h1 className="mt-5 text-4xl font-semibold text-[#18345C]">Extender mi estancia</h1>
              <p className="mt-1 text-[#60738B]">Solicita noches adicionales conservando tu habitación actual.</p>

              <section className="mt-6 rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:p-7">
                <div className="grid gap-5 border-b border-[#ECE7DE] pb-6 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["huesped", "Huésped", nombrePerfil],
                    ["habitacion", "Habitación", `${(habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar'))} · ${reserva.tipoHabitacion}`],
                    ["fecha", "Estancia actual", `${fechaLarga(reserva.fechaEntrada)} — ${fechaLarga(reserva.fechaSalida)}`],
                    ["tarifa", "Tarifa por noche", `Q ${cuenta.precioNoche.toLocaleString()}`],
                  ].map(([icono, etiqueta, valor]) => <div key={etiqueta} className="flex items-center gap-3 lg:border-r lg:last:border-0">
                    <span className="text-[#18345C]">
                      <ExtensionIcon tipo={icono as "huesped" | "habitacion" | "fecha" | "tarifa"} />
                    </span>
                    <div>
                      <small className="block text-xs text-[#91A0B0]">
                        {etiqueta}
                      </small>
                      <b className="text-[#18345C]">
                        {valor}
                      </b>
                    </div>
                  </div>)}
                </div>
                <label className="mt-6 block text-sm font-semibold text-[#18345C]">Nueva fecha de salida
                  <input
                    type="date"
                    min={reserva.fechaSalida}
                    value={nuevaSalida}
                    disabled={solicitudExtensionEnviada}
                    onChange={(e) => setNuevaSalida(e.target.value)}
                    className="mt-2 block w-full rounded-lg border border-[#18345C] bg-white p-3 disabled:bg-[#F2F2F0]" />
                </label>
                <div className="mt-5 grid items-center gap-4 rounded-lg border border-[#E5E0D8] bg-[#FBFAF7] p-5 sm:grid-cols-[1fr_1.35fr]">
                  <div className="flex items-center gap-4">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-white text-[#B08A31]">
                      <ExtensionIcon tipo="noche" />
                    </span>
                    <b className="text-lg text-[#18345C]">
                      {nochesAdicionales}
                      {nochesAdicionales === 1 ? 'noche adicional' : 'noches adicionales'}
                    </b>
                  </div>
                  <div className="sm:border-l sm:pl-8">
                    <small className="text-[#71839B]">Estimación</small>
                    <strong className="block text-3xl text-[#18345C]">Q {estimacionExtension.toLocaleString()}</strong>
                    <p className="text-xs text-[#71839B]">Recepción confirmará la disponibilidad y el importe antes de realizar cualquier cobro.</p>
                  </div>
                </div>
                <button
                  disabled={nochesAdicionales < 1 || solicitudExtensionEnviada}
                  onClick={() => {
                    setSolicitudExtensionEnviada(true);
                    setCancelacionExtensionPendiente(false);
                    guardarSolicitudExtension("extension-pendiente");
                    mostrarAviso("Solicitud de extensión enviada a recepción.");
                  }}
                  className="mt-4 rounded-lg bg-[#18345C] px-5 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9AA9BB]">
                  {en ? "Request extension" : "Solicitar extensión"}
                </button>
              </section>

              {solicitudExtensionEnviada && <section className="mt-5 flex flex-col gap-5 rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#B58C31] text-white">
                    <ExtensionIcon tipo="espera" />
                  </span>
                  <div>
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${cancelacionExtensionPendiente ? 'bg-[#FEECEC] text-[#A52A2A]' : 'bg-[#FFF3D5] text-[#8A6200]'}`}>
                      {cancelacionExtensionPendiente ? 'Cancelación en revisión' : 'Pendiente de aprobación'}
                    </span>
                    <p className="mt-2 font-semibold text-[#18345C]">
                      {cancelacionExtensionPendiente ? 'Enviamos a recepción tu solicitud de cancelación.' : `Solicitud enviada para extender la estancia hasta el ${fechaLarga(nuevaSalida)}.`}
                    </p>
                    <p className="text-sm text-[#71839B]">
                      {cancelacionExtensionPendiente ? 'Recepción revisará el motivo y confirmará la cancelación.' : 'Te notificaremos por este medio tan pronto como tengamos una respuesta.'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setCancelarExtensionAbierto(true)}
                    disabled={cancelacionExtensionPendiente}
                    className="rounded-lg border border-[#18345C] px-5 py-2.5 font-semibold text-[#18345C] disabled:opacity-50">Cancelar solicitud</button>
                  <button
                    onClick={() => {
                      void enviarMensaje("Tengo problemas con mi solicitud de cancelación.");
                      setSeccion("chat");
                    }}
                    className="flex items-center gap-2 rounded-lg border border-[#B58C31] px-5 py-2.5 font-semibold text-[#8A6819]"><ExtensionIcon tipo="audifonos" /> Contactar a recepción</button>
                </div>
              </section>}
            </div>

            {cancelarExtensionAbierto && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#071D34]/45 p-4" onMouseDown={() => setCancelarExtensionAbierto(false)}>
              <section className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl" onMouseDown={e => e.stopPropagation()}>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-[#18345C]">¿Deseas cancelar la solicitud?</h2>
                    <p className="mt-1 text-[#71839B]">Indica el motivo de la cancelación.</p>
                  </div>
                  <button onClick={() => setCancelarExtensionAbierto(false)} className="text-2xl text-[#52677F]">×</button>
                </div>
                <div className="mt-5 space-y-3">
                  {["Ya no necesito noches adicionales", "Cambiaron mis planes", "El precio no se ajusta a mi presupuesto", "Prefiero reservar otra habitación", "Otro motivo"].map(opcion => <label key={opcion} className="flex cursor-pointer items-center gap-3 text-[#314860]">
                    <input
                      type="radio"
                      name="motivo-extension"
                      value={opcion}
                      checked={motivoCancelacionOpcion === opcion}
                      onChange={() => setMotivoCancelacionOpcion(opcion)}
                      className="h-4 w-4 accent-[#18345C]" />
                    {opcion}
                  </label>)}
                </div>
                {motivoCancelacionOpcion === "Otro motivo" && <textarea
                  autoFocus
                  value={motivoCancelacionExtension}
                  onChange={e => setMotivoCancelacionExtension(e.target.value)}
                  rows={3}
                  placeholder="Escribe el motivo aquí..."
                  className="mt-4 w-full resize-none rounded-lg border border-[#CCD3DB] p-3 outline-none focus:border-[#18345C]" />}
                <div className="mt-5 flex gap-3 rounded-lg bg-[#F8F6F0] p-3 text-sm text-[#52677F]">
                  <span className="font-bold text-[#18345C]">ⓘ</span>
                  <p>¿Tienes algún problema con tu solicitud? <button
                    onClick={() => {
                      void enviarMensaje("Tengo problemas con mi solicitud de cancelación.");
                      setCancelarExtensionAbierto(false);
                      setSeccion("chat");
                    }}
                    className="font-semibold text-[#18345C] underline">Contacta a recepción</button> antes de cancelarla.</p>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button onClick={() => setCancelarExtensionAbierto(false)} className="rounded-lg border border-[#18345C] py-3 font-semibold text-[#18345C]">Volver</button>
                  <button
                    disabled={!motivoCancelacionOpcion || (motivoCancelacionOpcion === "Otro motivo" && !motivoCancelacionExtension.trim())}
                    onClick={() => {
                      const motivo = motivoCancelacionOpcion === "Otro motivo" ? motivoCancelacionExtension.trim() : motivoCancelacionOpcion;
                      setCancelacionExtensionPendiente(true);
                      guardarSolicitudExtension("cancelacion-pendiente", motivo);
                      setCancelarExtensionAbierto(false);
                      mostrarAviso(`Solicitud de cancelación enviada a recepción. Motivo: ${motivo}`);
                    }}
                    className="rounded-lg border border-red-500 py-3 font-semibold text-red-600 disabled:opacity-40">Confirmar cancelación</button>
                </div>
              </section>
            </div>}
          </div>);
        return (<div className="flex-1 flex flex-col overflow-hidden">
          <ReservarEstancia
            ofertas={ofertasReserva}
            habitaciones={habitacionesReserva}
            reservas={reservasHotel}
            huesped={huesped}
            reservaWeb={reservaWeb}
            onNuevaBusqueda={() => setReservaWeb(null)}
            onVolver={() => setGestionEstancia(null)}
            onVerReservacion={() => {
              setGestionEstancia(null);
              setSeccion("inicio");
            }} />
        </div>);
      case "checkin":
        if (!habitacion) return null;
        return (<CheckInWebScreen
          huesped={huesped}
          reserva={reserva}
          habitacion={habitacion}
          checkin={checkin}
          estanciaCerrada={estanciaCerrada}
          onCompletar={completarCheckIn}
          onGuardarOcupantes={guardarOcupantes}
          onIrHabitacion={() => setSeccion("habitacion")}
          onContactarRecepcion={() => {
            void enviarMensaje("Deseo corregir los datos personales de mi check-in. ¿Podrían ayudarme con la verificación?");
            setSeccion("chat");
          }} />);
      case "restaurante":
        if (!habitacion) return null;
        return (<ServiciosHuesped
          menu={menu}
          servicios={SERVICIOS_CATALOGO}
          pedidos={pedidos}
          mensajes={mensajes}
          escribiendo={escribiendo}
          habitacion={habitacion}
          reserva={reserva}
          huespedId={huesped.id}
          estanciaCerrada={estanciaCerrada}
          onCrearPedido={crearPedido}
          onCancelarPedido={cancelarPedido}
          onEnviarMensaje={enviarMensaje}
          onIrCuenta={() => setSeccion("cuenta")}
          modo="restaurante" />);
      case "servicios":
        if (!habitacion) return null;
        return (<ServiciosHuesped
          menu={menu}
          servicios={SERVICIOS_CATALOGO}
          pedidos={pedidos}
          mensajes={mensajes}
          escribiendo={escribiendo}
          habitacion={habitacion}
          reserva={reserva}
          huespedId={huesped.id}
          estanciaCerrada={estanciaCerrada}
          onCrearPedido={crearPedido}
          onCancelarPedido={cancelarPedido}
          onEnviarMensaje={enviarMensaje}
          onIrCuenta={() => setSeccion("cuenta")}
          modo="servicios" />);
      case "chat":
        return <ChatHuesped key={huesped.id} nombreHuesped={huesped.nombre} mensajes={mensajes} onEnviar={enviarMensaje} onEditar={editarMensaje} onEliminar={eliminarMensaje} />;
      case "experiencias":
        return (<ReservasExperiencias
          reserva={reserva}
          huespedId={huesped.id}
          turnos={turnos}
          reservas={reservasAmenidad}
          onReservar={reservarTurno}
          onCancelar={cancelarTurno}
          onCargoConfirmado={(id,
            nombre,
            monto) => { if (!estanciaActiva()) return; setCargos(actuales => actuales.some(c => c.id === id) ? actuales : [...actuales, { id, concepto: `Experiencia · ${nombre}`, categoria: "Spa y experiencias", cantidad: 1, precioUnitario: monto, fecha: ahoraISO() }]); }} />);
      case "habitacion":
        if (!habitacion) return null;
        return (<MiHabitacion
          reserva={reserva}
          onCompartirExperiencia={() => { setAbrirResena(true); setSeccion("cuenta"); }}
          onReservarEstancia={() => { setGestionEstancia("nueva"); setSeccion("reservar"); }}
          onVerCuentaFinal={() => { setAbrirResena(false); setSeccion("cuenta"); }}
          habitacion={habitacion}
          domotica={domotica}
          turnos={turnos}
          reservasAmenidad={reservasAmenidad}
          llaveActiva={llaveActiva}
          codigoLlave={checkin.codigoLlave}
          estanciaCerrada={estanciaCerrada}
          onActualizarDomotica={actualizarDomotica}
          onActualizarLuz={actualizarLuz}
          onConectarWifi={conectarWifi}
          onReservarTurno={reservarTurno}
          onCancelarTurno={cancelarTurno}
          onIrCheckin={() => setSeccion("checkin")} />);
      case "cuenta":
        return renderCuenta();
    }
  })();
  const badgeDe = (id: SeccionHuesped) => {
    if (id === "servicios")
      return pedidosActivos.length;
    if (id === "checkin")
      return checkin.estado === "disponible" && !estanciaCerrada ? 1 : 0;
    if (id === "cuenta")
      return cuenta.saldo > 0 && estanciaCerrada ? 1 : 0;
    return 0;
  };
  return (<div className="min-h-screen w-full flex flex-col overflow-hidden" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="flex-1 flex overflow-hidden">

      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-[245px] h-[100dvh]" style={{ backgroundColor: "#102747" }}>
        <div className="px-5 pt-6 pb-5 border-b shrink-0 text-center" style={{ borderColor: "#1d3a5f" }}>
          <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="mx-auto w-28 h-auto object-contain mb-2" />
          <p className="text-white text-xl font-bold leading-tight" style={{ letterSpacing: "0.02em" }}>
            <UiText text="Villa Serena" />
          </p>
          <p className="text-xs mt-1" style={{ color: "#AEBCC1", letterSpacing: "0.06em" }}>
            <UiText text="Portal del huésped" />
          </p>
        </div>

        <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
          {seccionesPortal(reserva.estado).map((s) => {
            const active = seccion === s.id;
            const badge = badgeDe(s.id);
            return (<button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors relative"
              style={{
                color: active ? "#FFFFFF" : "#AEBCC1",
                backgroundColor: active ? "#18345C" : "transparent",
              }}>
              {active && (<span className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: "#D8B94E" }} />)}
              <span style={{ color: active ? "#D8B94E" : "#AEBCC1" }}>
                <SeccionIcon id={s.id} />
              </span>
              <span className="text-sm font-medium flex-1">
                {ui(s.label)}
              </span>
              {badge > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ backgroundColor: "#D8B94E", color: "#102747" }}>
                {badge}
              </span>)}
            </button>);
          })}
        </div>

        <ModuloSwitcher actual="huesped" onCambiar={onCambiarModulo} />

        <div className="mt-auto px-4 py-3 border-t shrink-0 bg-[#102747]" style={{ borderColor: "#1d3a5f" }}>
          <button
            type="button"
            onClick={() => setPerfilAbierto(true)}
            className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-[#18345C]"
            aria-label={ui("Abrir perfil")}>
            {fotoPerfil ? (<img src={fotoPerfil} alt={ui("Foto de perfil")} className="w-9 h-9 rounded-full object-cover shrink-0" />) : (<div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: "#D8B94E", color: "#102747" }}>
              <UiText text="AM" />
            </div>)}
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {nombrePerfil}
              </p>
              <p className="text-[10px] truncate" style={{ color: "#AEBCC1" }}>
                {ui(estanciaCerrada
                  ? "Estancia finalizada"
                  : `Habitación ${(habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar'))}`)}
              </p>
              <span className="mt-0.5 block text-[10px] font-semibold text-[#D8B94E]">
                <UiText text="Perfil" />
              </span>
            </div>
          </button>

        </div>
      </nav>

      <div className="flex-1 lg:ml-[245px] flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: "#102747" }}>
          <p className="lg:hidden text-white text-lg font-bold">
            <UiText text="Villa Serena" />
          </p>
          <span className="lg:hidden text-[#AEBCC1] text-xs">
            <UiText text="·" />
          </span>
          <p className="text-[#AEBCC1] text-xs font-medium truncate flex-1">
            {ui(SECCIONES.find((s) => s.id === seccion)?.label ?? "")}
          </p>
          <div className="lg:hidden flex gap-1.5">
            {reservasAutorizadas && <button type="button" className="text-white text-xs px-2" aria-label={ui("Abrir perfil")} onClick={() => setPerfilAbierto(true)}>Perfil</button>}
            <ModuloSwitcher actual="huesped" onCambiar={onCambiarModulo} variant="inline" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {contenido}
        </div>

        <div className="lg:hidden flex shrink-0 border-t overflow-x-auto" style={{ backgroundColor: "#102747", borderColor: "#1d3a5f" }}>
          {seccionesPortal(reserva.estado).map((s) => {
            const active = seccion === s.id;
            const badge = badgeDe(s.id);
            return (<button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="flex-1 min-w-[64px] flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors"
              style={{ color: active ? "#D8B94E" : "#AEBCC1" }}>
              {active && (<span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5" style={{ backgroundColor: "#D8B94E" }} />)}
              <span className="relative">
                <SeccionIcon id={s.id} size={20} />
                {badge > 0 && (<span
                  className="absolute -top-1 -right-2 text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "#D8B94E", color: "#102747" }}>
                  {badge}
                </span>)}
              </span>
              <span className="text-[9px] font-medium leading-tight truncate max-w-full px-0.5">
                {s.corto}
              </span>
            </button>);
          })}
        </div>
      </div>
    </div>

    {perfilAbierto && (<PerfilHuesped
      huespedId={huesped.id}
      onCerrarSesion={() => { setPerfilAbierto(false); setCerrarSesionAbierto(true); }}
      documento={`${huesped.tipoDocumento} ${huesped.documento}`}
      nombre={nombrePerfil}
      telefono={telefonoPerfil}
      correo={correoPerfil}
      foto={fotoPerfil}
      idioma={lang}
      onVolver={() => setPerfilAbierto(false)}
      onFoto={setFotoPerfil}
      onTelefono={(v) => {
        setTelefonoPerfil(v);
        actualizarHuespedCentral(huesped.id, { telefono: v });
      }}
      onIdioma={(idioma) => {
        if (idioma !== "ES" && idioma !== "EN") return;
        localStorage.setItem("villa-serena-lang", idioma);
        document.documentElement.lang = idioma === "EN" ? "en" : "es";
        window.dispatchEvent(new CustomEvent("villa-serena-language", { detail: idioma }));
      }}
      onAviso={mostrarAviso}
      onSolicitarCorreccion={(d) => {
        if (!d)
          return;
        try {
          const k = "vs-correcciones-huesped";
          const prev = JSON.parse(localStorage.getItem(k) || "[]");
          localStorage.setItem(k,
            JSON.stringify([
              {
                id: generarId(),
                huesped: nombrePerfil,
                habitacion: reserva.codigo || "",
                ...d,
                estado: "pendiente",
                fecha: new Date().toISOString(),
              },
              ...prev,
            ]));
          window.dispatchEvent(new Event("vs-correcciones-huesped-updated"));
        }
        catch { }
      }} />)}

    {cerrarSesionAbierto && (<div className="fixed inset-0 z-[90] bg-black/40 grid place-items-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-semibold text-[#18345C]">
          <UiText text="¿Deseas cerrar sesión?" />
        </h2>
        <p className="text-[#6B7280] mt-2">
          <UiText text="Tendrás que ingresar nuevamente para acceder al portal del huésped." />
        </p>
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button onClick={() => setCerrarSesionAbierto(false)} className="border border-[#E5E0D8] rounded-lg py-3 font-semibold text-[#18345C]">
            <UiText text="Cancelar" />
          </button>
          <button
            onClick={async () => {
              try { await logout(); window.location.replace("/"); }
              catch { setCerrarSesionAbierto(false); mostrarAviso("No se pudo cerrar la sesión. Intenta nuevamente."); }
            }}
            className="bg-[#18345C] text-white rounded-lg py-3 font-semibold">
            <UiText text="Cerrar sesión" />
          </button>
        </div>
      </div>
    </div>)}

    {aviso && (<div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
      <div className="bg-[#102747] text-white text-[14px] font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
        <span style={{ color: "#D8B94E" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="flex-1">
          {ui(aviso)}
        </span>
        <button onClick={() => setAviso(null)} aria-label={ui("Cerrar aviso")} className="text-[#AEBCC1] hover:text-white shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>)}
  </div>);
}
