import SidebarBrand from '@/components/common/SidebarBrand';
import StaffSidebarIdentity from '@/components/common/StaffSidebarIdentity';
import ReceptionCloseButton from './ReceptionCloseButton';
import { calcularCuentaRecepcion as calcularCuenta } from '../accountTotals';
import ReceptionNotice from './ReceptionNotice';
import { needsReservationChannel, permitsLocalCancellation } from '@/features/recepcion/localCancellation';
import CalendarioReservas from './CalendarioReservas';
import { requireReadyCheckInRoom } from '@/features/recepcion/checkInRoom';
import { asignarHabitacionReserva } from '@/store/reservationAssignment';
import { createReservation, registerGuest, getRooms } from '@/lib/api/reception';
import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { prepareExistingReceptionScreen } from '@/features/recepcion/receptionLegacyLink';
import type { ReservationDetail } from '@/lib/bff/contracts/reception';
import type { ExistingAction } from './ReceptionDetailBff';

import { useAuth } from '@/hooks/useAuth';
import type { Modulo, SeccionRecepcion, Huesped, Reserva, HabitacionHotel, SolicitudHuesped, EstadoHabHotel, EstadoSolicitudHuesped, MetodoPago, Pago, Acompanante, ServicioAdicional, TipoHabitacion, ObjetoOlvidado, Incidencia, } from '@/lib/pms/types';
import { HUESPEDES_INICIALES, EMPLEADOS_INICIALES, generarId, ahoraISO, siguienteCodigoReserva, siguienteComprobante, fechaHoyISO, nochesEntre, } from '@/data/pms';
import { validarCambioEstadoHab } from '@/features/recepcion/pages/recUtils';
import { aplicarTarifasHabitaciones, TARIFAS_EVENT } from '@/store/tarifasStore';
import DiaRecepcion from '@/features/recepcion/pages/DiaRecepcion';
import Reservas from '@/features/recepcion/pages/Reservas';
import Disponibilidad from '@/features/recepcion/pages/Disponibilidad';
import HabitacionesRecepcion from '@/features/recepcion/pages/HabitacionesRecepcion';
import Huespedes from '@/features/recepcion/pages/Huespedes';
import DetalleReserva from '@/features/recepcion/pages/DetalleReserva';
import NuevaReservaModal from '@/features/recepcion/pages/NuevaReservaModal';
import ChatRecepcion from '@/features/recepcion/pages/ChatRecepcion';
import ConnectedReceptionChat from './ConnectedReceptionChat';
import ConnectedReceptionDay from './ConnectedReceptionDay';
import ObjetosRecepcion from '@/features/recepcion/pages/ObjetosRecepcion';
import ObjetosEncontradosConectados from './ObjetosEncontradosConectados';
import IncidenciasRecepcion from './IncidenciasRecepcion';
import StaffProfileModal from '@/components/common/StaffProfileModal';
import { leerEmpleados } from '@/store/employeeStore';
import { guardarHuespedes, leerHuespedes, upsertHuesped, HUESPEDES_EVENT } from '@/store/guestStore';
import { guardarReservas, leerReservas, RESERVAS_EVENT, upsertReserva } from '@/store/reservationStore';
import { guardarHabitaciones, leerHabitaciones, HABITACIONES_EVENT } from '@/store/roomStore';
import { EVENTO_INCIDENCIAS_MANTENIMIENTO, leerIncidenciasMantenimiento, reportarIncidenciaMantenimiento } from '@/store/maintenanceEvents';
import { completarCheckInReserva, completarCheckOutReserva, errorActivacionCheckInPortal, errorCheckInRecepcion } from '@/store/reservationStore';
import { actualizarObjetoOlvidado, CLAVE_OBJETOS_OLVIDADOS, guardarObjetosOlvidados, leerObjetosOlvidados } from '@/store/lostFoundEvents';
const EMPTY_RESERVATIONS: Reserva[] = [];
const EMPTY_GUESTS: Huesped[] = [];
const EMPTY_ROOMS: HabitacionHotel[] = [];
const SECCIONES: {
  id: SeccionRecepcion;
  label: string;
  corto: string;
}[] = [
    { id: 'dia', label: 'Vista del día', corto: 'Día' },
    { id: 'reservas', label: 'Reservas', corto: 'Reservas' },
    { id: 'disponibilidad', label: 'Disponibilidad', corto: 'Disponib.' },
    { id: 'habitaciones', label: 'Habitaciones', corto: 'Habs.' },
    { id: 'huespedes', label: 'Huéspedes', corto: 'Huésped.' },
    { id: 'incidencias', label: 'Incidencias', corto: 'Incid.' },
    { id: 'objetos', label: 'Objetos olvidados', corto: 'Objetos' },
    { id: 'chat', label: 'Chat con huéspedes', corto: 'Chat' },
  ];
function seccionDesdeRuta(pathname: string): SeccionRecepcion {
  const section = pathname.split('/')[2];
  // La ruta histórica de solicitudes utiliza la pantalla de incidencias.
  if (section === 'solicitudes') return 'incidencias';
  return SECCIONES.find(s => s.id === section)?.id ?? 'dia';
}
function codigoDesdeRuta(pathname: string): string | null {
  const parts = pathname.split('/');
  return parts[2] === 'reservas' && /^VS-[A-Z0-9]{6}$/.test(parts[3] ?? '') ? parts[3] : null;
}
function SeccionIcon({ id, size = 18 }: {
  id: SeccionRecepcion;
  size?: number;
}) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75 } as const;
  switch (id) {
    case 'dia':
      return <svg {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>;
    case 'reservas':
      return <svg {...p}>
        <path d="M4 4h16v16H4z" />
        <path d="M8 4v16M4 9h4M4 14h4" />
      </svg>;
    case 'disponibilidad':
      return <svg {...p}>
        <circle cx="11" cy="11" r="7" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>;
    case 'habitaciones':
      return <svg {...p}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>;
    case 'huespedes':
      return <svg {...p}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>;
    case 'solicitudes':
      return <svg {...p}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="9" y1="15" x2="15" y2="15" />
      </svg>;
    case 'incidencias':
      return <svg {...p}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>;
    case 'reportes':
      return <svg {...p}>
        <path d="M4 19V9" />
        <path d="M10 19V5" />
        <path d="M16 19v-7" />
        <path d="M22 19H2" />
      </svg>;
    case 'chat':
      return <svg {...p}>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      </svg>;
    case 'objetos':
      return <svg {...p}>
        <path d="M6 8V6a6 6 0 0 1 12 0v2" />
        <rect x="3" y="8" width="18" height="13" rx="2" />
      </svg>;
  }
}
interface Props {
  conectado?: boolean;
  onCambiarModulo: (m: Modulo) => void;
}
export default function RecepcionApp({ onCambiarModulo, conectado = false }: Props) {
  const pathname = usePathname();
  const router = useRouter();
 const [checkInNotice, setCheckInNotice] = useState('');
  const { user } = useAuth();
  const [huespedes, setHuespedes] = useState<Huesped[]>(() => conectado ? [] : leerHuespedes());
  useEffect(() => { if (!conectado) guardarHuespedes(huespedes); }, [huespedes, conectado]);
  useEffect(() => {
    if (conectado) return;
    const sync = () => setHuespedes(actuales => {
      const next = leerHuespedes();
      return JSON.stringify(actuales) === JSON.stringify(next) ? actuales : next;
    });
    window.addEventListener(HUESPEDES_EVENT, sync);
    const storage = (event: StorageEvent) => {
      if (event.key === 'vs-huespedes')
        sync();
    };
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener(HUESPEDES_EVENT, sync);
      window.removeEventListener('storage', storage);
    };
  },
    []);
  const [reservas, setReservas] = useState<Reserva[]>(() => conectado ? [] : leerReservas());
  useEffect(() => { if (!conectado) guardarReservas(reservas); }, [reservas, conectado]);
  const [habitaciones, setHabitaciones] = useState<HabitacionHotel[]>(() => conectado ? [] : aplicarTarifasHabitaciones(leerHabitaciones()));
  useEffect(() => { if (!conectado) guardarHabitaciones(habitaciones); }, [habitaciones, conectado]);
  useEffect(() => {
    if (conectado) return;
    const sync = () => setHabitaciones(actuales => {
      const next = aplicarTarifasHabitaciones(leerHabitaciones());
      return JSON.stringify(actuales) === JSON.stringify(next) ? actuales : next;
    });
    window.addEventListener(HABITACIONES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(HABITACIONES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  },
    []);
  const [solicitudes, setSolicitudes] = useState<SolicitudHuesped[]>([]);
  const [objetos, setObjetos] = useState<ObjetoOlvidado[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>(() => conectado ? [] : leerIncidenciasMantenimiento());
  useEffect(() => {
    if (conectado) return;
    const sync = () => setReservas(actuales => {
      const next = leerReservas();
      return JSON.stringify(actuales) === JSON.stringify(next) ? actuales : next;
    });
    window.addEventListener(RESERVAS_EVENT, sync);
    const storage = (e: StorageEvent) => {
      if (e.key === 'vs-reservas')
        sync();
    };
    window.addEventListener('storage', storage);
    return () => {
      window.removeEventListener(RESERVAS_EVENT, sync);
      window.removeEventListener('storage', storage);
    };
  },
    []);
  useEffect(() => {
    if (conectado) return;
    const sincronizarTarifas = () => setHabitaciones(actuales => aplicarTarifasHabitaciones(actuales));
    window.addEventListener(TARIFAS_EVENT, sincronizarTarifas);
    window.addEventListener('storage', sincronizarTarifas);
    return () => {
      window.removeEventListener(TARIFAS_EVENT, sincronizarTarifas);
      window.removeEventListener('storage', sincronizarTarifas);
    };
  },
    []);
  useEffect(() => {
    if (conectado) return;
    const sincronizar = () => setIncidencias(leerIncidenciasMantenimiento());
    window.addEventListener(EVENTO_INCIDENCIAS_MANTENIMIENTO, sincronizar);
    return () => window.removeEventListener(EVENTO_INCIDENCIAS_MANTENIMIENTO, sincronizar);
  },
    []);
  useEffect(() => {
    if (conectado) return;
    const sincronizar = () => setObjetos(leerObjetosOlvidados().filter(o => o.origen === 'limpieza'));
    sincronizar();
    const storage = (e: StorageEvent) => {
      if (e.key === CLAVE_OBJETOS_OLVIDADOS)
        sincronizar();
    };
    window.addEventListener('storage', storage);
    window.addEventListener('vs-objetos-actualizados', sincronizar);
    return () => {
      window.removeEventListener('storage', storage);
      window.removeEventListener('vs-objetos-actualizados', sincronizar);
    };
  },
    []);
  useEffect(() => {
    if (conectado) return;
    setHabitaciones(actuales => {
      let cambio = false;
      const siguientes = actuales.map(h => {
        if (h.estado === 'mantenimiento' || h.estado === 'en-limpieza')
          return h;
        const asignadas = reservas.filter(r => r.habitacionId === h.id && (r.estado === 'en-curso' || r.estado === 'confirmada' || r.estado === 'pendiente'));
        const estado: EstadoHabHotel = asignadas.some(r => r.estado === 'en-curso') ? 'ocupada' : asignadas.length ? 'reservada' : 'disponible';
        if (estado === h.estado)
          return h;
        cambio = true;
        return { ...h, estado };
      });
      return cambio ? siguientes : actuales;
    });
  },
    [reservas]);
  const [calendarOpen,setCalendarOpen]=useState(false);
  // The URL is the source of truth on reload and explicit navigation in both modes.
  const [seccion, setSeccionActual] = useState<SeccionRecepcion>(() => seccionDesdeRuta(pathname));
  function setSeccion(section: SeccionRecepcion) {
    setCalendarOpen(false);
    setBffCodeActual(null);
    const target = section === 'dia' ? '/recepcion' : `/recepcion/${section}`;
    // Do not expose the next section before navigation commits: a pending route
    // could otherwise remount it after the user has already opened a room dialog.
    if (pathname !== target) router.push(target);
    else setSeccionActual(section);
  }
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [perfil, setPerfil] = useState(() => {
    if (conectado) return { nombre: user?.name ?? "Recepción", correo: user?.email ?? "", telefono: "", foto: "" };
    const empleado = leerEmpleados().find(e => e.id === user?.id && e.activo);
    const base = { nombre: empleado?.nombre ?? 'Recepción', correo: empleado?.correo ?? '', telefono: empleado?.telefono ?? '', foto: empleado?.foto ?? '' };
    if (typeof window === 'undefined')
      return base;
    try {
      return JSON.parse(localStorage.getItem('vs-recepcion-perfil') || '') || base;
    }
    catch {
      return base;
    }
  });
  useEffect(() => {
    if (conectado) {
      setPerfil({ nombre: user?.name ?? 'Recepción', correo: user?.email ?? '', telefono: '', foto: '' });
      return;
    }
    if (!user)
      return;
    const empleado = leerEmpleados().find(e => e.id === user.id && e.activo);
    if (!empleado)
      return;
    const base = { nombre: empleado.nombre, correo: empleado.correo, telefono: empleado.telefono ?? '', foto: empleado.foto ?? '' };
    try {
      const raw = localStorage.getItem(`vs-recepcion-perfil-${empleado.id}`);
      setPerfil(raw ? { ...base, ...JSON.parse(raw) } : base);
    }
    catch {
      setPerfil(base);
    }
  },
    [user, conectado]);
  const guardarPerfil = (p: typeof perfil) => {
    setPerfil(p);
    try {
      localStorage.setItem(`vs-recepcion-perfil-${user?.id ?? 'sin-empleado'}`, JSON.stringify(p));
    }
    catch { }
  };
  const [reservaAbiertaId, setReservaAbiertaId] = useState<string | null>(null);
  const [bffCode, setBffCodeActual] = useState<string | null>(() => codigoDesdeRuta(pathname));
  function setBffCode(code: string | null) {
    if (code && conectado) {
      const target = `/recepcion/reservas/${encodeURIComponent(code)}`;
      // Connected details follow their route; demo calendar/search dialogs keep
      // their parent screen and filters. Room links navigate through Next's Link.
      if (pathname !== target) { router.push(target); return; }
    }
    setBffCodeActual(code);
    if (conectado && !code && codigoDesdeRuta(pathname)) {
      router.push('/recepcion/reservas');
    }
  }
  const [bffRefresh, setBffRefresh] = useState(0);
  const [legacyAction, setLegacyAction] = useState<ExistingAction | undefined>();
  const [legacyTab, setLegacyTab] = useState<'resumen' | 'cuenta'>('resumen');
  useEffect(() => {
    setSeccionActual(seccionDesdeRuta(pathname));
    setBffCodeActual(codigoDesdeRuta(pathname));
    setReservaAbiertaId(null);
  }, [pathname,conectado,setSeccionActual]);

  function abrirReserva(id: string) {
    const reservation = reservas.find(r => r.id === id);
    setLegacyAction(undefined);

//     if (reservation && needsReservationChannel(reservation)) {
//       setReservaAbiertaId(null); setBffCode(reservation.codigo);
//     } else { setBffCode(null); setReservaAbiertaId(id); }

    const code = reservas.find(r => r.id === id)?.codigoBff ?? (id.startsWith('bff-reservation-') ? id.slice('bff-reservation-'.length) : undefined);
    if (code) { setReservaAbiertaId(null); setBffCode(code); }
    else { setReservaAbiertaId(id); setBffCode(null);}
  } //07-oct-26 conflict resolved by Alexander

  function existingAction(detail: ReservationDetail, action: ExistingAction) {
    setLegacyAction(action);
    const id = prepareExistingReceptionScreen(detail);
    setReservas(leerReservas()); setHuespedes(leerHuespedes());
    setLegacyTab(action === 'cuenta' ? 'cuenta' : 'resumen');
    setBffCode(null); setReservaAbiertaId(id);
  }
  const [nuevaReserva, setNuevaReserva] = useState<{
    open: boolean;
    preset?: {
      entrada?: string;
      salida?: string;
      tipo?: TipoHabitacion;
      tipoHabitacionId?: number;
      habitacionId?: string;
      adultos?: number;
      ninos?: number;
    };
  }>({ open: false });
  const reservaAbierta = reservas.find(r => r.id === reservaAbiertaId) ?? null;
  const huespedAbierto = reservaAbierta ? huespedes.find(h => h.id === reservaAbierta.huespedId) ?? null : null;
  const hoyISO = fechaHoyISO();
  const badgeDia = reservas.filter(r => r.fechaEntrada === hoyISO && (r.estado === 'confirmada' || r.estado === 'pendiente')).length +
    reservas.filter(r => r.fechaSalida === hoyISO && r.estado === 'en-curso').length;
  const badgeSolicitudes = solicitudes.filter(s => s.area === 'Recepción' && s.estado !== 'atendida').length;
  function libera(habId: string | null) {
    if (!habId)
      return;
    setHabitaciones(hs => hs.map(h => {
      if (h.id !== habId)
        return h;
      if (h.estado === 'reservada' || h.estado === 'ocupada')
        return { ...h, estado: 'disponible' };
      return h;
    }));
  }
  function reservaHabitacionSiLibre(habId: string) {
    setHabitaciones(hs => hs.map(h => (h.id === habId && h.estado === 'disponible' ? { ...h, estado: 'reservada' as EstadoHabHotel } : h)));
  }
  function ocupa(habId: string, estado: EstadoHabHotel) {
    setHabitaciones(hs => hs.map(h => (h.id === habId ? { ...h, estado } : h)));
  }
  function cambiarEstadoHab(habId: string,
    nuevo: EstadoHabHotel) {
    setHabitaciones(hs => hs.map(h => {
      if (h.id !== habId)
        return h;
      if (validarCambioEstadoHab(h, nuevo, reservas))
        return h;
      return { ...h, estado: nuevo };
    }));
  }
  function actualizarHuesped(id: string, cambios: Partial<Huesped>) { setHuespedes(prev => prev.map(h => h.id === id ? { ...h, ...cambios } : h)); }
  function crearHuesped(datos: Omit<Huesped, 'id' | 'creadoEn'>): Huesped {
    const existente = leerHuespedes().find(h =>
      h.correo.trim().toLowerCase() === datos.correo.trim().toLowerCase(),
    );
    if (existente)
      return existente;
    const nuevo = upsertHuesped({ ...datos, id: generarId(), creadoEn: ahoraISO() });
    setHuespedes(leerHuespedes());
    return nuevo;
  }
  const connectedGuests = useRef(new Map<string, Huesped>());
  async function registrarHuespedConectado(datos: Omit<Huesped, 'id' | 'creadoEn'>): Promise<Huesped> {
    const { huesped: g } = await registerGuest({ nombreCompleto: datos.nombre, correo: datos.correo, telefono: datos.telefono, ...(datos.nacionalidad ? {nacionalidad: datos.nacionalidad} : {}), tipoDocumento: datos.tipoDocumento === 'DPI' ? 'DPI' : 'PASAPORTE', numeroDocumento: datos.documento });
    const value: Huesped = { ...datos, id: String(g.id), nombre: g.nombreCompleto, creadoEn: '' };
    connectedGuests.current.set(value.id, value);
    setHuespedes(prev => [...prev.filter(h => h.id !== value.id), value]);
    return value;
  }
  async function crearReserva(d: {
    huespedId: string;
    tipoHabitacion: TipoHabitacion;
    tipoHabitacionId?: number;
    solicitudId?: string;
    fechaEntrada: string;
    fechaSalida: string;
    personas: number;
    adultos?: number;
    ninos?: number;
    habitacionId: string | null;
    descuento?: number;
  }): Promise<Reserva> {
    const guest = conectado ? connectedGuests.current.get(d.huespedId) : leerHuespedes().find(h => h.id === d.huespedId);
    if (!guest && !conectado) throw new Error('Selecciona un huésped registrado.');
    const registered = conectado ? { huesped: { id: Number(d.huespedId) } } : await registerGuest({ nombreCompleto: guest!.nombre, correo: guest!.correo, telefono: guest!.telefono,
      nacionalidad: guest!.nacionalidad, tipoDocumento: guest!.tipoDocumento === 'DPI' ? 'DPI' : 'PASAPORTE', numeroDocumento: guest!.documento });
    const rooms = await getRooms();
    const type = rooms.find(r => d.tipoHabitacionId ? r.tipoHabitacion.id === d.tipoHabitacionId : r.tipoHabitacion.nombre === d.tipoHabitacion)?.tipoHabitacion;
    const room = d.habitacionId ? rooms.find(r => conectado ? String(r.id) === d.habitacionId : 'hh-' + r.numero === d.habitacionId) : null;
    if (!type || (d.habitacionId && !room)) throw new Error('Revisa la habitación seleccionada.');
    const detail = await createReservation({ huespedId: registered.huesped.id, tipoHabitacionId: type.id,
      entrada: d.fechaEntrada, salida: d.fechaSalida, numeroHuespedes: d.personas, habitacionId: room?.id ?? null }, d.solicitudId);
    if (conectado) {
      setBffRefresh(n => n + 1);
      return { id: detail.codigo, codigo: detail.codigo, huespedId: String(detail.huesped.id), habitacionId: d.habitacionId, tipoHabitacion: d.tipoHabitacion, fechaEntrada: detail.entrada, fechaSalida: detail.salida, personas: detail.numeroHuespedes, estado: 'confirmada', acompanantes: [], servicios: [], pagos: [], descuento: 0, creadoEn: detail.historial[0]?.fechaHora ?? '', precioNoche: detail.total / detail.noches };
    }
    const id = prepareExistingReceptionScreen(detail);
    const nueva = upsertReserva({ ...leerReservas().find(r => r.id === id)!, adultos: d.adultos, ninos: d.ninos });
    setReservas(leerReservas());
    setHabitaciones(aplicarTarifasHabitaciones(leerHabitaciones()));
    return nueva;
  }
  function asignarHabitacion(reservaId: string,
    habitacionId: string) {
    asignarHabitacionReserva(reservaId, habitacionId);
  }
  function modificarReserva(reservaId: string,
    c: {
      fechaEntrada: string;
      fechaSalida: string;
      personas: number;
      adultos: number;
      ninos: number;
      habitacionId: string | null;
    }) {
    const r = leerReservas().find(x => x.id === reservaId);
    if (!r || r.estado === 'finalizada' || r.estado === 'cancelada') return;
    const prev = r.habitacionId ?? null;
    let estado = r.estado;
    if (c.habitacionId && estado === 'pendiente') estado = 'confirmada';
    if (!c.habitacionId && estado === 'confirmada') estado = 'pendiente';
    upsertReserva({ ...r, ...c, estado });
    setReservas(leerReservas());
    if (prev && prev !== c.habitacionId)
      libera(prev);
    if (c.habitacionId)
      reservaHabitacionSiLibre(c.habitacionId);
  }
  const checkInPending = useRef(new Set<string>());
  async function checkedCheckIn(reservaId: string, origin: 'recepcion' | 'portal') {
    if (checkInPending.current.has(reservaId)) return;
    checkInPending.current.add(reservaId);
    const validate = origin === 'recepcion' ? errorCheckInRecepcion : errorActivacionCheckInPortal;
    try {
      const error = validate(reservaId);
      if (error) throw new Error(error);
      const reservation = leerReservas().find(r => r.id === reservaId)!;
      const room = leerHabitaciones().find(r => r.id === reservation.habitacionId)!;
      await requireReadyCheckInRoom(room.numero);
      // Revalidar después de la consulta: otra acción pudo cambiar la reserva.
      const currentError = validate(reservaId);
      if (currentError) throw new Error(currentError);
      if (leerReservas().find(r => r.id === reservaId)?.habitacionId !== reservation.habitacionId) {
        throw new Error('La habitación asignada cambió. Revisa la reserva antes del check-in.');
      }
      completarCheckInReserva(reservaId, origin);
      setReservas(leerReservas());
      setHabitaciones(aplicarTarifasHabitaciones(leerHabitaciones()));
    } catch (e) {
      setCheckInNotice(e instanceof Error ? e.message : 'No se pudo consultar el estado de la habitación. No se realizó el check-in.');
    } finally { checkInPending.current.delete(reservaId); }
  }
  function checkIn(reservaId: string) { void checkedCheckIn(reservaId, 'recepcion'); }
  function validarCheckInWeb(reservaId: string) { void checkedCheckIn(reservaId, 'portal'); }
  function rechazarCheckInWeb(reservaId: string,
    motivo: string) {
    const r = leerReservas().find(x => x.id === reservaId);
    const h = r ? huespedes.find(x => x.id === r.huespedId) : null;
    if (!r || !h || r.estado !== 'confirmada' || r.checkInWeb?.estado !== 'pendiente')
      return;
    const rechazada: Reserva = { ...r, estado: 'confirmada', checkInWeb: { ...r.checkInWeb, estado: 'rechazado', revisadoEn: ahoraISO(), motivoRevision: motivo } };
    upsertReserva(rechazada);
    setReservas(rs => rs.map(x => x.id === reservaId ? rechazada : x));
  }
  function checkOut(reservaId: string) {
    completarCheckOutReserva(reservaId, 'recepcion');
  }
  function cancelarReserva(reservaId: string,
    motivo: string) {
    const r = reservas.find(x => x.id === reservaId);
    if (!r || !permitsLocalCancellation(r))
      return;
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, estado: 'cancelada', motivoCancelacion: motivo } : x)));
    if (r.habitacionId) {
      setHabitaciones(hs => hs.map(h => {
        if (h.id !== r.habitacionId)
          return h;
        if (h.estado === 'reservada')
          return { ...h, estado: 'disponible' };
        if (h.estado === 'ocupada')
          return { ...h, estado: 'en-limpieza' };
        return h;
      }));
    }
  }
  function agregarAcompanante(reservaId: string, a: Acompanante) {
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, acompanantes: [...x.acompanantes, a] } : x)));
  }
  function quitarAcompanante(reservaId: string, index: number) {
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, acompanantes: x.acompanantes.filter((_, i) => i !== index) } : x)));
  }
  function agregarServicio(reservaId: string,
    s: Omit<ServicioAdicional, 'id' | 'fecha'>) {
    if (reservas.find(r => r.id === reservaId)?.estado !== 'en-curso') return;
    const servicio: ServicioAdicional = { ...s, id: generarId(), fecha: ahoraISO() };
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, servicios: [...x.servicios, servicio] } : x)));
  }
  function quitarServicio(reservaId: string, servicioId: string, motivo?: string) {
    setReservas(rs => rs.map(x => {
      if (x.id !== reservaId || ['finalizada', 'cancelada'].includes(x.estado) || (motivo !== undefined && (x.estado !== 'en-curso' || !motivo.trim()))) return x;
      const cargo = x.servicios.find(s => s.id === servicioId);
      if (!cargo) return x;
      return { ...x, servicios: x.servicios.filter(s => s.id !== servicioId), ...(motivo ? { cargosAnulados: [...(x.cargosAnulados ?? []), { ...cargo, motivo: motivo.trim(), fechaAnulacion: ahoraISO() }] } : {}) };
    }));
  }
  function registrarPago(reservaId: string,
    datos: {
      monto: number;
      metodo: MetodoPago;
    }): Pago {
    const selected = reservas.find(r => r.id === reservaId);
    if (!selected || ['finalizada', 'cancelada'].includes(selected.estado)) throw new Error('La cuenta está cerrada.');
    const saldo = calcularCuenta(selected, habitaciones.find(h => h.id === selected.habitacionId) ?? null).saldo;
    if (saldo <= 0 || Math.abs(datos.monto - saldo) > 0.01) throw new Error('Registra únicamente el saldo completo de esta reserva.');
    const pago: Pago = {
      destino: 'consumos',
      id: generarId(),
      fecha: ahoraISO(),
      monto: datos.monto,
      metodo: datos.metodo,
      comprobante: siguienteComprobante(),
    };
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, pagos: [...x.pagos, pago] } : x)));
    return pago;
  }
  function aplicarDescuento(reservaId: string, monto: number) {
    setReservas(rs => rs.map(x => (x.id === reservaId && !['finalizada', 'cancelada'].includes(x.estado) ? { ...x, descuento: monto } : x)));
  }
  function registrarSolicitud(s: Omit<SolicitudHuesped, 'id' | 'fecha' | 'estado'>) {
    setSolicitudes(prev => [{ ...s, id: generarId(), fecha: ahoraISO(), estado: 'pendiente' }, ...prev]);
  }
  function cambiarEstadoSolicitud(id: string, estado: EstadoSolicitudHuesped) {
    setSolicitudes(prev => prev.map(x => (x.id === id ? { ...x, estado } : x)));
  }
  function cambiarObjeto(id: string, cambios: Partial<ObjetoOlvidado>) {
    actualizarObjetoOlvidado(id, cambios);
    setObjetos(leerObjetosOlvidados());
  }
  const calendarioDia = <section aria-label="Calendario del día" className="h-[62dvh] min-h-[400px] max-h-[650px]"><CalendarioReservas conectado={conectado} reservas={conectado?EMPTY_RESERVATIONS:reservas} huespedes={conectado?EMPTY_GUESTS:huespedes} habitaciones={conectado?EMPTY_ROOMS:habitaciones} onAbrir={conectado?id=>{setCalendarOpen(false);setBffCode(id.replace("bff-reservation-", ""));}:abrirReserva} onNueva={preset=>setNuevaReserva({open:true,preset:preset?{...preset,tipo:preset.tipo as TipoHabitacion}:undefined})} /></section>;
  const contenido = (() => {
    if (conectado) {
      if (seccion === "dia") return calendarOpen?<div className="flex-1 min-h-0 flex flex-col bg-[#F8F6F0]"><div className="px-4 pt-3"><button type="button" onClick={()=>setCalendarOpen(false)} className="rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]">← Volver a vista del día</button></div><div className="min-h-0 flex-1 p-4"><CalendarioReservas conectado reservas={EMPTY_RESERVATIONS} huespedes={EMPTY_GUESTS} habitaciones={EMPTY_ROOMS} onAbrir={id=>{setCalendarOpen(false);setBffCode(id.replace("bff-reservation-", ""));}} onNueva={preset=>setNuevaReserva({open:true,preset:preset?{...preset,tipo:preset.tipo as TipoHabitacion}:undefined})}/></div></div>:<ConnectedReceptionDay calendario={calendarioDia} onVerCalendario={()=>setCalendarOpen(true)} refreshTick={bffRefresh} onAbrirReserva={setBffCode} onIr={setSeccion}/>;
      if (seccion === "reservas") return <Reservas refreshTick={bffRefresh} reservas={EMPTY_RESERVATIONS} huespedes={EMPTY_GUESTS} habitaciones={EMPTY_ROOMS} onAbrir={setBffCode} onNueva={() => setNuevaReserva({ open: true })} />;
      if (seccion === "huespedes") return <Huespedes conectado huespedes={EMPTY_GUESTS} reservas={EMPTY_RESERVATIONS} habitaciones={EMPTY_ROOMS} onRegistrar={() => {}} onActualizar={() => {}} onAbrirReserva={setBffCode} />;
      if (seccion === "habitaciones") return <HabitacionesRecepcion conectado habitaciones={EMPTY_ROOMS} reservas={EMPTY_RESERVATIONS} huespedes={EMPTY_GUESTS} onCambiarEstado={() => {}} onVerReserva={() => {}} onVerReservaBff={setBffCode} />;
      if (seccion === "incidencias") return <IncidenciasRecepcion />;
      if (seccion === 'disponibilidad') return <Disponibilidad conectado habitaciones={EMPTY_ROOMS} reservas={EMPTY_RESERVATIONS} onReservar={preset => setNuevaReserva({ open: true, preset })} />;
      if (seccion === 'chat') return <ConnectedReceptionChat />;
      if (seccion === 'objetos') return <ObjetosEncontradosConectados />;
    }
    switch (seccion) {
      case 'dia':
        return (<DiaRecepcion calendario={calendarioDia} reservas={reservas} huespedes={huespedes} habitaciones={habitaciones} onAbrirReserva={abrirReserva} onIr={setSeccion} />);
      case 'reservas':
        return (<Reservas
          refreshTick={bffRefresh}
          reservas={reservas}
          huespedes={huespedes}
          habitaciones={habitaciones}
          onAbrir={setBffCode}
          onNueva={() => setSeccion('disponibilidad')} />);
      case 'disponibilidad':
        return (<Disponibilidad habitaciones={habitaciones} reservas={reservas} onReservar={preset => setNuevaReserva({ open: true, preset })} />);
      case 'habitaciones':
        return (<HabitacionesRecepcion
          habitaciones={habitaciones}
          reservas={reservas}
          huespedes={huespedes}
          onCambiarEstado={cambiarEstadoHab}
          onVerReservaBff={codigo => {
            setLegacyAction(undefined);
            setReservaAbiertaId(null);
            setBffCode(codigo);
          }}
          onVerReserva={id => {
            abrirReserva(id);
          }} />);
      case 'huespedes':
        return (<Huespedes
          huespedes={huespedes}
          reservas={reservas}
          habitaciones={habitaciones}
          onRegistrar={crearHuesped}
          onActualizar={actualizarHuesped}
          onAbrirReserva={id => {
            abrirReserva(id);
          }} />);
      case 'solicitudes':
      case 'reportes':
      case 'incidencias':
        return <IncidenciasRecepcion />;
      case 'chat':
        return <ChatRecepcion huespedes={huespedes} reservas={reservas} habitaciones={habitaciones} />;
      case 'objetos':
        return <ObjetosRecepcion objetos={objetos} habitaciones={habitaciones} reservas={reservas} huespedes={huespedes} onActualizar={cambiarObjeto} />;
    }
  })();
  return (<div data-vs-workspace="recepcion" className={"h-dvh min-h-0 w-full flex flex-col overflow-hidden"} style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="flex-1 flex overflow-hidden">

      {checkInNotice && <ReceptionNotice title="No se pudo iniciar la estancia" message={checkInNotice} onClose={() => setCheckInNotice('')} />}
<nav data-vs-sidebar="recepcion" className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-56 h-[100dvh]" style={{ backgroundColor: '#102747' }}>
        <div className="shrink-0 border-b px-[22px] pb-5 pt-6" style={{borderColor:'#1d3a5f'}}><SidebarBrand module="Recepción"/></div>

        <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'dia' ? badgeDia : s.id === 'solicitudes' ? badgeSolicitudes : s.id === 'objetos' ? objetos.filter(o => o.estado !== 'devuelto').length : 0;
            return (<button data-vs-active={active}
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors relative"
              style={{ color: active ? '#FFFFFF' : '#AEBCC1', backgroundColor: active ? '#18345C' : 'transparent' }}>
              {active && <span className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: '#D8B94E' }} />}
              <span className="w-5 h-5 shrink-0 grid place-items-center" style={{ color: active ? '#D8B94E' : '#AEBCC1' }} aria-hidden="true">
                <SeccionIcon id={s.id} />
              </span>
              <span className="text-sm font-medium flex-1">
                {s.label}
              </span>
              {badge > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
                {badge}
              </span>)}
            </button>);
          })}
        </div>

        <div className="px-4 py-2 border-t shrink-0" style={{ borderColor: '#1d3a5f' }}>
          <button
            onClick={() => setPerfilAbierto(true)}
            className="w-full min-h-16 flex items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-[#18345C] transition-colors"
            title="Abrir mi perfil"><StaffSidebarIdentity/></button>
        </div>
      </nav>

      <div data-vs-shell-main="recepcion" className="flex-1 lg:ml-56 flex flex-col overflow-hidden">
        <div data-vs-topbar="recepcion" className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: '#102747' }}>
          <div className="min-w-0 shrink-0 lg:hidden"><SidebarBrand module="Recepción"/></div>
          <p className="text-[#AEBCC1] text-xs font-medium truncate flex-1">
            {SECCIONES.find(s => s.id === seccion)?.label}
          </p>
          <button className="lg:hidden text-xs text-white" onClick={() => setPerfilAbierto(true)}>Mi perfil</button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {contenido}
        </div>

        <div data-vs-mobile-nav="recepcion" className="lg:hidden flex shrink-0 border-t overflow-x-auto" style={{ backgroundColor: '#102747', borderColor: '#1d3a5f' }}>
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'dia' ? badgeDia : s.id === 'solicitudes' ? badgeSolicitudes : s.id === 'objetos' ? objetos.filter(o => o.estado !== 'devuelto').length : 0;
            return (<button data-vs-active={active}
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="flex-1 min-w-[62px] flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors"
              style={{ color: active ? '#D8B94E' : '#AEBCC1' }}>
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5" style={{ backgroundColor: '#D8B94E' }} />}
              <span className="relative">
                <SeccionIcon id={s.id} size={20} />
                {badge > 0 && (<span
                  className="absolute -top-1 -right-2 text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
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

    {perfilAbierto && (<StaffProfileModal open={perfilAbierto} onClose={() => setPerfilAbierto(false)} name={perfil.nombre} role="Recepción" email={perfil.correo} />)}

    {bffCode && <DetalleReserva conectado={conectado} codigo={bffCode} onCerrar={() => {
      setBffCode(null);
      if (!conectado && codigoDesdeRuta(pathname)) router.push('/recepcion/reservas');
      setBffRefresh(n => n + 1);
    }} onExistingAction={conectado ? detail => window.location.assign(`/panel/recepcion/reservas/${detail.codigo}/cuenta`) : existingAction} />}
    {reservaAbierta && huespedAbierto && (<DetalleReserva
      initialTab={legacyTab}
      bffAction={legacyAction}
      reserva={reservaAbierta}
      huesped={huespedAbierto}
      habitaciones={habitaciones}
      reservas={reservas}
      solicitudes={solicitudes}
      onCerrar={() => { setReservaAbiertaId(null); setLegacyAction(undefined); }}
      onAsignarHabitacion={asignarHabitacion}
      onCheckIn={checkIn}
      onValidarCheckInWeb={validarCheckInWeb}
      onRechazarCheckInWeb={rechazarCheckInWeb}
      onCheckOut={checkOut}
      onModificar={modificarReserva}
      onCancelar={cancelarReserva}
      onAgregarAcompanante={agregarAcompanante}
      onQuitarAcompanante={quitarAcompanante}
      onAgregarServicio={agregarServicio}
      onQuitarServicio={quitarServicio}
      onRegistrarPago={registrarPago}
      onAplicarDescuento={aplicarDescuento} />)}

    {nuevaReserva.open && (<NuevaReservaModal conectado={conectado}
      huespedes={huespedes}
      habitaciones={habitaciones}
      reservas={reservas}
      preset={nuevaReserva.preset}
      onCerrar={() => setNuevaReserva({ open: false })}
      onVerReserva={id => {
        setNuevaReserva({ open: false });
        const code = conectado ? id : reservas.find(r => r.id === id)?.codigoBff;
        if (code) {
          // Commit the detail route in one navigation, so its code survives
          // route synchronization and any page remount.
          router.push(`/recepcion/reservas/${encodeURIComponent(code)}`);
        } else {
          setSeccion('reservas');
          abrirReserva(id);
        }
      }}
      onCrearHuesped={conectado ? registrarHuespedConectado : crearHuesped}
      onCrearReserva={crearReserva} />)}
  </div>);
}
function PerfilRecepcionModal({ perfil, onGuardar, onCerrar }: {
  perfil: {
    nombre: string;
    correo: string;
    telefono: string;
    foto: string;
  };
  onGuardar: (p: { nombre: string; correo: string; telefono: string; foto: string }) => void;
  onCerrar: () => void;
}) {
  const [form, setForm] = useState(perfil);
  const iniciales = form.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map(n => n[0]?.toUpperCase()).join('') || 'R';
  const [editando, setEditando] = useState<'nombre' | 'telefono' | 'correo' | null>(null);
  const [verificacion, setVerificacion] = useState<'telefono' | 'correo' | null>(null);
  const [codigo, setCodigo] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [claveAbierta, setClaveAbierta] = useState(false);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [ver, setVer] = useState(false);
  const requisitos = {
    largo: nueva.length >= 8,
    mayus: /[A-ZÁÉÍÓÚÑ]/.test(nueva),
    minus: /[a-záéíóúñ]/.test(nueva),
    numero: /\d/.test(nueva),
    especial: /[^A-Za-zÁÉÍÓÚÑáéíóúñ0-9]/.test(nueva)
  };
  const claveValida = Object.values(requisitos).every(Boolean);
  const ocultarTel = (v: string) => v.replace(/\d(?=\D*\d{2}\D*$|.*\d.*\d.*\d)/g, '•').replace(/(\d{2})$/, '$1');
  const ocultarCorreo = (v: string) => {
    const [a, b] = v.split('@');
    return b ? `${a.slice(0, 2)}${'•'.repeat(Math.max(4, a.length - 2))}@${b}` : 'correo protegido';
  };
  function foto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f)
      return;
    const r = new FileReader();
    r.onload = () => {
      const v = { ...form, foto: String(r.result) };
      setForm(v);
      onGuardar(v);
      setMensaje('Foto actualizada.');
    };
    r.readAsDataURL(f);
  }
  function guardarCampo(c: 'nombre' | 'telefono' | 'correo') {
    if (c === 'nombre') {
      onGuardar(form);
      setEditando(null);
      setMensaje('Nombre actualizado correctamente.');
      return;
    }
    setVerificacion(c);
    setCodigo('');
    setMensaje(`Código de verificación preparado para ${c === 'telefono' ? 'el nuevo teléfono' : 'el nuevo correo'}.`);
  }
  function confirmarCodigo() {
    if (codigo.length !== 6)
      return;
    onGuardar(form);
    setVerificacion(null);
    setEditando(null);
    setCodigo('');
    setMensaje(verificacion === 'telefono' ? 'Número de teléfono actualizado correctamente.' : 'Correo electrónico actualizado correctamente.');
  }
  function cancelarCambio() {
    setForm(perfil);
    setVerificacion(null);
    setEditando(null);
    setCodigo('');
    setMensaje('');
  }
  function cambiarClave() {
    if (!actual) {
      setMensaje('Ingresa tu contraseña actual.');
      return;
    }
    if (!claveValida) {
      setMensaje('La nueva contraseña todavía no cumple todos los requisitos.');
      return;
    }
    if (nueva !== confirmar) {
      setMensaje('La confirmación no coincide con la nueva contraseña.');
      return;
    }
    setActual('');
    setNueva('');
    setConfirmar('');
    setClaveAbierta(false);
    setMensaje('Solicitud de cambio de contraseña preparada.');
  }
  const fila = (campo: 'nombre' | 'telefono' | 'correo',
    titulo: string) => <div className="border border-[#E5E0D8] rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1">
        <p className="text-[11px] uppercase tracking-wider text-[#AEBCC1]">
          {titulo}
        </p>
        {editando === campo ? <input
          autoFocus
          value={form[campo]}
          onChange={e => setForm({ ...form, [campo]: e.target.value })}
          className="mt-1 w-full border-b border-[#18345C] outline-none py-1 text-[#102747]" /> : <p className="font-semibold text-[#102747] mt-1">
          {form[campo]}
        </p>}
      </div>
      {editando === campo ? <button onClick={() => guardarCampo(campo)} className="px-3 py-2 bg-[#102747] text-white rounded-lg text-sm font-semibold">Guardar cambio</button> : <button
        onClick={() => {
          setEditando(campo);
          setVerificacion(null);
          setMensaje('');
        }}
        aria-label={`Editar ${titulo}`}
        className="w-9 h-9 rounded-full border flex items-center justify-center text-[#102747]">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>}
    </div>;
  return <div
    className="fixed inset-0 z-[100] bg-black/45 flex items-center justify-center p-4"
    onMouseDown={e => {
      if (e.target === e.currentTarget)
        onCerrar();
    }}>
    <div data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="medium" className="reception-compact bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[.18em] text-[#B38719] uppercase">Mi perfil</p>
          <h2 className="text-2xl font-semibold text-[#102747]">Información de recepción</h2>
        </div>
        <ReceptionCloseButton onClick={onCerrar} />
      </div>
      <div className="p-6 max-h-[76vh] overflow-y-auto space-y-6">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-[#F3E8B8] overflow-hidden flex items-center justify-center font-bold text-xl text-[#102747]">
            {form.foto ? <img src={form.foto} className="w-full h-full object-cover" alt="Foto de perfil" /> : iniciales}
          </div>
          <label className="cursor-pointer text-sm font-semibold text-[#102747] underline underline-offset-4">Cambiar foto<input type="file" accept="image/*" className="hidden" onChange={foto} /></label>
        </div>
        <div className="space-y-3">
          {fila('nombre', 'Nombre')}
          {fila('telefono', 'Teléfono')}
          {fila('correo', 'Correo electrónico')}
        </div>
        {verificacion && <div className="rounded-xl border border-[#D8E2EC] bg-[#F5FAFF] p-4">
          <p className="font-semibold text-[#102747]">Verificar nuevo {verificacion}</p>
          <p className="mt-1 text-xs text-[#71839B]">Ingresa el código de 6 dígitos para confirmar el cambio.</p>
          <input
            maxLength={6}
            inputMode="numeric"
            value={codigo}
            onChange={e => setCodigo(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="mt-3 w-full rounded-lg border px-3 py-2 text-center tracking-[.35em]" />
          <div className="mt-3 flex items-center justify-between gap-3">
            <button onClick={() => {
              setCodigo('');
              setMensaje('Código reenviado.');
            }} className="font-semibold text-[#18345C] underline">Reenviar código</button>
            <div data-vs-actions="compact" className="flex gap-2">
              <button onClick={cancelarCambio} className="rounded-lg border px-3 py-2">Cancelar</button>
              <button
                disabled={codigo.length !== 6}
                onClick={confirmarCodigo}
                className="rounded-lg bg-[#102747] px-4 py-2 font-semibold text-white disabled:opacity-40">Confirmar</button>
            </div>
          </div>
        </div>}
        <div className="border-t pt-5">
          {!claveAbierta ? <button onClick={() => setClaveAbierta(true)} className="px-5 py-2.5 bg-[#102747] text-white rounded-lg font-semibold">Cambiar contraseña</button> : <><h3 className="text-lg font-semibold text-[#102747]">Cambiar contraseña</h3><p className="text-sm text-gray-500 mb-3">Por seguridad, primero confirma tu contraseña actual.</p><div className="grid gap-3">
            <input
              type={ver ? 'text' : 'password'}
              placeholder="Contraseña actual"
              value={actual}
              onChange={e => setActual(e.target.value)}
              className="border rounded-lg px-3 py-3" />
            <input
              type={ver ? 'text' : 'password'}
              placeholder="Nueva contraseña"
              value={nueva}
              onChange={e => setNueva(e.target.value)}
              className="border rounded-lg px-3 py-3" />
            <input
              type={ver ? 'text' : 'password'}
              placeholder="Confirmar nueva contraseña"
              value={confirmar}
              onChange={e => setConfirmar(e.target.value)}
              className="border rounded-lg px-3 py-3" />
            <button onClick={() => setVer(!ver)} className="text-left text-xs text-[#18345C] underline">
              {ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            </button>
          </div>{nueva && <div className="grid sm:grid-cols-2 gap-1 mt-3 text-xs text-gray-500">
            <span>{requisitos.largo ? '✓' : '○'} Mínimo 8 caracteres</span>
            <span>{requisitos.mayus ? '✓' : '○'} Una mayúscula</span>
            <span>{requisitos.minus ? '✓' : '○'} Una minúscula</span>
            <span>{requisitos.numero ? '✓' : '○'} Un número</span>
            <span>{requisitos.especial ? '✓' : '○'} Un carácter especial</span>
          </div>}<div data-vs-actions="compact" className="flex gap-3 mt-4">
              <button onClick={cambiarClave} className="px-5 py-2.5 bg-[#102747] text-white rounded-lg font-semibold">Guardar nueva contraseña</button>
              <button onClick={() => {
                setClaveAbierta(false);
                setActual('');
                setNueva('');
                setConfirmar('');
              }} className="px-5 py-2.5 border rounded-lg">Cancelar</button>
            </div></>}
        </div>
        {mensaje && <p className="text-sm rounded-lg bg-[#F8F6F0] p-3 text-[#102747]">
          {mensaje}
        </p>}
      </div>
      <div className="px-6 py-4 border-t flex items-center justify-between gap-3">
        <button
          onClick={() => {
            localStorage.removeItem('vs-auth');
            localStorage.removeItem('villa-serena-session');
            window.location.href = '/login';
          }}
          className="px-4 py-2 font-semibold text-[#B42318]"><svg className="inline mr-2" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          </svg>Cerrar sesión</button>

      </div>
    </div>
  </div>;
}
