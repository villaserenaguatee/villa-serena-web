import CalendarioReservas from './CalendarioReservas';
import { crearReservaRecepcionDemo } from '@/store/receptionReservation';
import { asignarHabitacionReserva } from '@/store/reservationAssignment';
import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import SolicitudesRecepcion from '@/features/recepcion/pages/SolicitudesRecepcion';
import DetalleReserva from '@/features/recepcion/pages/DetalleReserva';
import NuevaReservaModal from '@/features/recepcion/pages/NuevaReservaModal';
import ChatRecepcion from '@/features/recepcion/pages/ChatRecepcion';
import ObjetosRecepcion from '@/features/recepcion/pages/ObjetosRecepcion';
import ReportesRecepcion from '@/features/recepcion/pages/ReportesRecepcion';
import IncidenciasArea from '@/components/common/IncidenciasArea';
import StaffProfileModal from '@/components/common/StaffProfileModal';
import { leerEmpleados } from '@/store/employeeStore';
import { guardarHuespedes, leerHuespedes, upsertHuesped, HUESPEDES_EVENT } from '@/store/guestStore';
import { guardarReservas, leerReservas, RESERVAS_EVENT, upsertReserva } from '@/store/reservationStore';
import { guardarHabitaciones, leerHabitaciones, HABITACIONES_EVENT } from '@/store/roomStore';
import { EVENTO_INCIDENCIAS_MANTENIMIENTO, leerIncidenciasMantenimiento, reportarIncidenciaMantenimiento } from '@/store/maintenanceEvents';
import { completarCheckInReserva, completarCheckOutReserva, errorActivacionCheckInPortal, errorCheckInRecepcion } from '@/store/reservationStore';
import { actualizarObjetoOlvidado, CLAVE_OBJETOS_OLVIDADOS, guardarObjetosOlvidados, leerObjetosOlvidados } from '@/store/lostFoundEvents';
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
    { id: 'solicitudes', label: 'Solicitudes', corto: 'Solicit.' },
    { id: 'incidencias', label: 'Incidencias', corto: 'Incid.' },
    { id: 'reportes', label: 'Reportes', corto: 'Reportes' },
    { id: 'objetos', label: 'Objetos olvidados', corto: 'Objetos' },
    { id: 'chat', label: 'Chat con huéspedes', corto: 'Chat' },
  ];
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
  onCambiarModulo: (m: Modulo) => void;
}
export default function RecepcionApp({ onCambiarModulo }: Props) {
  const { user } = useAuth();
  const [huespedes, setHuespedes] = useState<Huesped[]>(() => leerHuespedes());
  useEffect(() => guardarHuespedes(huespedes), [huespedes]);
  useEffect(() => {
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
  const [reservas, setReservas] = useState<Reserva[]>(() => leerReservas());
  useEffect(() => guardarReservas(reservas), [reservas]);
  const [habitaciones, setHabitaciones] = useState<HabitacionHotel[]>(() => aplicarTarifasHabitaciones(leerHabitaciones()));
  useEffect(() => guardarHabitaciones(habitaciones), [habitaciones]);
  useEffect(() => {
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
  const [incidencias, setIncidencias] = useState<Incidencia[]>(() => leerIncidenciasMantenimiento());
  useEffect(() => {
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
    const sincronizar = () => setIncidencias(leerIncidenciasMantenimiento());
    window.addEventListener(EVENTO_INCIDENCIAS_MANTENIMIENTO, sincronizar);
    return () => window.removeEventListener(EVENTO_INCIDENCIAS_MANTENIMIENTO, sincronizar);
  },
    []);
  useEffect(() => {
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
  const [seccion, setSeccion] = useState<SeccionRecepcion>('dia');
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [perfil, setPerfil] = useState(() => {
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
    [user]);
  const inicialesPerfil = perfil.nombre.split(/\s+/).filter(Boolean).slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join('') || 'R';
  const guardarPerfil = (p: typeof perfil) => {
    setPerfil(p);
    try {
      localStorage.setItem(`vs-recepcion-perfil-${user?.id ?? 'sin-empleado'}`, JSON.stringify(p));
    }
    catch { }
  };
  const [reservaAbiertaId, setReservaAbiertaId] = useState<string | null>(null);
  const [nuevaReserva, setNuevaReserva] = useState<{
    open: boolean;
    preset?: {
      entrada?: string;
      salida?: string;
      tipo?: TipoHabitacion;
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
  function crearReserva(d: {
    huespedId: string;
    tipoHabitacion: TipoHabitacion;
    fechaEntrada: string;
    fechaSalida: string;
    personas: number;
    adultos?: number;
    ninos?: number;
    habitacionId: string | null;
    descuento?: number;
  }): Reserva {
    const nueva = crearReservaRecepcionDemo(d);
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
  function checkIn(reservaId: string) {
    const error = errorCheckInRecepcion(reservaId);
    if (error) { window.alert(error); return; }
    completarCheckInReserva(reservaId, 'recepcion');
  }
  function validarCheckInWeb(reservaId: string) {
    const error = errorActivacionCheckInPortal(reservaId);
    if (error) { window.alert(error); return; }
    completarCheckInReserva(reservaId, 'portal');
    setReservas(leerReservas());
    setHabitaciones(aplicarTarifasHabitaciones(leerHabitaciones()));
  }
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
    if (!r)
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
    const servicio: ServicioAdicional = { ...s, id: generarId(), fecha: ahoraISO() };
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, servicios: [...x.servicios, servicio] } : x)));
  }
  function quitarServicio(reservaId: string, servicioId: string) {
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, servicios: x.servicios.filter(s => s.id !== servicioId) } : x)));
  }
  function registrarPago(reservaId: string,
    datos: {
      monto: number;
      metodo: MetodoPago;
    }): Pago {
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
    setReservas(rs => rs.map(x => (x.id === reservaId ? { ...x, descuento: monto } : x)));
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
  const contenido = (() => {
    switch (seccion) {
      case 'dia':
        return (<DiaRecepcion reservas={reservas} huespedes={huespedes} habitaciones={habitaciones} onAbrirReserva={setReservaAbiertaId} onIr={setSeccion} />);
      case 'reservas':
        return (<Reservas
          reservas={reservas}
          huespedes={huespedes}
          habitaciones={habitaciones}
          onAbrir={setReservaAbiertaId}
          onNueva={() => setSeccion('disponibilidad')} />);
      case 'disponibilidad':
        return (<Disponibilidad habitaciones={habitaciones} reservas={reservas} onReservar={preset => setNuevaReserva({ open: true, preset })} />);
      case 'habitaciones':
        return (<HabitacionesRecepcion
          habitaciones={habitaciones}
          reservas={reservas}
          huespedes={huespedes}
          onCambiarEstado={cambiarEstadoHab}
          onVerReserva={id => {
            setSeccion('reservas');
            setReservaAbiertaId(id);
          }} />);
      case 'huespedes':
        return (<Huespedes
          huespedes={huespedes}
          reservas={reservas}
          habitaciones={habitaciones}
          onRegistrar={crearHuesped}
          onActualizar={actualizarHuesped}
          onAbrirReserva={id => {
            setSeccion('reservas');
            setReservaAbiertaId(id);
          }} />);
      case 'solicitudes':
        return (<SolicitudesRecepcion
          solicitudes={solicitudes}
          huespedes={huespedes}
          reservas={reservas}
          habitaciones={habitaciones}
          onRegistrar={registrarSolicitud}
          onCambiarEstado={cambiarEstadoSolicitud} />);
      case 'incidencias':
        return <IncidenciasArea
          areaReporta="Recepción"
          incidencias={incidencias}
          habitaciones={habitaciones}
          onRegistrar={inc => {
            reportarIncidenciaMantenimiento(inc);
            setIncidencias(leerIncidenciasMantenimiento());
          }} />;
      case 'reportes':
        return <ReportesRecepcion habitaciones={habitaciones} reservas={reservas} huespedes={huespedes} />;
      case 'chat':
        return <ChatRecepcion huespedes={huespedes} reservas={reservas} habitaciones={habitaciones} />;
      case 'objetos':
        return <ObjetosRecepcion objetos={objetos} habitaciones={habitaciones} reservas={reservas} huespedes={huespedes} onActualizar={cambiarObjeto} />;
    }
  })();
  return (<div className="size-full flex flex-col overflow-hidden" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="flex-1 flex overflow-hidden">

      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-56 h-[100dvh]" style={{ backgroundColor: '#102747' }}>
        <div className="px-5 pt-5 pb-5 border-b shrink-0 text-center" style={{ borderColor: '#1d3a5f' }}>
          <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="w-32 max-h-24 object-contain mx-auto" />
          <p className="text-xs mt-2" style={{ color: '#AEBCC1', letterSpacing: '0.06em' }}>Recepción</p>
        </div>

        <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'dia' ? badgeDia : s.id === 'solicitudes' ? badgeSolicitudes : s.id === 'objetos' ? objetos.filter(o => o.estado !== 'devuelto').length : 0;
            return (<button
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

        <div className="px-4 py-4 border-t shrink-0" style={{ borderColor: '#1d3a5f' }}>
          <button
            onClick={() => setPerfilAbierto(true)}
            className="w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-[#18345C] transition-colors"
            title="Abrir mi perfil">
            {perfil.foto ? <img src={perfil.foto} alt={perfil.nombre} className="w-9 h-9 rounded-full object-cover shrink-0" /> : <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
              {inicialesPerfil}
            </div>}
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">
                {perfil.nombre}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#AEBCC1' }}>Recepción · turno de día</p>
              <p className="text-[9px] mt-0.5" style={{ color: '#D8B94E' }}>Perfil</p>
            </div>
          </button>
        </div>
      </nav>

      <div className="flex-1 lg:ml-56 flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: '#102747' }}>
          <p className="lg:hidden text-white text-lg font-bold">Villa Serena</p>
          <span className="lg:hidden text-[#AEBCC1] text-xs">·</span>
          <p className="text-[#AEBCC1] text-xs font-medium truncate flex-1">
            {SECCIONES.find(s => s.id === seccion)?.label}
          </p>
          <button className="lg:hidden text-xs text-white" onClick={() => setPerfilAbierto(true)}>Mi perfil</button>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {seccion === 'dia' ? <div className="flex-1 overflow-y-auto"><div className="p-4"><p className="mb-2 text-sm text-[#71839B]">Modo demo local · API de Recepción pendiente</p><Link href="/panel/recepcion/reservas/VS-DEMO-4C/cuenta" className="mb-3 inline-block text-sm font-semibold text-[#18345C] underline">Cuenta, check-out y factura de demostración</Link><CalendarioReservas reservas={reservas} huespedes={huespedes} habitaciones={habitaciones} onAbrir={setReservaAbiertaId} onNueva={() => setNuevaReserva({ open: true })} /></div>{contenido}</div> : contenido}
        </div>

        <div className="lg:hidden flex shrink-0 border-t overflow-x-auto" style={{ backgroundColor: '#102747', borderColor: '#1d3a5f' }}>
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'dia' ? badgeDia : s.id === 'solicitudes' ? badgeSolicitudes : s.id === 'objetos' ? objetos.filter(o => o.estado !== 'devuelto').length : 0;
            return (<button
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

    {reservaAbierta && huespedAbierto && (<DetalleReserva
      reserva={reservaAbierta}
      huesped={huespedAbierto}
      habitaciones={habitaciones}
      reservas={reservas}
      solicitudes={solicitudes}
      onCerrar={() => setReservaAbiertaId(null)}
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

    {nuevaReserva.open && (<NuevaReservaModal
      huespedes={huespedes}
      habitaciones={habitaciones}
      reservas={reservas}
      preset={nuevaReserva.preset}
      onCerrar={() => setNuevaReserva({ open: false })}
      onVerReserva={id => {
        setNuevaReserva({ open: false });
        setSeccion('reservas');
        setReservaAbiertaId(id);
      }}
      onCrearHuesped={crearHuesped}
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
  onGuardar: (p: any) => void;
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
    setMensaje('Solicitud de cambio de contraseña preparada para validación con el servidor.');
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
    <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden">
      <div className="px-6 py-5 border-b flex items-center justify-between">
        <div>
          <p className="text-xs tracking-[.18em] text-[#B38719] uppercase">Mi perfil</p>
          <h2 className="text-2xl font-semibold text-[#102747]">Información de recepción</h2>
        </div>
        <button onClick={onCerrar} className="text-2xl text-[#102747]">×</button>
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
            <div className="flex gap-2">
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
          </div>}<div className="flex gap-3 mt-4">
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
        <button onClick={onCerrar} className="px-5 py-2 border rounded-lg">Cerrar</button>
      </div>
    </div>
  </div>;
}
