import { useEffect, useMemo, useState } from 'react';
import type { Modulo, Pedido, ItemMenu, LineaPedido, NotificacionRS, SeccionRS, EstadoPedido, } from '@/lib/pms/types';
import { generarId, ahoraISO, formatoHoraISO, turnoActual, siguienteNumeroPedido, pisoDeHabitacion, } from '@/data/pms';
import { SIGUIENTE_ESTADO, BellIcon, BedIcon, ClockIcon } from '@/features/roomservice/pages/rsUtils';
import ModuloSwitcher from '@/components/common/ModuloSwitcher';
import StaffProfileModal from '@/components/common/StaffProfileModal';
import { EMPLEADOS_EVENT, leerEmpleados } from '@/store/employeeStore';
import { useAuth } from '@/hooks/useAuth';
import PedidosPendientes from '@/features/roomservice/pages/PedidosPendientes';
import DetallePedido from '@/features/roomservice/pages/DetallePedido';
import NuevoPedidoModal from '@/features/roomservice/pages/NuevoPedidoModal';
import MenuCatalogo from '@/features/roomservice/pages/MenuCatalogo';
import HistorialPedidos from '@/features/roomservice/pages/HistorialPedidos';
import Cargos from '@/features/roomservice/pages/Cargos';
import { EVENTO_PEDIDO_RS, EVENTO_ESTADO_RS, PEDIDOS_RS_KEY, relacionEstanciaRoomService, actualizarPedidoPortal, guardarPedidoRoomService, leerPedidosPortal } from '@/store/roomServiceSync';
import { MENU_EVENT, actualizarDisponibilidadMenu, leerMenu } from '@/store/menuStore';
import { useRoomService } from '@/features/roomservice/useRoomService';
import MenuOperativo from './MenuOperativo';
const SECCIONES: {
  id: SeccionRS;
  label: string;
  labelCorto: string;
}[] = [
    { id: 'resumen', label: 'Resumen', labelCorto: 'Resumen' },
    { id: 'pedidos', label: 'Pedidos', labelCorto: 'Pedidos' },
    { id: 'menu', label: 'Menú y catálogo', labelCorto: 'Menú' },
    { id: 'cargos', label: 'Cargos a habitaciones', labelCorto: 'Cargos' },
    { id: 'historial', label: 'Historial de pedidos', labelCorto: 'Historial' },
  ];
function SeccionIcon({ id, size = 18 }: {
  id: SeccionRS;
  size?: number;
}) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.75 } as const;
  if (id === 'resumen')
    return <svg {...p}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
    </svg>;
  if (id === 'pedidos')
    return (<svg {...p}>
      <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13 5.4 5M7 13l-2.3 4.3A1 1 0 0 0 6 19h12" />
      <circle cx="9" cy="21" r="1" />
      <circle cx="18" cy="21" r="1" />
    </svg>);
  if (id === 'menu')
    return (<svg {...p}>
      <path d="M3 2v7c0 1.1.9 2 2 2h0a2 2 0 0 0 2-2V2M5 2v20M13 2v20M13 8h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2h-4" />
    </svg>);
  if (id === 'cargos')
    return (<svg {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
    </svg>);
  return (<svg {...p}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>);
}
interface Props {
  onCambiarModulo: (m: Modulo) => void;
  conectado?: boolean;
}
export default function RoomServiceApp({ onCambiarModulo, conectado = false }: Props) {
  const [empleados, setEmpleados] = useState(() => leerEmpleados());
  const { user } = useAuth();
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
  const empleadoRS = empleados.find(e => e.id === user?.id && e.activo);
  const encargadoRS = conectado ? user?.name ?? 'Room Service' : empleadoRS?.nombre ?? 'Room Service';
  const [perfilAbierto, setPerfilAbierto] = useState(false);
  const [pedidosLocales, setPedidos] = useState<Pedido[]>(() => conectado ? [] : leerPedidosPortal());
  const [menu, setMenu] = useState<ItemMenu[]>(() => conectado ? [] : leerMenu());
  useEffect(() => {
    if (conectado) return;
    const sincronizarMenu = () => setMenu(leerMenu());
    window.addEventListener(MENU_EVENT, sincronizarMenu);
    window.addEventListener('storage', sincronizarMenu);
    return () => {
      window.removeEventListener(MENU_EVENT, sincronizarMenu);
      window.removeEventListener('storage', sincronizarMenu);
    };
  },
    [conectado]);
  const [seccion, setSeccion] = useState<SeccionRS>('resumen');
  const [pedidoAbierto, setPedidoAbierto] = useState<string | null>(null);
  const [mostrarNuevo, setMostrarNuevo] = useState(false);
  const [notificaciones, setNotificaciones] = useState<NotificacionRS[]>([]);
  const [toasts, setToasts] = useState<NotificacionRS[]>([]);
  const [panelNotif, setPanelNotif] = useState(false);
  const turno = useMemo(() => turnoActual(), []);
  const remoto = useRoomService(conectado, pedido => {
    const notif: NotificacionRS = { id: generarId(), pedidoId: pedido.id, habitacionNumero: pedido.habitacionNumero, hora: pedido.creadoEn, leida: false };
    setNotificaciones(prev => [notif, ...prev].slice(0, 100));
    setToasts(prev => [notif, ...prev].slice(0, 5));
    window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== notif.id)), 8000);
  });
  const pedidos = conectado ? remoto.pedidos : pedidosLocales;
  useEffect(() => {
    if (conectado) return;
    const recibir = (event: Event) => {
      const pedido = (event as CustomEvent<Pedido>).detail;
      if (!pedido)
        return;
      setPedidos(leerPedidosPortal());
      const notif: NotificacionRS = { id: generarId(), pedidoId: pedido.id, habitacionNumero: pedido.habitacionNumero, hora: pedido.creadoEn, leida: false };
      setNotificaciones(prev => [notif, ...prev]);
      setToasts(prev => [notif, ...prev]);
      window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== notif.id)), 8000);
    };
    const sincronizar = () => setPedidos(leerPedidosPortal());
    const storage = (e: StorageEvent) => { if (e.key === PEDIDOS_RS_KEY || e.key === null) sincronizar(); };
    window.addEventListener(EVENTO_PEDIDO_RS, recibir);
    window.addEventListener(EVENTO_ESTADO_RS, sincronizar);
    window.addEventListener('storage', storage);
    sincronizar();
    return () => {
      window.removeEventListener(EVENTO_PEDIDO_RS, recibir);
      window.removeEventListener(EVENTO_ESTADO_RS, sincronizar);
      window.removeEventListener('storage', storage);
    };
  },
    [conectado]);
  const pedidoActual = pedidos.find(p => p.id === pedidoAbierto) ?? null;
  const noLeidas = notificaciones.filter(n => !n.leida).length;
  const nuevosTurno = pedidos.filter(p => p.turno === turno && p.estado === 'nuevo').length;
  function avanzarEstado(id: string) {
    if (conectado) { void remoto.avanzar(id); return; }
    const actual = leerPedidosPortal().find(p => p.id === id);
    const proximo = actual ? SIGUIENTE_ESTADO[actual.estado] : undefined;
    if (proximo) actualizarPedidoPortal(id, proximo);
    setPedidos(leerPedidosPortal());
  }
  function cancelarPedido(id: string, motivo: string) {
    if (conectado) { void remoto.cancelar(id, motivo); return; }
    actualizarPedidoPortal(id, 'cancelado', motivo);
    setPedidos(leerPedidosPortal());
  }
  function crearPedidoTelefonico(datos: {
    habitacionNumero: string;
    huesped: string;
    lineas: LineaPedido[];
    notaGeneral: string;
    lugarEntrega: string;
  }) {
    const ahora = ahoraISO();
    const nuevo: Pedido = {
      ...relacionEstanciaRoomService(datos.habitacionNumero),
      id: generarId(),
      numero: siguienteNumeroPedido(),
      habitacionNumero: datos.habitacionNumero,
      piso: pisoDeHabitacion(datos.habitacionNumero),
      huesped: datos.huesped,
      origen: 'telefono',
      turno,
      lineas: datos.lineas,
      notaGeneral: datos.notaGeneral,
      lugarEntrega: datos.lugarEntrega,
      estado: 'nuevo',
      creadoEn: ahora,
      historial: [{ estado: 'nuevo', fechaHora: ahora }],
    };
    if (!guardarPedidoRoomService(nuevo)) return;
    setPedidos(leerPedidosPortal());
    setMostrarNuevo(false);
    setSeccion('pedidos');
  }
  function marcarAgotado(id: string) {
    setMenu(actualizarDisponibilidadMenu(id, false));
  }
  function reactivarItem(id: string) {
    setMenu(actualizarDisponibilidadMenu(id, true));
  }
  function abrirDesdeNotificacion(notif: NotificacionRS) {
    setNotificaciones(prev => prev.map(n => (n.id === notif.id ? { ...n, leida: true } : n)));
    setToasts(prev => prev.filter(t => t.id !== notif.id));
    setPanelNotif(false);
    abrirDetalle(notif.pedidoId);
  }
  function abrirDetalle(id: string) {
    if (conectado) { void remoto.abrir(id).then(() => setPedidoAbierto(id)).catch(() => setPedidoAbierto(null)); return; }
    setPedidoAbierto(id);
  }
  const contenido = (() => {
    switch (seccion) {
      case 'resumen': {
        const estados: {
          estado: EstadoPedido;
          label: string;
        }[] = [
            { estado: 'nuevo', label: 'Nuevos' },
            { estado: 'en-preparacion', label: 'En preparación' },
            { estado: 'en-camino', label: 'En entrega' },
            { estado: 'entregado', label: 'Completados' },
            { estado: 'cancelado', label: 'Cancelados' },
          ];
        const pedidosActivos = pedidos
          .filter((p) => !['entregado', 'cancelado'].includes(p.estado))
          .slice(0, 6);
        const actividadReciente = [...pedidos]
          .sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime())
          .slice(0, 6);
        const textoEstado = (estado: EstadoPedido) => {
          switch (estado) {
            case 'nuevo':
              return 'Nuevo';
            case 'en-preparacion':
              return 'En preparación';
            case 'en-camino':
              return 'En entrega';
            case 'entregado':
              return 'Completado';
            case 'cancelado':
              return 'Cancelado';
            default:
              return estado;
          }
        };
        return (<section className="h-full w-full overflow-y-auto bg-[#F8F6F0] p-4 sm:p-6 lg:p-8">
          <div className="w-full">

            <div>
              <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#B38719]">
                Operación del día
              </p>

              <h1 className="mt-1 text-2xl font-semibold text-[#18345C]">
                Resumen de Room Service
              </h1>

              <p className="mt-1 text-sm text-[#71839B]">
                Estado actual de los pedidos registrados.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {estados.map((x) => (<button
                key={x.estado}
                onClick={() => setSeccion('pedidos')}
                className="min-h-[112px] rounded-xl border border-[#E5E0D8] bg-white p-5 flex flex-col items-center justify-center text-center shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#D8B94E] hover:shadow-md">
                <span className="text-sm text-[#71839B]">
                  {x.label}
                </span>

                <strong className="mt-2 block text-3xl font-semibold text-[#18345C]">
                  {pedidos.filter((p) => p.estado === x.estado).length}
                </strong>
              </button>))}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-2">

              <div className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE8DF] pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#18345C]">
                      Pedidos activos
                    </h2>

                    <p className="mt-1 text-sm text-[#71839B]">
                      Pedidos que todavía requieren seguimiento.
                    </p>
                  </div>

                  <button
                    onClick={() => setSeccion('pedidos')}
                    className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C] transition-colors hover:bg-[#18345C] hover:text-white">
                    Ver pedidos
                  </button>
                </div>

                <div className="mt-2 divide-y divide-[#EEE8DF]">
                  {pedidosActivos.length > 0 ? (pedidosActivos.map((p) => (<button
                    key={p.id}
                    onClick={() => abrirDetalle(p.id)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-[#FAF9F6]">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#18345C]">
                        Pedido {p.numero}
                      </p>

                      <p className="mt-1 text-sm text-[#71839B]">
                        Habitación {p.habitacionNumero}
                        {p.huesped ? ` · ${p.huesped}` : ''}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className="inline-flex rounded-full bg-[#F4E8B9] px-3 py-1 text-xs font-semibold text-[#8A6813]">
                        {textoEstado(p.estado)}
                      </span>

                      <p className="mt-1 text-xs text-[#71839B]">
                        {formatoHoraISO(p.creadoEn)}
                      </p>
                    </div>
                  </button>))) : (<div className="flex min-h-[220px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F0] text-[#B38719]">
                        <ClockIcon size={22} />
                      </div>

                      <p className="font-medium text-[#52677F]">
                        No hay pedidos activos.
                      </p>

                      <p className="mt-1 text-sm text-[#8B99AA]">
                        Los nuevos pedidos aparecerán aquí.
                      </p>
                    </div>
                  </div>)}
                </div>
              </div>

              <div className="rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE8DF] pb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-[#18345C]">
                      Actividad reciente
                    </h2>

                    <p className="mt-1 text-sm text-[#71839B]">
                      Últimos registros de Room Service.
                    </p>
                  </div>

                  <button
                    onClick={() => setSeccion('historial')}
                    className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C] transition-colors hover:bg-[#18345C] hover:text-white">
                    Ver historial
                  </button>
                </div>

                <div className="mt-2 divide-y divide-[#EEE8DF]">
                  {actividadReciente.length > 0 ? (actividadReciente.map((p) => (<button
                    key={p.id}
                    onClick={() => abrirDetalle(p.id)}
                    className="flex w-full items-center justify-between gap-4 py-4 text-left transition-colors hover:bg-[#FAF9F6]">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F8F6F0] text-[#B38719]">
                        <BedIcon size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[#18345C]">
                          Pedido {p.numero}
                        </p>

                        <p className="mt-0.5 truncate text-sm text-[#71839B]">
                          Habitación {p.habitacionNumero}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium text-[#52677F]">
                        {textoEstado(p.estado)}
                      </p>

                      <p className="mt-1 flex items-center justify-end gap-1 text-xs text-[#8B99AA]">
                        <ClockIcon size={11} />
                        {formatoHoraISO(p.creadoEn)}
                      </p>
                    </div>
                  </button>))) : (<div className="flex min-h-[220px] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F8F6F0] text-[#B38719]">
                        <ClockIcon size={22} />
                      </div>

                      <p className="font-medium text-[#52677F]">
                        No hay actividad reciente.
                      </p>

                      <p className="mt-1 text-sm text-[#8B99AA]">
                        Los registros de pedidos aparecerán aquí.
                      </p>
                    </div>
                  </div>)}
                </div>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#18345C]">
                  Resumen operativo
                </h2>

                <p className="mt-1 text-sm text-[#71839B]">
                  Vista general de la operación actual de Room Service.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl bg-[#F8F6F0] p-4">
                  <p className="text-sm text-[#71839B]">
                    Requieren atención
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-[#18345C]">
                    {pedidos.filter((p) => p.estado === 'nuevo' ||
                      p.estado === 'en-preparacion').length}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F6F0] p-4">
                  <p className="text-sm text-[#71839B]">
                    En entrega
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-[#18345C]">
                    {pedidos.filter((p) => p.estado === 'en-camino').length}
                  </p>
                </div>

                <div className="rounded-xl bg-[#F8F6F0] p-4">
                  <p className="text-sm text-[#71839B]">
                    Total registrados
                  </p>

                  <p className="mt-2 text-2xl font-semibold text-[#18345C]">
                    {pedidos.length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>);
      }
      case 'pedidos':
        return (<PedidosPendientes pedidos={pedidos} turno={turno} conectado={conectado} onAbrirDetalle={abrirDetalle} onNuevoTelefonico={conectado ? undefined : () => setMostrarNuevo(true)} />);
      case 'menu':
        return conectado ? <MenuOperativo menu={remoto.menu} busy={remoto.busy} agotar={id => void remoto.agotar(id)} /> : <MenuCatalogo menu={menu} onMarcarAgotado={marcarAgotado} onReactivar={reactivarItem} />;
      case 'cargos':
        return <Cargos pedidos={pedidos} onAbrirDetalle={abrirDetalle} />;
      case 'historial':
        return <HistorialPedidos pedidos={pedidos} turno={turno} />;
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
        <div className="px-4 pt-5 pb-5 border-b shrink-0 text-center" style={{ borderColor: '#1d3a5f' }}>
          <img src="/villa-serena-logo.png" alt="Villa Serena" className="h-32 w-44 object-contain mx-auto mb-2" />
          <p className="text-white text-xl font-bold leading-tight" style={{ letterSpacing: '0.02em' }}>Villa Serena</p>
          <p className="mt-2 text-xl font-semibold leading-6" style={{ color: '#AEBCC1', letterSpacing: '0.06em' }}>
            Room Service
          </p>
        </div>

        <div className="vs-scroll-clean flex-1 py-3 overflow-y-auto">
          {SECCIONES.filter(s => !conectado || !['cargos', 'historial'].includes(s.id)).map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'pedidos' ? nuevosTurno : 0;
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

        <div className="mt-auto px-4 py-2 border-t shrink-0" style={{ borderColor: '#1d3a5f' }}>
          <button
            onClick={() => setPerfilAbierto(true)}
            className="w-full min-h-16 flex items-center gap-3 rounded-lg px-2 py-1 text-left hover:bg-[#18345C] transition-colors"
            title="Abrir mi perfil">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
              style={{ backgroundColor: '#D8B94E', color: '#102747' }}>DF</div>
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">
                {encargadoRS}
              </p>
              <p className="text-[10px] truncate" style={{ color: '#AEBCC1' }}>Room Service · turno de {turno}</p>
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

          <div className="lg:hidden flex gap-1.5 shrink-0">
            <ModuloSwitcher actual="roomservice" onCambiar={onCambiarModulo} variant="inline" />
          </div>

          <div className="relative">
            <button onClick={() => setPanelNotif(v => !v)} className="relative text-[#AEBCC1] hover:text-white p-1" aria-label="Notificaciones">
              <BellIcon size={20} />
              {noLeidas > 0 && (<span
                className="absolute -top-1 -right-1 text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
                {noLeidas}
              </span>)}
            </button>

            {panelNotif && (<>
              <div className="fixed inset-0 z-20" onClick={() => setPanelNotif(false)} />
              <div className="absolute right-0 mt-2 w-72 max-h-96 overflow-y-auto bg-white border border-[#E5E0D8] rounded-xl shadow-2xl z-30">
                <div className="px-4 py-3 border-b border-[#E5E0D8]">
                  <p className="text-[14px] font-semibold text-[#18345C]">Notificaciones</p>
                </div>
                {notificaciones.length === 0 ? (<p className="px-4 py-6 text-[13px] text-[#AEBCC1] text-center">
                  Sin notificaciones.
                </p>) : (<div className="divide-y divide-[#F0EBE3]">
                  {notificaciones.map(n => (<button
                    key={n.id}
                    onClick={() => abrirDesdeNotificacion(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-[#F8F6F0] transition-colors flex items-start gap-3 ${n.leida ? 'opacity-60' : ''}`}>
                    <span className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0">
                      <BedIcon size={15} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[#1F2933]">
                        Nuevo pedido · Habitación {n.habitacionNumero}
                      </p>
                      <p className="text-[12px] text-[#AEBCC1] flex items-center gap-1 mt-0.5">
                        <ClockIcon size={11} />
                        {formatoHoraISO(n.hora)} · Ver detalle
                      </p>
                    </div>
                  </button>))}
                </div>)}
              </div>
            </>)}
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden relative">
          {conectado && remoto.error && <p role="alert" className="bg-red-50 text-red-800 p-3">{remoto.error}</p>}
          {conectado && remoto.loading && <p role="status" className="p-3">Consultando pedidos…</p>}
          {contenido}
        </div>

        <div className="lg:hidden flex shrink-0 border-t" style={{ backgroundColor: '#102747', borderColor: '#1d3a5f' }}>
          {SECCIONES.filter(s => !conectado || !['cargos', 'historial'].includes(s.id)).map(s => {
            const active = seccion === s.id;
            const badge = s.id === 'pedidos' ? nuevosTurno : 0;
            return (<button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors min-w-0"
              style={{ color: active ? '#D8B94E' : '#AEBCC1' }}>
              {active && (<span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5" style={{ backgroundColor: '#D8B94E' }} />)}
              <span className="relative">
                <SeccionIcon id={s.id} size={20} />
                {badge > 0 && (<span
                  className="absolute -top-1 -right-2 text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#D8B94E', color: '#102747' }}>
                  {badge}
                </span>)}
              </span>
              <span className="text-[9px] font-medium leading-tight truncate max-w-full px-0.5">
                {s.labelCorto}
              </span>
            </button>);
          })}
        </div>
      </div>
    </div>

    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-[calc(100%-2rem)] sm:w-80">
      {toasts.map(t => (<button
        key={t.id}
        onClick={() => abrirDesdeNotificacion(t)}
        className="w-full text-left bg-white border border-[#18345C] rounded-xl shadow-2xl px-4 py-3 flex items-start gap-3 animate-[fadein_0.2s_ease-out]">
        <span className="w-9 h-9 rounded-lg bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0">
          <BellIcon size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold text-[#18345C]">Nuevo pedido de Room Service</p>
          <p className="text-[13px] text-[#6B7280] mt-0.5">
            Habitación {t.habitacionNumero} · Piso {pedidos.find(p => p.id === t.pedidoId)?.piso ?? pisoDeHabitacion(t.habitacionNumero)} · {formatoHoraISO(t.hora)}
          </p>
          <p className="text-[12px] text-[#18345C] font-medium mt-1">Toca para ver el detalle</p>
        </div>
      </button>))}
    </div>

    {pedidoActual && (<DetallePedido
      pedido={pedidoActual}
      conectado={conectado}
      busy={remoto.busy}
      onCerrar={() => setPedidoAbierto(null)}
      onAvanzarEstado={avanzarEstado}
      onCancelar={(id, motivo) => cancelarPedido(id, motivo)} />)}

    {mostrarNuevo && (<NuevoPedidoModal menu={menu} onCerrar={() => setMostrarNuevo(false)} onGuardar={crearPedidoTelefonico} />)}
    <StaffProfileModal
      open={perfilAbierto}
      onClose={() => setPerfilAbierto(false)}
      name={encargadoRS}
      role="Room Service"
      email={empleadoRS?.correo || ''} />
  </div>);
}
