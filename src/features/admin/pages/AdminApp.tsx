import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import StaffProfileModal from '@/components/common/StaffProfileModal';
import { useAuth } from '@/hooks/useAuth';
import { guardarEmpleados, leerEmpleados } from '@/store/employeeStore';
import { guardarCorrecciones, leerCorrecciones, resolverCorreccion } from '@/store/correctionStore';
import { guardarHabitaciones, leerHabitaciones, HABITACIONES_EVENT } from '@/store/roomStore';
import { guardarPromociones, leerPromociones } from '@/store/promotionStore';
import { guardarReservas, leerReservas, RESERVAS_EVENT } from '@/store/reservationStore';
import { leerHuespedes, HUESPEDES_EVENT } from '@/store/guestStore';
import type { Modulo, SeccionAdmin, HabitacionHotel, Reserva, Huesped, EstadoHabHotel, TipoHabitacion, ReglaTarifa, Promocion, Empleado, TurnoPersonal, PermisoModulo, EstadoAsistencia, Insumo, MovimientoInsumo, TipoMovimiento, CompraHotel, GastoHotel, ActivoHotel, } from '@/lib/pms/types';
import { REGLAS_TARIFA_INICIALES, fechaHoyISO, generarId, ahoraISO, } from '@/data/pms';
import { validarCambioEstadoHab } from '@/features/recepcion/pages/recUtils';
import ModuloSwitcher from '@/components/common/ModuloSwitcher';
import PanelHabitaciones from '@/features/admin/pages/PanelHabitaciones';
import Tarifas from '@/features/admin/pages/Tarifas';
import Reportes from '@/features/admin/pages/Reportes';
import Personal from '@/features/admin/pages/Personal';
import ComprasInventario from '@/features/admin/pages/ComprasInventario';
import FinanzasActivos from '@/features/admin/pages/FinanzasActivos';
import { guardarTarifas, leerTarifas } from '@/store/tarifasStore';
import { guardarActivosAdmin, guardarComprasAdmin, guardarGastosAdmin, guardarInsumosAdmin, guardarMovimientosAdmin, leerActivosAdmin, leerComprasAdmin, leerGastosAdmin, leerInsumosAdmin, leerMovimientosAdmin, } from '@/store/adminOperationsStore';
const SECCIONES: {
  id: SeccionAdmin;
  label: string;
  corto: string;
}[] = [
    { id: 'panel', label: 'Panel de habitaciones', corto: 'Panel' },
    { id: 'tarifas', label: 'Tarifas y ofertas', corto: 'Tarifas' },
    { id: 'reportes', label: 'Reportes', corto: 'Reportes' },
    { id: 'personal', label: 'Personal', corto: 'Personal' },
    { id: 'inventario', label: 'Inventario y compras', corto: 'Inventario' },
    { id: 'finanzas', label: 'Finanzas', corto: 'Finanzas' },
  ];
function SeccionIcon({ id, size = 18 }: {
  id: SeccionAdmin;
  size?: number;
}) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75 } as const;
  switch (id) {
    case 'panel':
      return <svg {...p}>
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
      </svg>;
    case 'tarifas':
      return <svg {...p}>
        <path d="M20 12 12 20 4 12V4h8Z" />
        <circle cx="9" cy="9" r="1.25" />
      </svg>;
    case 'reportes':
      return <svg {...p}>
        <path d="M3 3v18h18" />
        <rect x="7" y="12" width="3" height="6" />
        <rect x="12" y="8" width="3" height="10" />
        <rect x="17" y="4" width="3" height="14" />
      </svg>;
    case 'personal':
      return <svg {...p}>
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>;
    case 'inventario':
      return <svg {...p}>
        <path d="M20 7 12 3 4 7l8 4 8-4Z" />
        <path d="M4 7v10l8 4 8-4V7" />
        <path d="M12 11v10" />
      </svg>;
    case 'finanzas':
      return <svg {...p}>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M3 10h18M7 15h4" />
      </svg>;
  }
}
interface Props {
  onCambiarModulo: (m: Modulo) => void;
}
export default function AdminApp({ onCambiarModulo }: Props) {
  const [seccion, setSeccion] = useState<SeccionAdmin>('panel');
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [notificacionesAbiertas, setNotificacionesAbiertas] = useState(false);
  const [correccionesPersonal, setCorreccionesPersonal] = useState<any[]>([]);
  useEffect(() => {
    const cargar = () => setCorreccionesPersonal(leerCorrecciones());
    cargar();
    window.addEventListener('vs-correcciones-personal-updated', cargar);
    return () => window.removeEventListener('vs-correcciones-personal-updated', cargar);
  },
    []);
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
  const [reservas, setReservas] = useState<Reserva[]>(() => leerReservas());
  const [huespedes, setHuespedes] = useState<Huesped[]>(() => leerHuespedes());
  useEffect(() => guardarReservas(reservas), [reservas]);
  useEffect(() => {
    const sync = () => setReservas(actuales => {
      const next = leerReservas();
      return JSON.stringify(actuales) === JSON.stringify(next) ? actuales : next;
    });
    window.addEventListener(RESERVAS_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(RESERVAS_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  },
    []);
  useEffect(() => {
    const sync = () => setHuespedes(leerHuespedes());
    window.addEventListener(HUESPEDES_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(HUESPEDES_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  },
    []);
  const [tarifasBase, setTarifasBase] = useState<Record<TipoHabitacion, number>>(() => leerTarifas());
  const [reglas, setReglas] = useState<ReglaTarifa[]>(REGLAS_TARIFA_INICIALES);
  const [promociones, setPromociones] = useState<Promocion[]>(() => leerPromociones());
  useEffect(() => guardarPromociones(promociones), [promociones]);
  const [empleados, setEmpleados] = useState<Empleado[]>(() => leerEmpleados());
  const { user } = useAuth();
  const adminActual = empleados.find(e => e.id === user?.id && e.activo);
  useEffect(() => guardarEmpleados(empleados), [empleados]);
  const [insumos, setInsumos] = useState<Insumo[]>(() => leerInsumosAdmin());
  const [movimientos, setMovimientos] = useState<MovimientoInsumo[]>(() => leerMovimientosAdmin());
  const [compras, setCompras] = useState<CompraHotel[]>(() => leerComprasAdmin());
  const [gastos, setGastos] = useState<GastoHotel[]>(() => leerGastosAdmin());
  const [activos, setActivos] = useState<ActivoHotel[]>(() => leerActivosAdmin());
  useEffect(() => guardarInsumosAdmin(insumos), [insumos]);
  useEffect(() => guardarMovimientosAdmin(movimientos), [movimientos]);
  useEffect(() => guardarComprasAdmin(compras), [compras]);
  useEffect(() => guardarGastosAdmin(gastos), [gastos]);
  useEffect(() => guardarActivosAdmin(activos), [activos]);
  const ocupacionActualPct = habitaciones.length
    ? Math.round((habitaciones.filter(h => h.estado === 'ocupada').length / habitaciones.length) * 100)
    : 0;
  const hoy = fechaHoyISO();
  const badgePanel = reservas.filter(r => r.fechaEntrada === hoy && (r.estado === 'pendiente' || r.estado === 'confirmada') && !r.habitacionId).length;
  const badgeInventario = insumos.filter(i => i.stock <= i.stockMinimo).length;
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
  function asignarHabitacion(reservaId: string,
    habId: string) {
    const prev = reservas.find(r => r.id === reservaId)?.habitacionId ?? null;
    setReservas(rs => rs.map(r => r.id === reservaId
      ? { ...r, habitacionId: habId, estado: r.estado === 'pendiente' ? 'confirmada' : r.estado }
      : r));
    setHabitaciones(hs => hs.map(h => {
      if (h.id === prev && (h.estado === 'reservada' || h.estado === 'ocupada'))
        return { ...h, estado: 'disponible' };
      if (h.id === habId && h.estado === 'disponible')
        return { ...h, estado: 'reservada' };
      return h;
    }));
  }
  function cambiarTarifaBase(tipo: TipoHabitacion,
    valor: number) {
    setTarifasBase(t => {
      const actualizadas = { ...t, [tipo]: valor };
      guardarTarifas(actualizadas);
      return actualizadas;
    });
  }
  function guardarRegla(r: ReglaTarifa) {
    setReglas(prev => (prev.some(x => x.id === r.id) ? prev.map(x => (x.id === r.id ? r : x)) : [r, ...prev]));
  }
  function toggleRegla(id: string) {
    setReglas(prev => prev.map(r => (r.id === id ? { ...r, activa: !r.activa } : r)));
  }
  function eliminarRegla(id: string) {
    setReglas(prev => prev.filter(r => r.id !== id));
  }
  function guardarPromo(p: Promocion) {
    setPromociones(prev => (prev.some(x => x.id === p.id) ? prev.map(x => (x.id === p.id ? p : x)) : [p, ...prev]));
  }
  function togglePromo(id: string) {
    setPromociones(prev => prev.map(p => (p.id === id ? { ...p, activa: !p.activa } : p)));
  }
  function agregarEmpleado(e: Omit<Empleado, 'id'>) {
    setEmpleados(prev => [{ ...e, id: generarId() }, ...prev]);
  }
  function cambiarAsistencia(id: string, a: EstadoAsistencia) {
    setEmpleados(prev => prev.map(e => (e.id === id ? { ...e, asistencia: a } : e)));
  }
  function toggleActivo(id: string) {
    setEmpleados(prev => prev.map(e => (e.id === id ? { ...e, activo: !e.activo } : e)));
  }
  function cambiarTurno(id: string, turno: TurnoPersonal) {
    setEmpleados(prev => prev.map(e => (e.id === id ? { ...e, turno } : e)));
  }
  function togglePermiso(id: string,
    permiso: PermisoModulo) {
    setEmpleados(prev => prev.map(e => e.id === id
      ? { ...e, permisos: e.permisos.includes(permiso) ? e.permisos.filter(p => p !== permiso) : [...e.permisos, permiso] }
      : e));
  }
  function agregarInsumo(i: Omit<Insumo, 'id'>) {
    setInsumos(prev => [{ ...i, id: generarId() }, ...prev]);
  }
  function registrarMovimiento(insumoId: string,
    tipo: TipoMovimiento,
    cantidad: number,
    motivo: string) {
    setInsumos(prev => prev.map(i => {
      if (i.id !== insumoId)
        return i;
      const delta = tipo === 'entrada' ? cantidad : -cantidad;
      return { ...i, stock: Math.max(0, i.stock + delta) };
    }));
    setMovimientos(prev => [
      { id: generarId(), insumoId, tipo, cantidad, motivo, fecha: ahoraISO() },
      ...prev,
    ]);
  }
  function registrarCompra(c: Omit<CompraHotel, 'id' | 'subtotal' | 'impuesto' | 'total'>) {
    const base = Math.round(c.cantidad * c.costoUnitario * 100) / 100;
    const total = c.ivaIncluido ? base : Math.round(base * 1.12 * 100) / 100;
    const subtotal = c.ivaIncluido ? Math.round((base / 1.12) * 100) / 100 : base;
    const impuesto = Math.round((total - subtotal) * 100) / 100;
    const compra: CompraHotel = { ...c, id: generarId(), subtotal, impuesto, total };
    setCompras(prev => [compra, ...prev]);
    setInsumos(prev => prev.map(i => i.id === c.insumoId ? { ...i, stock: i.stock + c.cantidad, costoUnitario: c.costoUnitario } : i));
    setMovimientos(prev => [{
      id: generarId(),
      insumoId: c.insumoId,
      tipo: 'entrada',
      cantidad: c.cantidad,
      motivo: `Compra a ${c.proveedor}`,
      referencia: c.numeroFactura,
      fecha: ahoraISO()
    },
    ...prev]);
  }
  const contenido = (() => {
    switch (seccion) {
      case 'panel':
        return (<PanelHabitaciones habitaciones={habitaciones} reservas={reservas} huespedes={huespedes} onCambiarEstadoHab={cambiarEstadoHab} />);
      case 'tarifas':
        return (<Tarifas
          tarifasBase={tarifasBase}
          reglas={reglas}
          promociones={promociones}
          ocupacionActualPct={ocupacionActualPct}
          onCambiarTarifaBase={cambiarTarifaBase}
          onGuardarRegla={guardarRegla}
          onToggleRegla={toggleRegla}
          onEliminarRegla={eliminarRegla}
          onGuardarPromo={guardarPromo}
          onTogglePromo={togglePromo} />);
      case 'reportes':
        return <Reportes reservas={reservas} habitaciones={habitaciones} tarifasBase={tarifasBase} />;
      case 'personal':
        return (<Personal
          empleados={empleados}
          onAgregar={agregarEmpleado}
          onCambiarAsistencia={cambiarAsistencia}
          onToggleActivo={toggleActivo}
          onCambiarTurno={cambiarTurno}
          onTogglePermiso={togglePermiso} />);
      case 'inventario':
        return (<ComprasInventario
          insumos={insumos}
          movimientos={movimientos}
          compras={compras}
          onAgregarInsumo={agregarInsumo}
          onRegistrarMovimiento={registrarMovimiento}
          onRegistrarCompra={registrarCompra} />);
      case 'finanzas':
        return <FinanzasActivos
          empleados={empleados}
          reservas={reservas}
          compras={compras}
          gastos={gastos}
          activos={activos}
          onAgregarGasto={g => setGastos(prev => [{ ...g, id: generarId() }, ...prev])}
          onAgregarActivo={a => setActivos(prev => [{ ...a, id: generarId() }, ...prev])} />;
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
          <img src="/villa-serena-logo.png" alt="Villa Serena" className="mx-auto w-32 h-auto object-contain mb-2" />
          <p className="text-white text-xl font-bold leading-tight" style={{ letterSpacing: '0.02em' }}>Villa Serena</p>
          <p className="mt-2 text-xl font-semibold leading-6" style={{ color: '#AEBCC1', letterSpacing: '0.06em' }}>Administración</p>
        </div>

        <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'panel' ? badgePanel : s.id === 'inventario' ? badgeInventario : 0;
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

        <ModuloSwitcher actual="admin" onCambiar={onCambiarModulo} />

        <div className="px-4 py-2 border-t shrink-0" style={{ borderColor: '#1d3a5f' }}>
          <button onClick={() => setPerfilAbierto(true)} title="Abrir mi perfil" className="w-full min-h-16 flex items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-[#18345C] transition-colors">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
              {adminActual?.nombre.split(/\s+/).map(x => x[0]).slice(0, 2).join('').toUpperCase() || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">
                {adminActual?.nombre || 'Administración'}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#AEBCC1' }}>Administradora</p>
              <p className="text-[14px] leading-5 no-underline text-[#D8B94E]">Perfil</p>
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
          <button
            onClick={() => {
              setNotificacionesAbiertas(true);
              guardarCorrecciones(leerCorrecciones().map(n => ({ ...n, leidaAdmin: true })));
            }}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-[#365270] text-white"
            aria-label="Notificaciones">
            <Bell size={18} />
            {correccionesPersonal.filter(n => n.estado === 'pendiente' && !n.leidaAdmin).length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#D8B94E] px-1 text-[9px] font-bold text-[#102747]">
              {correccionesPersonal.filter(n => n.estado === 'pendiente' && !n.leidaAdmin).length}
            </span>}
          </button>
          <div className="lg:hidden flex gap-1.5">
            <ModuloSwitcher actual="admin" onCambiar={onCambiarModulo} variant="inline" />
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {contenido}
        </div>

        <div className="lg:hidden flex shrink-0 border-t overflow-x-auto" style={{ backgroundColor: '#102747', borderColor: '#1d3a5f' }}>
          {SECCIONES.map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'panel' ? badgePanel : s.id === 'inventario' ? badgeInventario : 0;
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
    {notificacionesAbiertas && <div
      className="fixed inset-0 z-[110] grid place-items-center bg-[#071D34]/50 p-4"
      onMouseDown={e => e.target === e.currentTarget && setNotificacionesAbiertas(false)}>
      <section className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b bg-white px-5 py-4">
          <div>
            <h2 className="text-xl font-semibold text-[#18345C]">Notificaciones</h2>
            <p className="text-sm text-[#71839B]">Solicitudes del personal</p>
          </div>
          <button onClick={() => setNotificacionesAbiertas(false)}>
            <X size={20} />
          </button>
        </header>
        <div className="space-y-3 p-5">
          {correccionesPersonal.length === 0 ? <p className="py-8 text-center text-[#71839B]">No hay solicitudes pendientes.</p> : correccionesPersonal.map(n => <div key={n.id} className="rounded-xl border p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-[#18345C]">{n.empleado} solicita una corrección</p>
                <p className="text-xs text-[#71839B]">{n.area} · {n.codigo}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${n.estado === 'pendiente' ? 'bg-[#FFF7DD] text-[#8A6200]' : 'bg-[#F0FAF4] text-[#166534]'}`}>
                {n.estado === 'pendiente' ? 'Pendiente' : n.estado === 'aprobada' ? 'Aprobada' : 'Rechazada'}
              </span>
            </div>
            <div className="mt-3 text-sm">
              <p>
                <b>Dato:</b>
                {n.dato}
              </p>
              <p>
                <b>Actual:</b>
                {n.actual}
              </p>
              <p>
                <b>Solicita:</b>
                {n.nuevo}
              </p>
              {n.motivo && <p className="mt-1">
                <b>Motivo:</b>
                {n.motivo}
              </p>}
            </div>
            {n.estado === 'pendiente' && <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  const motivo = window.prompt('Motivo del rechazo (opcional):') || '';
                  resolverCorreccion(n.id, false, motivo);
                }}
                className="rounded-lg border px-3 py-2 text-sm font-semibold text-[#B42318]">Rechazar solicitud</button>
              <button onClick={() => resolverCorreccion(n.id, true)} className="rounded-lg bg-[#18345C] px-3 py-2 text-sm font-semibold text-white">Aprobar corrección</button>
            </div>}
          </div>)}
        </div>
      </section>
    </div>}
    <StaffProfileModal
      open={perfilAbierto}
      onClose={() => setPerfilAbierto(false)}
      name={adminActual?.nombre || 'Administración'}
      role="Administración"
      email={adminActual?.correo || ''} />
  </div>);
}
