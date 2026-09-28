import type { EstadoPedido, Pedido, PedidoHuesped, TurnoRS } from '@/lib/pms/types';
import { leerReservas, guardarReservas } from '@/store/reservationStore';
import { leerHabitaciones } from '@/store/roomStore';
const KEY = 'vs-room-service-pedidos';
export const EVENTO_PEDIDO_RS = 'vs-room-service-pedido';
export const EVENTO_ESTADO_RS = 'vs-room-service-estado';
export type ActualizacionPedidoRS = {
  id: string;
  numero: number;
  estado: EstadoPedido;
  motivo?: string;
  fechaHora: string;
};
function sincronizarCargoEstancia(pedido: Pedido) {
  if (pedido.estado !== 'entregado')
    return;
  const habitacion = leerHabitaciones().find(h => h.numero === pedido.habitacionNumero);
  if (!habitacion)
    return;
  const reservas = leerReservas();
  const reserva = reservas.find(r => r.habitacionId === habitacion.id && r.estado === 'en-curso');
  if (!reserva)
    return;
  const servicioId = `room-service-${pedido.id}`;
  if (reserva.servicios.some(s => s.id === servicioId))
    return;
  const total = pedido.lineas.reduce((s, l) => s + l.precioUnitario * l.cantidad, 0) * (1 - (pedido.descuentoPct ?? 0) / 100);
  const servicio = {
    id: servicioId,
    tipo: 'Room Service',
    descripcion: `Pedido #${pedido.numero}: ${pedido.lineas.map(l => `${l.cantidad}× ${l.nombre}`).join(' · ')}`,
    cantidad: 1,
    precioUnitario: Math.round(total * 100) / 100,
    fecha: pedido.entregadoEn ?? new Date().toISOString(),
  };
  guardarReservas(reservas.map(r => r.id === reserva.id ? { ...r, servicios: [...r.servicios, servicio] } : r));
}
export function leerPedidosPortal(): Pedido[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]') as Pedido[];
  }
  catch {
    return [];
  }
}
function guardar(pedidos: Pedido[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pedidos));
  }
  catch { }
}
export function guardarPedidoRoomService(pedido: Pedido) {
  const actuales = leerPedidosPortal();
  guardar([pedido, ...actuales.filter(x => x.id !== pedido.id)]);
  window.dispatchEvent(new CustomEvent(EVENTO_PEDIDO_RS, { detail: pedido }));
}
export function publicarPedidoPortal(p: PedidoHuesped,
  meta: {
    habitacion: string;
    piso: number;
    huesped: string;
    turno: TurnoRS;
  }) {
  const pedido: Pedido = {
    id: p.id,
    numero: p.numero,
    habitacionNumero: meta.habitacion,
    piso: meta.piso,
    huesped: meta.huesped,
    origen: 'portal',
    turno: meta.turno,
    lineas: p.lineas.map(l => ({ itemId: l.refId, nombre: l.nombre, precioUnitario: l.precioUnitario, cantidad: l.cantidad, nota: l.nota })),
    notaGeneral: p.nota,
    alergias: p.alergias,
    indicaciones: p.nota,
    lugarEntrega: p.lugarEntrega || `Habitación ${meta.habitacion}`,
    codigoCupon: p.codigoCupon,
    descuentoPct: p.descuentoPct,
    estado: 'nuevo',
    creadoEn: p.creadoEn,
    historial: [{ estado: 'nuevo', fechaHora: p.creadoEn }]
  };
  guardarPedidoRoomService(pedido);
}
const SIGUIENTE_ESTADO_CENTRAL: Record<EstadoPedido, EstadoPedido | null> = {
  nuevo: 'en-preparacion',
  'en-preparacion': 'en-camino',
  'en-camino': 'entregado',
  entregado: null,
  cancelado: null,
};
export function actualizarPedidoPortal(id: string,
  estado: EstadoPedido,
  motivo?: string) {
  const fechaHora = new Date().toISOString();
  let numero = 0;
  let actualizado: Pedido | undefined;
  const pedidos = leerPedidosPortal().map(p => {
    if (p.id !== id)
      return p;
    numero = p.numero;
    const cancelacionValida = estado === 'cancelado' && p.estado !== 'entregado' && p.estado !== 'cancelado';
    const avanceValido = SIGUIENTE_ESTADO_CENTRAL[p.estado] === estado;
    if (!cancelacionValida && !avanceValido)
      return p;
    actualizado = {
      ...p,
      estado,
      motivoCancelacion: motivo ?? p.motivoCancelacion,
      entregadoEn: estado === 'entregado' ? fechaHora : p.entregadoEn,
      historial: [...p.historial, { estado, fechaHora, motivo }]
    };
    return actualizado;
  });
  if (!actualizado)
    return;
  guardar(pedidos);
  sincronizarCargoEstancia(actualizado);
  const detalle: ActualizacionPedidoRS = { id, numero, estado, motivo, fechaHora };
  window.dispatchEvent(new CustomEvent(EVENTO_ESTADO_RS, { detail: detalle }));
}
