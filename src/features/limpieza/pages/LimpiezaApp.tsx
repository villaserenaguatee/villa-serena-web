'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { Pantalla, Modulo, Habitacion, Solicitud, Incidencia, ObjetoOlvidado, EntradaHistorial, EstadoHabitacion } from '@/lib/pms/types';
import { generarId, horaActual } from '@/data/pms';
import Inicio from '@/features/limpieza/pages/InicioLimpieza';
import Mapa from '@/features/limpieza/pages/MapaHabitaciones';
import Solicitudes from '@/features/limpieza/pages/SolicitudesLimpieza';
import Incidencias from '@/features/limpieza/pages/IncidenciasLimpieza';
import Objetos from '@/features/limpieza/pages/ObjetosOlvidados';
import Historial from '@/features/limpieza/pages/HistorialLimpieza';
import RoomServiceApp from '@/features/roomservice/pages/RoomServiceApp';
import RecepcionApp from '@/features/recepcion/pages/RecepcionApp';
import AdminApp from '@/features/admin/pages/AdminApp';
import MantenimientoApp from '@/features/mantenimiento/pages/MantenimientoApp';
import HuespedApp from '@/features/huesped/pages/HuespedApp';
import ModuloSwitcher from '@/components/common/ModuloSwitcher';
import StaffProfileModal from '@/components/common/StaffProfileModal';
import { leerEmpleados } from '@/store/employeeStore';
import { leerHabitacionesLimpieza, guardarEstadoLimpieza, leerHabitaciones, guardarHabitaciones, HABITACIONES_EVENT } from '@/store/roomStore';
import { leerReservas } from '@/store/reservationStore';
import { actualizarTareaLimpiezaSalida, CLAVE_TAREAS_SALIDA, leerTareasLimpiezaSalida } from '@/store/cleaningEvents';
import { CLAVE_OBJETOS_OLVIDADOS, leerObjetosOlvidados, registrarObjetoOlvidado } from '@/store/lostFoundEvents';
import { reportarIncidenciaMantenimiento } from '@/store/maintenanceEvents';
const ICONS: Record<Pantalla, (size?: number) => React.ReactNode> = {
  inicio: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>),
  mapa: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
  </svg>),
  solicitudes: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>),
  incidencias: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>),
  objetos: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <path d="M16 11h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2h2" />
    <path d="M9 11V7a3 3 0 0 1 6 0v4" />
  </svg>),
  historial: (s = 18) => (<svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>),
};
const NAV_LABELS: Record<Pantalla, string> = {
  inicio: 'Inicio',
  mapa: 'Mapa',
  solicitudes: 'Solicitudes',
  incidencias: 'Incidencias',
  objetos: 'Objetos',
  historial: 'Historial',
};
const NAV_LABELS_SIDEBAR: Record<Pantalla, string> = {
  inicio: 'Inicio',
  mapa: 'Mapa de habitaciones',
  solicitudes: 'Solicitudes',
  incidencias: 'Incidencias',
  objetos: 'Objetos olvidados',
  historial: 'Historial',
};
const PANTALLAS: Pantalla[] = ['inicio', 'mapa', 'solicitudes', 'incidencias', 'objetos', 'historial'];
function Sidebar({ pantalla, setPantalla, solPendientes, incPendientes, onCambiarModulo, onEditarPerfil, }: {
  pantalla: Pantalla;
  setPantalla: (p: Pantalla) => void;
  solPendientes: number;
  incPendientes: number;
  onCambiarModulo: (m: Modulo) => void;
  onEditarPerfil: () => void;
}) {
  const { user } = useAuth();
  const empleadosActuales = leerEmpleados();
  const empleadoLimpieza = empleadosActuales.find(e => e.id === user?.id && e.activo);
  const nombreLimpieza = empleadoLimpieza?.nombre ?? 'Limpieza';
  const perfilKey = empleadoLimpieza?.correo ? `vs-perfil-personal-${empleadoLimpieza.correo.toLowerCase()}` : '';
  const [perfil, setPerfil] = useState({ nombre: nombreLimpieza, foto: empleadoLimpieza?.foto || '' });
  useEffect(() => {
    const cargar = () => {
      try {
        const p = JSON.parse(localStorage.getItem(perfilKey) || '{}');
        setPerfil({ nombre: p.nombre || nombreLimpieza, foto: p.foto || '' });
      }
      catch { }
    };
    const actualizar = (e: Event) => {
      const d = (e as CustomEvent).detail;
      if (d?.role?.toLowerCase().includes('limpieza') && d.nombre && (!empleadoLimpieza?.correo || d.email === empleadoLimpieza.correo))
        setPerfil({ nombre: d.nombre, foto: d.foto || '' });
    };
    cargar();
    window.addEventListener('vs-profile-updated', actualizar);
    return () => window.removeEventListener('vs-profile-updated', actualizar);
  },
    [perfilKey]);
  const iniciales = perfil.nombre.split(/\s+/).filter(Boolean).map(x => x[0]).slice(0, 2).join('').toUpperCase();
  return (<nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-56 h-[100dvh]" style={{ backgroundColor: '#102747' }}>

    <div className="px-5 pt-6 pb-5 border-b shrink-0 text-center" style={{ borderColor: '#1d3a5f' }}>
      <img src="/villa-serena-logo.png" alt="Villa Serena" className="mx-auto h-24 w-32 object-contain mb-3" />
      <p className="text-white text-xl font-bold leading-tight" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif', letterSpacing: '0.02em' }}>
        Villa Serena
      </p>
      <p className="text-xs mt-1" style={{ color: '#AEBCC1', letterSpacing: '0.06em' }}>
        Módulo de Limpieza
      </p>
    </div>

    <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
      {PANTALLAS.map(id => {
        const active = pantalla === id;
        const badge = id === 'solicitudes' ? solPendientes : id === 'incidencias' ? incPendientes : 0;
        return (<button
          key={id}
          onClick={() => setPantalla(id)}
          className="w-full flex items-center gap-3 px-5 py-3 text-left transition-colors relative group"
          style={{
            color: active ? '#FFFFFF' : '#AEBCC1',
            backgroundColor: active ? '#18345C' : 'transparent',
          }}>
          {active && <span className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: '#D8B94E' }} />}
          <span className="w-5 h-5 shrink-0 grid place-items-center" style={{ color: active ? '#D8B94E' : '#AEBCC1' }} aria-hidden="true">
            {ICONS[id]()}
          </span>
          <span className="text-sm font-medium flex-1">
            {NAV_LABELS_SIDEBAR[id]}
          </span>
          {badge > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center" style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
            {badge}
          </span>)}
        </button>);
      })}
    </div>

    <div className="px-4 py-4 border-t shrink-0" style={{ borderColor: '#1d3a5f' }}>
      <button
        onClick={onEditarPerfil}
        className="w-full flex items-center gap-3 rounded-lg p-2 text-left hover:bg-[#18345C] transition-colors"
        title="Abrir mi perfil">
        {perfil.foto ? <img src={perfil.foto} alt={perfil.nombre} className="h-9 w-9 shrink-0 rounded-full object-cover" /> : <div
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
          style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
          {iniciales}
        </div>}
        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-semibold truncate">
            {perfil.nombre}
          </p>
          <p className="text-[10px] truncate" style={{ color: '#AEBCC1' }}>Limpieza · turno {empleadoLimpieza?.turno ?? '—'}</p>
          <p className="text-[9px] mt-0.5" style={{ color: '#D8B94E' }}>Perfil</p>
        </div>
      </button>
    </div>
  </nav>);
}
export default function App() {
  const { user } = useAuth();
  const empleadosActuales = leerEmpleados();
  const empleadoLimpieza = empleadosActuales.find(e => e.id === user?.id && e.activo);
  const nombreLimpieza = empleadoLimpieza?.nombre ?? 'Limpieza';
  const perfilKey = empleadoLimpieza?.correo ? `vs-perfil-personal-${empleadoLimpieza.correo.toLowerCase()}` : '';
  const [modulo, setModulo] = useState<Modulo>('limpieza');
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [pantalla, setPantalla] = useState<Pantalla>('inicio');
  const [habitaciones, setHabitaciones] = useState<Habitacion[]>(() => leerHabitacionesLimpieza());
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);
  const [objetos, setObjetos] = useState<ObjetoOlvidado[]>([]);
  const [historial, setHistorial] = useState<EntradaHistorial[]>([]);
  const [habitacionAbrir, setHabitacionAbrir] = useState<string | null>(null);
  const [solicitudAbrir, setSolicitudAbrir] = useState<string | null>(null);
  const [usuarioActual, setUsuarioActual] = useState(nombreLimpieza);
  useEffect(() => { guardarEstadoLimpieza(habitaciones); }, [habitaciones]);
  useEffect(() => {
    const sincronizarHabitaciones = () => setHabitaciones(leerHabitacionesLimpieza());
    window.addEventListener(HABITACIONES_EVENT, sincronizarHabitaciones);
    return () => window.removeEventListener(HABITACIONES_EVENT, sincronizarHabitaciones);
  },
    []);
  useEffect(() => {
    const cargarPerfil = () => {
      try {
        const perfil = perfilKey ? JSON.parse(localStorage.getItem(perfilKey) || '{}') : {};
        setUsuarioActual(perfil.nombre || nombreLimpieza);
      }
      catch {
        setUsuarioActual(nombreLimpieza);
      }
    };
    cargarPerfil();
    const actualizar = (e: Event) => {
      const detalle = (e as CustomEvent).detail;
      if (detalle?.role?.toLowerCase().includes('limpieza') && detalle.nombre && (!empleadoLimpieza?.correo || detalle.email === empleadoLimpieza.correo))
        setUsuarioActual(detalle.nombre);
    };
    window.addEventListener('vs-profile-updated', actualizar);
    return () => window.removeEventListener('vs-profile-updated', actualizar);
  },
    [perfilKey, nombreLimpieza, empleadoLimpieza?.correo]);
  useEffect(() => {
    const incorporar = () => {
      const automaticas = leerTareasLimpiezaSalida();
      if (!automaticas.length)
        return;
      setSolicitudes(actuales => [...automaticas, ...actuales.filter(a => !automaticas.some(s => s.id === a.id))]);
      setHabitaciones(actuales => actuales.map(h => automaticas.some(s => s.habitacionNumero === h.numero && s.estado !== 'finalizada') ? { ...h, estado: 'pendiente' as EstadoHabitacion } : h));
    };
    incorporar();
    const evento = () => incorporar();
    const almacenamiento = (e: StorageEvent) => {
      if (e.key === CLAVE_TAREAS_SALIDA)
        incorporar();
    };
    window.addEventListener('vs-limpieza-salida', evento);
    window.addEventListener('storage', almacenamiento);
    return () => {
      window.removeEventListener('vs-limpieza-salida', evento);
      window.removeEventListener('storage', almacenamiento);
    };
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
  function agregarHistorial(e: Omit<EntradaHistorial, 'id'>) {
    setHistorial(h => [{ id: generarId(), ...e }, ...h]);
  }
  function comenzarLimpieza(id: string) {
    setHabitaciones(hs => hs.map(h => h.id === id ? { ...h, estado: 'en-limpieza' as EstadoHabitacion } : h));
    const hab = habitaciones.find(h => h.id === id);
    if (hab) {
      guardarHabitaciones(leerHabitaciones().map(h => h.numero === hab.numero ? { ...h, estado: 'en-limpieza' as const } : h));
      agregarHistorial({ habitacionNumero: hab.numero, tipo: 'Limpieza iniciada', fechaHora: horaActual(), estado: 'En limpieza', responsable: usuarioActual });
    }
  }
  function finalizarLimpieza(id: string) {
    const hora = horaActual();
    const hab = habitaciones.find(h => h.id === id);
    setHabitaciones(hs => hs.map(h => h.id === id
      ? {
        ...h,
        estado: 'limpia' as EstadoHabitacion,
        finalizadaEn: hora,
        tareas: h.tareas.map(t => ({ ...t, completada: true })),
      }
      : h));
    if (hab) {
      setSolicitudes(ss => ss.map(s => {
        if (s.tipo !== 'limpieza' || s.habitacionNumero !== hab.numero || (s.estado !== 'pendiente' && s.estado !== 'en-limpieza'))
          return s;
        const actualizada = { ...s, estado: 'finalizada' as const, horaEntrega: hora };
        actualizarTareaLimpiezaSalida(actualizada);
        return actualizada;
      }));
      const habitacionCentral = leerHabitaciones().find(h => h.numero === hab.numero);
      if (habitacionCentral) {
        const estanciaActiva = leerReservas().some(r => r.habitacionId === habitacionCentral.id && r.estado === 'en-curso');
        guardarHabitaciones(leerHabitaciones().map(h => h.id === habitacionCentral.id ? { ...h, estado: estanciaActiva ? 'ocupada' as const : 'disponible' as const } : h));
      }
      agregarHistorial({
        habitacionNumero: hab.numero,
        tipo: 'Limpieza completa',
        fechaHora: hora,
        estado: 'Limpia',
        responsable: usuarioActual,
      });
    }
  }
  function actualizarEstado(id: string, estado: EstadoHabitacion) {
    setHabitaciones(hs => hs.map(h => h.id === id ? { ...h, estado } : h));
  }
  function toggleTarea(habId: string,
    tareaId: string) {
    setHabitaciones(hs => hs.map(h => h.id !== habId ? h :
      { ...h, tareas: h.tareas.map(t => t.id === tareaId ? { ...t, completada: !t.completada } : t) }));
  }
  function guardarObservaciones(id: string, obs: string) {
    setHabitaciones(hs => hs.map(h => h.id === id ? { ...h, observaciones: obs } : h));
  }
  function abrirHabitacionDesdeInicio(id: string,
    iniciar: boolean) {
    const hab = habitaciones.find(h => h.id === id);
    if (!hab)
      return;
    if (iniciar && hab.estado === 'pendiente') {
      comenzarLimpieza(id);
    }
    setHabitacionAbrir(hab.numero);
  }
  function iniciarSolicitudLimpieza(id: string) {
    setSolicitudes(ss => ss.map(s => {
      if (s.id !== id)
        return s;
      const actualizada = { ...s, estado: 'en-limpieza' as const };
      actualizarTareaLimpiezaSalida(actualizada);
      return actualizada;
    }));
    const sol = solicitudes.find(s => s.id === id);
    if (sol)
      agregarHistorial({ habitacionNumero: sol.habitacionNumero, tipo: 'Limpieza iniciada (solicitud)', fechaHora: horaActual(), estado: 'En limpieza', responsable: usuarioActual });
  }
  function finalizarSolicitudLimpieza(id: string) {
    const hora = horaActual();
    setSolicitudes(ss => ss.map(s => {
      if (s.id !== id)
        return s;
      const actualizada = { ...s, estado: 'finalizada' as const, horaEntrega: hora };
      actualizarTareaLimpiezaSalida(actualizada);
      return actualizada;
    }));
    const sol = solicitudes.find(s => s.id === id);
    if (sol)
      agregarHistorial({ habitacionNumero: sol.habitacionNumero, tipo: 'Limpieza finalizada (solicitud)', fechaHora: hora, estado: 'Finalizada', responsable: usuarioActual });
  }
  function abrirLimpiezaDesdeSolicitud(solicitudId: string,
    habitacionNumero: string) {
    const sol = solicitudes.find(s => s.id === solicitudId);
    const hab = habitaciones.find(h => h.numero === habitacionNumero);
    if (sol?.estado === 'pendiente') {
      setSolicitudes(ss => ss.map(s => {
        if (s.id !== solicitudId)
          return s;
        const actualizada = { ...s, estado: 'en-limpieza' as const };
        actualizarTareaLimpiezaSalida(actualizada);
        return actualizada;
      }));
      if (hab && hab.estado === 'pendiente') {
        setHabitaciones(hs => hs.map(h => h.id === hab.id
          ? { ...h, estado: 'en-limpieza' as EstadoHabitacion }
          : h));
        agregarHistorial({
          habitacionNumero,
          tipo: 'Limpieza iniciada (solicitud)',
          fechaHora: horaActual(),
          estado: 'En limpieza',
          responsable: usuarioActual,
        });
      }
    }
    setHabitacionAbrir(habitacionNumero);
  }
  function atenderArticulo(id: string) {
    setSolicitudes(ss => ss.map(s => s.id === id ? { ...s, estado: 'en-proceso' } : s));
    const sol = solicitudes.find(s => s.id === id);
    if (sol)
      agregarHistorial({ habitacionNumero: sol.habitacionNumero, tipo: 'Artículo en proceso', fechaHora: horaActual(), estado: 'En proceso', responsable: usuarioActual });
  }
  function confirmarEntregaArticulo(id: string) {
    const hora = horaActual();
    setSolicitudes(ss => ss.map(s => s.id === id ? { ...s, estado: 'entregado', horaEntrega: hora } : s));
    const sol = solicitudes.find(s => s.id === id);
    if (sol)
      agregarHistorial({ habitacionNumero: sol.habitacionNumero, tipo: 'Artículo entregado', fechaHora: hora, estado: 'Entregado', responsable: usuarioActual });
  }
  function registrarIncidencia(inc: Incidencia) {
    setIncidencias(is => [inc, ...is]);
    reportarIncidenciaMantenimiento({ ...inc, area: 'Limpieza' });
    if (inc.impideUso) {
      setHabitaciones(hs => hs.map(h => h.numero === inc.habitacionNumero ? { ...h, estado: 'fuera-servicio' as EstadoHabitacion } : h));
    }
    agregarHistorial({ habitacionNumero: inc.habitacionNumero, tipo: 'Incidencia reportada', fechaHora: inc.hora, estado: 'Pendiente', responsable: usuarioActual });
  }
  function registrarObjeto(obj: ObjetoOlvidado) {
    const compartido: ObjetoOlvidado = { ...obj, origen: 'limpieza' };
    setObjetos(os => [compartido, ...os.filter(o => o.id !== compartido.id)]);
    registrarObjetoOlvidado(compartido);
    agregarHistorial({ habitacionNumero: obj.habitacionNumero, tipo: 'Objeto registrado', fechaHora: obj.fechaHora, estado: 'Guardado', responsable: usuarioActual });
  }
  const solPendientes = solicitudes.filter(s => s.estado === 'pendiente').length;
  const incPendientes = incidencias.filter(i => i.estado === 'pendiente').length;
  const screenContent = (() => {
    switch (pantalla) {
      case 'inicio':
        return (<Inicio
          habitaciones={habitaciones}
          solicitudes={solicitudes}
          historial={historial}
          onIrMapa={() => setPantalla('mapa')}
          onIrSolicitudes={() => setPantalla('solicitudes')}
          onVerSolicitud={(id) => {
            setSolicitudAbrir(id);
            setPantalla('solicitudes');
          }}
          onComenzarLimpieza={comenzarLimpieza}
          onAbrirHabitacion={abrirHabitacionDesdeInicio}
          usuarioActual={usuarioActual} />);
      case 'mapa':
        return (<Mapa
          habitaciones={habitaciones}
          solicitudes={solicitudes}
          onComenzarLimpieza={comenzarLimpieza}
          onFinalizarLimpieza={finalizarLimpieza}
          onActualizarEstado={actualizarEstado}
          onToggleTarea={toggleTarea}
          onGuardarObservaciones={guardarObservaciones}
          onIrIncidencias={() => setPantalla('incidencias')} />);
      case 'solicitudes':
        return (<Solicitudes
          solicitudes={solicitudes}
          habitaciones={habitaciones}
          solicitudInicialId={solicitudAbrir}
          onCerrarDetalle={() => setSolicitudAbrir(null)}
          onAtenderArticulo={atenderArticulo}
          onConfirmarEntrega={confirmarEntregaArticulo}
          onAbrirLimpieza={abrirLimpiezaDesdeSolicitud} />);
      case 'incidencias': return <Incidencias incidencias={incidencias} habitaciones={habitaciones} onRegistrar={registrarIncidencia} />;
      case 'objetos': return <Objetos objetos={objetos} habitaciones={habitaciones} onRegistrar={registrarObjeto} />;
      case 'historial': return <Historial historial={historial} habitaciones={habitaciones} usuarioActual={usuarioActual} />;
    }
  })();
  if (modulo === 'roomservice') {
    return <RoomServiceApp onCambiarModulo={setModulo} />;
  }
  if (modulo === 'recepcion') {
    return <RecepcionApp onCambiarModulo={setModulo} />;
  }
  if (modulo === 'admin') {
    return <AdminApp onCambiarModulo={setModulo} />;
  }
  if (modulo === 'mantenimiento') {
    return <MantenimientoApp onCambiarModulo={setModulo} />;
  }
  if (modulo === 'huesped') {
    return <HuespedApp onCambiarModulo={setModulo} />;
  }
  return (<div className="w-full h-screen flex flex-col overflow-hidden" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="flex-1 flex overflow-hidden">

      <Sidebar
        pantalla={pantalla}
        setPantalla={(p) => {
          setHabitacionAbrir(null);
          setPantalla(p);
        }}
        solPendientes={solPendientes}
        incPendientes={incPendientes}
        onCambiarModulo={setModulo}
        onEditarPerfil={() => setPerfilAbierto(true)} />

      <div className="flex-1 lg:ml-56 flex flex-col overflow-hidden">

        <div className="lg:hidden flex items-center gap-3 px-4 py-3 shrink-0" style={{ backgroundColor: '#102747' }}>
          <p className="text-white text-lg font-bold" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
            Villa Serena
          </p>
          <span className="text-[#AEBCC1] text-xs">·</span>
          <p className="text-[#AEBCC1] text-xs font-medium truncate flex-1">
            {NAV_LABELS_SIDEBAR[pantalla]}
          </p>
          <div className="flex gap-1.5 shrink-0">
            <ModuloSwitcher actual="limpieza" onCambiar={setModulo} variant="inline" />
          </div>
          {(solPendientes + incPendientes) > 0 && (<span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
            {solPendientes + incPendientes}
          </span>)}
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {screenContent}

          {(pantalla === 'solicitudes' || pantalla === 'inicio') && habitacionAbrir && (<Mapa
            habitaciones={habitaciones}
            solicitudes={solicitudes}
            onComenzarLimpieza={comenzarLimpieza}
            onFinalizarLimpieza={finalizarLimpieza}
            onActualizarEstado={actualizarEstado}
            onToggleTarea={toggleTarea}
            onGuardarObservaciones={guardarObservaciones}
            onIrIncidencias={() => {
              setHabitacionAbrir(null);
              setPantalla('incidencias');
            }}
            habitacionInicialNumero={habitacionAbrir}
            onHabitacionInicialProcesada={() => { }}
            soloDetalle
            onCerrarSoloDetalle={() => setHabitacionAbrir(null)} />)}
        </div>

        <div className="lg:hidden flex shrink-0 border-t" style={{ backgroundColor: '#102747', borderColor: '#1d3a5f' }}>
          {PANTALLAS.map(id => {
            const active = pantalla === id;
            const badge = id === 'solicitudes' ? solPendientes : id === 'incidencias' ? incPendientes : 0;
            return (<button
              key={id}
              type="button"
              onClick={() => {
                setHabitacionAbrir(null);
                setPantalla(id);
              }}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors min-w-0"
              style={{ color: active ? '#D8B94E' : '#AEBCC1' }}>
              {active && (<span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5" style={{ backgroundColor: '#D8B94E' }} />)}
              <span className="relative">
                {ICONS[id](20)}
                {badge > 0 && (<span
                  className="absolute -top-1 -right-2 text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
                  {badge}
                </span>)}
              </span>
              <span className="text-[9px] font-medium leading-tight truncate max-w-full px-0.5">
                {NAV_LABELS[id]}
              </span>
            </button>);
          })}
        </div>
      </div>
    </div>
    <StaffProfileModal
      open={perfilAbierto}
      onClose={() => setPerfilAbierto(false)}
      name={usuarioActual}
      role={`Limpieza · turno ${empleadoLimpieza?.turno?.toLowerCase() || ''}`}
      email={empleadoLimpieza?.correo || ''} />
  </div>);
}
