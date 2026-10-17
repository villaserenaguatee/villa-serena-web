import { useEffect, useMemo, useState } from 'react';
import type { Modulo, SeccionMant, OrdenTrabajo, Incidencia, Activo, ActivoHotel, TareaPreventiva, Repuesto, HabitacionHotel, Empleado, EstadoOT, TipoAveria, PrioridadIncidencia, } from '@/lib/pms/types';
import { siguienteCodigoOT, generarId, ahoraISO, fechaHoyISO, fechaRelativaISO, } from '@/data/pms';
import { SIGUIENTE_ESTADO_OT, estaAtrasada, validarCambioEstadoHab, } from '@/features/mantenimiento/pages/mantUtils';
import ModuloSwitcher from '@/components/common/ModuloSwitcher';
import StaffProfileModal from '@/components/common/StaffProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { EMPLEADOS_EVENT, leerEmpleados } from '@/store/employeeStore';
import { guardarHabitaciones, leerHabitaciones, HABITACIONES_EVENT } from '@/store/roomStore';
import PanelMantenimiento from '@/features/mantenimiento/pages/PanelMantenimiento';
import BandejaIncidencias from '@/features/mantenimiento/pages/BandejaIncidencias';
import OrdenesTrabajo from '@/features/mantenimiento/pages/OrdenesTrabajo';
import DetalleOrden from '@/features/mantenimiento/pages/DetalleOrden';
import NuevaOrdenModal from '@/features/mantenimiento/pages/NuevaOrdenModal';
import Preventivo from '@/features/mantenimiento/pages/Preventivo';
import Activos from '@/features/mantenimiento/pages/Activos';
import { guardarIncidenciasMantenimiento, leerIncidenciasMantenimiento } from '@/store/maintenanceEvents';
import { ADMIN_OPERATIONS_EVENT, leerActivosAdmin, guardarActivosAdmin } from '@/store/adminOperationsStore';
import { leerReservas, RESERVAS_EVENT } from '@/store/reservationStore';
const SECCIONES: {
  id: SeccionMant;
  label: string;
  corto: string;
}[] = [
    { id: 'panel', label: 'Panel del área', corto: 'Panel' },
    { id: 'incidencias', label: 'Incidencias recibidas', corto: 'Incid.' },
    { id: 'ordenes', label: 'Tareas de mantenimiento', corto: 'Tareas' },
    { id: 'preventivo', label: 'Mantenimiento preventivo', corto: 'Prevent.' },
    { id: 'activos', label: 'Activos y equipos', corto: 'Activos' },
  ];
function SeccionIcon({ id, size = 18 }: {
  id: SeccionMant;
  size?: number;
}) {
  const p = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  switch (id) {
    case 'panel':
      return <svg {...p}>
        <path d="M3 3v18h18" />
        <rect x="7" y="12" width="3" height="6" />
        <rect x="12" y="8" width="3" height="10" />
        <rect x="17" y="4" width="3" height="14" />
      </svg>;
    case 'incidencias':
      return <svg {...p}>
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>;
    case 'ordenes':
      return <svg {...p}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76Z" />
      </svg>;
    case 'preventivo':
      return <svg {...p}>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>;
    case 'activos':
      return <svg {...p}>
        <path d="M20 7 12 3 4 7l8 4 8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>;
  }
}
interface Props {
  onCambiarModulo: (m: Modulo) => void;
}
export default function MantenimientoApp({ onCambiarModulo }: Props) {
  const { user } = useAuth();
  const [empleados, setEmpleados] = useState(() => leerEmpleados());
  useEffect(() => {
    const sincronizar = () => setEmpleados(leerEmpleados());
    window.addEventListener(EMPLEADOS_EVENT, sincronizar);
    window.addEventListener('storage', sincronizar);
    return () => {
      window.removeEventListener(EMPLEADOS_EVENT, sincronizar);
      window.removeEventListener('storage', sincronizar);
    };
  },
    []);
  const personalMantenimiento = empleados.filter(e => e.rol === 'Mantenimiento' && e.activo);
  const empleadoActual = empleados.find(e => e.id === user?.id && e.activo);
  const encargadoMantenimiento = empleadoActual?.nombre ?? 'Mantenimiento';
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [seccion, setSeccion] = useState<SeccionMant>('panel');
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>(() => {
    try {
      const raw = localStorage.getItem('vs-ordenes-mantenimiento');
      return raw ? JSON.parse(raw) : [];
    }
    catch {
      return [];
    }
  });
  const [incidencias, setIncidencias] = useState<Incidencia[]>(() => leerIncidenciasMantenimiento());
  useEffect(() => { guardarIncidenciasMantenimiento(incidencias); }, [incidencias]);
  const [habitaciones, setHabitaciones] = useState<HabitacionHotel[]>(() => leerHabitaciones());
  useEffect(() => guardarHabitaciones(habitaciones), [habitaciones]);
  useEffect(() => {
    const sync = () => setHabitaciones(actuales => {
      const next = leerHabitaciones();
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
  const convertirActivosAdmin = (items: ReturnType<typeof leerActivosAdmin>): Activo[] => items.filter(a => a.vinculadoMantenimiento).map(a => ({
    id: a.id,
    nombre: a.nombre,
    categoria: a.categoria as Activo['categoria'],
    ubicacion: a.ubicacion,
    marcaModelo: a.nombre,
    codigo: a.codigo,
    costo: a.costo,
    instaladoEn: a.fechaCompra,
    estado: a.estado === 'en reparación' ? 'en-reparacion' : a.estado === 'fuera de servicio' ? 'fuera-servicio' : 'operativo',
  }));
  const [activos, setActivos] = useState<Activo[]>(() => convertirActivosAdmin(leerActivosAdmin()));
  useEffect(() => {
    const sync = () => setActivos(convertirActivosAdmin(leerActivosAdmin()));
    window.addEventListener(ADMIN_OPERATIONS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(ADMIN_OPERATIONS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  },
    []);
  useEffect(() => {
    const actuales = leerActivosAdmin();
    const porId = new Map<string, Activo>(activos.map(a => [a.id, a]));
    const next: ReturnType<typeof leerActivosAdmin> = actuales.map(a => {
      const m = porId.get(a.id);
      if (!m)
        return a;
      const estado: ActivoHotel['estado'] = m.estado === 'en-reparacion' ? 'en reparación' : m.estado === 'fuera-servicio' ? 'fuera de servicio' : 'operativo';
      return { ...a, estado };
    });
    if (JSON.stringify(next) !== JSON.stringify(actuales))
      guardarActivosAdmin(next);
  },
    [activos]);
  const [tareas, setTareas] = useState<TareaPreventiva[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vs-tareas-preventivas');
      if (raw)
        setTareas(JSON.parse(raw));
    }
    catch { }
  }, []);
  const [repuestos, setRepuestos] = useState<Repuesto[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem('vs-repuestos-mantenimiento');
      if (raw)
        setRepuestos(JSON.parse(raw));
    }
    catch { }
  }, []);
  const [reservas, setReservas] = useState(() => leerReservas());
  useEffect(() => {
    const sync = () => setReservas(leerReservas());
    window.addEventListener(RESERVAS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(RESERVAS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  },
    []);
  useEffect(() => {
    try {
      localStorage.setItem('vs-ordenes-mantenimiento', JSON.stringify(ordenes));
    }
    catch { }
  }, [ordenes]);
  const [ordenAbiertaId, setOrdenAbiertaId] = useState<string | null>(null);
  const [nuevaOrden, setNuevaOrden] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const tecnicos: Empleado[] = useMemo(() => personalMantenimiento, [empleados]);
  const ordenAbierta = ordenes.find(o => o.id === ordenAbiertaId) ?? null;
  const incidenciasSinOrden = incidencias.filter(i => i.estado === 'pendiente' && !ordenes.some(o => o.incidenciaId === i.id));
  const ordenesAtrasadas = ordenes.filter(estaAtrasada);
  function mostrarAviso(texto: string) {
    setAviso(texto);
    window.setTimeout(() => setAviso(a => (a === texto ? null : a)), 4000);
  }
  function registrarCambio(o: OrdenTrabajo,
    estado: EstadoOT,
    nota?: string): OrdenTrabajo {
    return {
      ...o,
      estado,
      historial: [...o.historial, { estado, fechaHora: ahoraISO(), responsable: encargadoMantenimiento, nota }],
    };
  }
  function bloquearHabitacion(numero: string) {
    setHabitaciones(hs => hs.map(h => (h.numero === numero && h.estado !== 'ocupada' ? { ...h, estado: 'mantenimiento' } : h)));
  }
  function liberarHabitacion(numero: string) {
    const hab = habitaciones.find(h => h.numero === numero);
    if (!hab)
      return;
    const bloqueada = ordenes.some(o => o.esHabitacion && o.ubicacion === numero && o.impideUso && !['resuelta', 'cerrada', 'cancelada'].includes(o.estado));
    if (bloqueada) {
      mostrarAviso(`La habitación ${numero} aún tiene un trabajo pendiente que impide su uso.`);
      return;
    }
    const error = validarCambioEstadoHab(hab, 'en-limpieza', reservas);
    if (error) {
      mostrarAviso(error);
      return;
    }
    const resueltas = ordenes.filter(o => o.esHabitacion && o.ubicacion === numero && o.estado === 'resuelta');
    setOrdenes(os => os.map(o => resueltas.some(r => r.id === o.id) ? registrarCambio({ ...o, cerradaEn: ahoraISO() }, 'cerrada') : o));
    const incidenciasResueltas = resueltas.map(o => o.incidenciaId).filter(Boolean);
    if (incidenciasResueltas.length)
      setIncidencias(is => is.map(i => incidenciasResueltas.includes(i.id) ? { ...i, estado: 'resuelta' } : i));
    setHabitaciones(hs => hs.map(h => (h.numero === numero ? { ...h, estado: 'en-limpieza' } : h)));
    mostrarAviso(`Habitación ${numero} liberada. Queda en limpieza para su validación.`);
  }
  function nuevaOT(datos: {
    ubicacion: string;
    esHabitacion: boolean;
    tipo: TipoAveria;
    descripcion: string;
    prioridad: PrioridadIncidencia;
    impideUso: boolean;
    origen: OrdenTrabajo['origen'];
    incidenciaId?: string;
    tareaPreventivaId?: string;
    activoId?: string;
    area?: OrdenTrabajo['area'];
    diasCompromiso: number;
  }): OrdenTrabajo {
    const codigo = siguienteCodigoOT();
    return {
      id: generarId(),
      codigo,
      ubicacion: datos.ubicacion,
      esHabitacion: datos.esHabitacion,
      tipo: datos.tipo,
      descripcion: datos.descripcion,
      prioridad: datos.prioridad,
      origen: datos.origen,
      incidenciaId: datos.incidenciaId,
      tareaPreventivaId: datos.tareaPreventivaId,
      activoId: datos.activoId,
      impideUso: datos.impideUso,
      area: datos.area,
      estado: 'abierta',
      tecnicoId: null,
      fechaCompromiso: fechaRelativaISO(datos.diasCompromiso),
      repuestos: [],
      creadaEn: ahoraISO(),
      historial: [{ estado: 'abierta', fechaHora: ahoraISO(), responsable: encargadoMantenimiento }],
    };
  }
  function generarDesdeIncidencia(incidenciaId: string,
    prioridad: PrioridadIncidencia,
    descripcion: string) {
    const inc = incidencias.find(i => i.id === incidenciaId);
    if (!inc)
      return;
    const esHab = /^\d+$/.test(inc.habitacionNumero);
    const orden = nuevaOT({
      ubicacion: inc.habitacionNumero,
      esHabitacion: esHab,
      tipo: (inc.tipo as TipoAveria) ?? 'Otro',
      descripcion,
      prioridad,
      impideUso: inc.impideUso,
      origen: 'incidencia',
      incidenciaId,
      area: inc.area,
      diasCompromiso: prioridad === 'alta' ? 0 : prioridad === 'media' ? 1 : 3,
    });
    const registrada: OrdenTrabajo = { ...orden, tecnicoId: tecnicos[0]?.id ?? null };
    setOrdenes(os => [registrada, ...os]);
    setIncidencias(is => is.map(i => (i.id === incidenciaId ? { ...i, estado: 'en-proceso' } : i)));
    if (esHab && inc.impideUso)
      bloquearHabitacion(inc.habitacionNumero);
    setOrdenAbiertaId(registrada.id);
    mostrarAviso('Incidencia atendida');
  }
  function crearOrdenInterna(datos: {
    ubicacion: string;
    esHabitacion: boolean;
    tipo: TipoAveria;
    descripcion: string;
    prioridad: PrioridadIncidencia;
    impideUso: boolean;
    activoId?: string;
  }) {
    const orden = nuevaOT({
      ...datos,
      origen: 'interna',
      diasCompromiso: datos.prioridad === 'alta' ? 0 : datos.prioridad === 'media' ? 1 : 3,
    });
    setOrdenes(os => [orden, ...os]);
    if (datos.esHabitacion && datos.impideUso)
      bloquearHabitacion(datos.ubicacion);
    setNuevaOrden(false);
    setSeccion('ordenes');
    mostrarAviso(`Trabajo ${orden.codigo} registrado.`);
  }
  function generarDesdePreventivo(tareaId: string) {
    const t = tareas.find(x => x.id === tareaId);
    if (!t)
      return;
    const orden = nuevaOT({
      ubicacion: t.ubicacion,
      esHabitacion: false,
      tipo: 'Avería técnica',
      descripcion: t.nombre,
      prioridad: 'media',
      impideUso: false,
      origen: 'preventivo',
      tareaPreventivaId: t.id,
      activoId: t.activoId ?? undefined,
      diasCompromiso: 2,
    });
    setOrdenes(os => [orden, ...os]);
    setTareas(ts => ts.map(x => (x.id === tareaId ? { ...x, ultimaEjecucion: fechaHoyISO() } : x)));
    mostrarAviso('Mantenimiento programado correctamente.');
  }
  function asignarTecnico(ordenId: string,
    tecnicoId: string) {
    const tecnico = tecnicos.find(t => t.id === tecnicoId);
    setOrdenes(os => os.map(o => {
      if (o.id !== ordenId)
        return o;
      const base = { ...o, tecnicoId };
      return o.estado === 'abierta'
        ? registrarCambio(base, 'asignada', `Asignada a ${tecnico?.nombre ?? ''}`)
        : {
          ...base,
          historial: [
            ...o.historial,
            { estado: o.estado, fechaHora: ahoraISO(), responsable: encargadoMantenimiento, nota: `Reasignada a ${tecnico?.nombre ?? ''}` },
          ],
        };
    }));
    mostrarAviso(`Orden asignada a ${tecnico?.nombre ?? 'el técnico'}.`);
  }
  function avanzarEstado(ordenId: string,
    extra?: {
      solucion?: string;
      minutos?: number;
    }) {
    const orden = ordenes.find(o => o.id === ordenId);
    if (!orden)
      return;
    const siguiente = SIGUIENTE_ESTADO_OT[orden.estado];
    if (!siguiente)
      return;
    setOrdenes(os => os.map(o => {
      if (o.id !== ordenId)
        return o;
      const conDatos: OrdenTrabajo = {
        ...o,
        solucion: extra?.solucion ?? o.solucion,
        minutosEmpleados: extra?.minutos ?? o.minutosEmpleados,
        cerradaEn: siguiente === 'cerrada' ? ahoraISO() : o.cerradaEn,
      };
      return registrarCambio(conDatos, siguiente);
    }));
    if (siguiente === 'cerrada' && orden.incidenciaId) {
      setIncidencias(is => is.map(i => (i.id === orden.incidenciaId ? { ...i, estado: 'resuelta' } : i)));
    }
    mostrarAviso(`Trabajo ${orden.codigo}: ${siguiente === 'cerrada' ? 'finalizado' : siguiente.replace('-', ' ')}.`);
  }
  function cancelarOrden(ordenId: string,
    motivo: string) {
    const orden = ordenes.find(o => o.id === ordenId);
    setOrdenes(os => os.map(o => (o.id === ordenId ? registrarCambio({ ...o, motivoCancelacion: motivo }, 'cancelada', motivo) : o)));
    if (orden?.incidenciaId) {
      setIncidencias(is => is.map(i => (i.id === orden.incidenciaId ? { ...i, estado: 'pendiente' } : i)));
    }
    setOrdenAbiertaId(null);
    mostrarAviso(`Trabajo ${orden?.codigo ?? ''} cancelado.`);
  }
  function reprogramar(ordenId: string,
    fecha: string,
    motivo: string) {
    setOrdenes(os => os.map(o => o.id === ordenId
      ? {
        ...o,
        fechaCompromiso: fecha,
        historial: [
          ...o.historial,
          { estado: o.estado, fechaHora: ahoraISO(), responsable: encargadoMantenimiento, nota: `Reprogramada: ${motivo}` },
        ],
      }
      : o));
    mostrarAviso('Trabajo reprogramado.');
  }
  function agregarRepuesto(ordenId: string,
    repuestoId: string,
    cantidad: number,
    personalizado?: {
      nombre: string;
      costoUnitario: number;
    }) {
    const r = repuestos.find(x => x.id === repuestoId);
    if (!r && !personalizado)
      return;
    setOrdenes(os => os.map(o => o.id === ordenId
      ? {
        ...o,
        repuestos: [
          ...o.repuestos,
          {
            repuestoId: r?.id ?? `manual-${generarId()}`,
            nombre: r?.nombre ?? personalizado!.nombre,
            cantidad,
            costoUnitario: r?.costoUnitario ?? personalizado!.costoUnitario
          },
        ],
      }
      : o));
  }
  function quitarRepuesto(ordenId: string, indice: number) {
    setOrdenes(os => os.map(o => (o.id === ordenId ? { ...o, repuestos: o.repuestos.filter((_, i) => i !== indice) } : o)));
  }
  function toggleTarea(id: string) {
    setTareas(ts => ts.map(t => (t.id === id ? { ...t, activa: !t.activa } : t)));
  }
  function agregarActivo(datos: Omit<Activo, 'id'>) {
    const nuevo: Activo = { ...datos, id: `ACT-${Date.now()}` };
    const actuales = leerActivosAdmin();
    guardarActivosAdmin([...actuales,
    {
      id: nuevo.id,
      codigo: nuevo.codigo || '',
      nombre: nuevo.nombre,
      categoria: nuevo.categoria,
      ubicacion: nuevo.ubicacion,
      fechaCompra: nuevo.instaladoEn,
      costo: nuevo.costo || 0,
      estado: nuevo.estado === 'en-reparacion' ? 'en reparación' : nuevo.estado === 'fuera-servicio' ? 'fuera de servicio' : 'operativo',
      vinculadoMantenimiento: true
    }]);
    setActivos(v => [...v, nuevo]);
  }
  function cambiarEstadoActivo(id: string, estado: Activo['estado']) {
    setActivos(as => as.map(a => (a.id === id ? { ...a, estado } : a)));
  }
  const contenido = (() => {
    switch (seccion) {
      case 'panel':
        return (<PanelMantenimiento
          ordenes={ordenes}
          habitaciones={habitaciones}
          incidencias={incidencias}
          onLiberarHabitacion={liberarHabitacion}
          onAbrirOrden={setOrdenAbiertaId} />);
      case 'incidencias':
        return (<BandejaIncidencias
          incidencias={incidencias}
          ordenes={ordenes}
          habitaciones={habitaciones}
          onGenerarOrden={generarDesdeIncidencia}
          onAbrirOrden={setOrdenAbiertaId} />);
      case 'ordenes':
        return (<OrdenesTrabajo ordenes={ordenes} onAbrirOrden={setOrdenAbiertaId} onNuevaOrden={() => setNuevaOrden(true)} />);
      case 'preventivo':
        return (<Preventivo
          tareas={tareas}
          activos={activos}
          ordenes={ordenes}
          onGenerarOrden={generarDesdePreventivo}
          onToggleActiva={toggleTarea}
          onAgregarTarea={t => setTareas(prev => [t, ...prev])} />);
      case 'activos':
        return (<Activos activos={activos} ordenes={ordenes} onCambiarEstado={cambiarEstadoActivo} onAgregarActivo={agregarActivo} onAbrirOrden={setOrdenAbiertaId} />);
    }
  })();
  return (<div className="w-full h-screen flex flex-col overflow-hidden" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <style>
      {`
        @import url('https://fonts.googleapis.com/css2?family=Afacad:wght@400;500;600;700&display=swap');
      `}
    </style>

    <div className="flex-1 flex overflow-hidden">

      <nav className="hidden lg:flex fixed inset-y-0 left-0 z-40 flex-col w-56 h-[100dvh]" style={{ backgroundColor: '#102747' }}>
        <div className="px-5 pt-5 pb-5 border-b shrink-0 text-center" style={{ borderColor: '#1d3a5f' }}>
          <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="mx-auto mb-2 w-32 max-h-24 object-contain" />
          <p className="text-white text-xl font-bold leading-tight" style={{ letterSpacing: '0.02em' }}>Villa Serena</p>
          <p className="mt-2 text-xl font-semibold leading-6" style={{ color: '#AEBCC1', letterSpacing: '0.06em' }}>Mantenimiento</p>
        </div>

        <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'incidencias' ? incidenciasSinOrden.length : s.id === 'ordenes' ? ordenesAtrasadas.length : 0;
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

        <div className="px-4 py-2 border-t shrink-0" style={{ borderColor: '#1d3a5f' }}>
          <button
            onClick={() => setPerfilAbierto(true)}
            className="w-full min-h-16 flex items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-[#18345C] transition-colors"
            title="Abrir mi perfil">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: '#D8B94E', color: '#102747' }}>RP</div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">
                {encargadoMantenimiento}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#AEBCC1' }}>Encargado de mantenimiento</p>
              <p className="text-[14px] leading-5 no-underline" style={{ color: '#D8B94E' }}>Perfil</p>
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
          <div className="lg:hidden flex gap-1.5">
            <ModuloSwitcher actual="mantenimiento" onCambiar={onCambiarModulo} variant="inline" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {contenido}
        </div>

        <div className="lg:hidden flex shrink-0 border-t overflow-x-auto" style={{ backgroundColor: '#102747', borderColor: '#1d3a5f' }}>
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'incidencias' ? incidenciasSinOrden.length : s.id === 'ordenes' ? ordenesAtrasadas.length : 0;
            return (<button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="flex-1 min-w-[64px] flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors"
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

    {aviso && (<div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md">
      <div className="bg-[#102747] text-white text-[14px] font-medium px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3">
        <span style={{ color: '#D8B94E' }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
        <span className="flex-1">
          {aviso}
        </span>
        <button onClick={() => setAviso(null)} aria-label="Cerrar aviso" className="text-[#AEBCC1] hover:text-white shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>)}

    {ordenAbierta && (<DetalleOrden
      orden={ordenAbierta}
      repuestos={repuestos}
      onCerrar={() => setOrdenAbiertaId(null)}
      onAvanzar={avanzarEstado}
      onCancelar={cancelarOrden}
      onReprogramar={reprogramar}
      onAgregarRepuesto={agregarRepuesto}
      onQuitarRepuesto={quitarRepuesto} />)}

    {nuevaOrden && (<NuevaOrdenModal activos={activos} onCerrar={() => setNuevaOrden(false)} onGuardar={crearOrdenInterna} />)}
    <StaffProfileModal
      open={perfilAbierto}
      onClose={() => setPerfilAbierto(false)}
      name={empleadoActual?.nombre ?? "Mantenimiento"}
      role="Encargado de mantenimiento"
      email={empleadoActual?.correo ?? ""} />
  </div>);
}
