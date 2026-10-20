import type { CargoHuesped, EstadoPedido, Pedido, PedidoHuesped, Reserva, TurnoRS } from '@/lib/pms/types';
import { leerReservas, guardarReservas } from '@/store/reservationStore';
import { leerHabitaciones } from '@/store/roomStore';
import { leerHuespedes } from '@/store/guestStore';
export const PEDIDOS_RS_KEY = 'vs-room-service-pedidos';
const KEY = PEDIDOS_RS_KEY;
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
  const reservas = leerReservas();
  const reserva = reservas.find(r => r.id === pedido.reservaId && r.huespedId === pedido.huespedId && r.habitacionId === pedido.habitacionId);
  if (!reserva) return;
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
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  }
  catch {
    return [];
  }
}
function guardar(pedidos: Pedido[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(pedidos));
  }
  catch { return false; }
  return true;
}
export function guardarPedidoRoomService(pedido: Pedido) {
  const actuales = leerPedidosPortal();
  if (!guardar([pedido, ...actuales.filter(x => x.id !== pedido.id)])) return false;
  sincronizarCargoEstancia(pedido);
  window.dispatchEvent(new CustomEvent(EVENTO_PEDIDO_RS, { detail: pedido }));
  return true;
}
export function publicarPedidoPortal(p: PedidoHuesped,
  meta: {
    reserva: Reserva;
    habitacion: string;
    piso: number;
    huesped: string;
    turno: TurnoRS;
  }) {
  if (p.tipo !== 'restaurante') return false;
  const reserva = leerReservas().find(r => r.id === meta.reserva.id && r.huespedId === meta.reserva.huespedId && r.habitacionId === meta.reserva.habitacionId);
  if (!reserva?.habitacionId || !leerHuespedes().some(h => h.id === reserva.huespedId)) return false;
  const pedido: Pedido = {
    reservaId: meta.reserva.id,
    huespedId: meta.reserva.huespedId,
    habitacionId: meta.reserva.habitacionId ?? undefined,
    codigoReserva: meta.reserva.codigo,
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
    estado: p.estado === 'recibido' ? 'nuevo' : p.estado,
    creadoEn: p.creadoEn,
    entregadoEn: p.entregadoEn,
    motivoCancelacion: p.motivoCancelacion,
    historial: p.historial.map(h => ({ ...h, estado: h.estado === 'recibido' ? 'nuevo' : h.estado }))
  };
  return guardarPedidoRoomService(pedido);
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
  if (!actualizado || !guardar(pedidos))
    return false;
  sincronizarCargoEstancia(actualizado);
  const detalle: ActualizacionPedidoRS = { id, numero, estado, motivo, fechaHora };
  window.dispatchEvent(new CustomEvent(EVENTO_ESTADO_RS, { detail: detalle }));
  return true;
}

export function relacionEstanciaRoomService(numero: string): Partial<Pedido> {
  const habitacion = leerHabitaciones().find(h => h.numero === numero);
  const activas = leerReservas().filter(r => r.habitacionId === habitacion?.id && r.estado === 'en-curso');
  if (!habitacion || activas.length !== 1) return {};
  const r = activas[0];
  if (!leerHuespedes().some(h => h.id === r.huespedId)) return {};
  return { reservaId: r.id, huespedId: r.huespedId, habitacionId: r.habitacionId ?? undefined, codigoReserva: r.codigo };
}
export function pedidosRestauranteHuesped(reservaId: string, huespedId: string): PedidoHuesped[] {
  return leerPedidosPortal().filter(p => p.reservaId === reservaId && p.huespedId === huespedId).map(p => ({
    ...p, tipo: 'restaurante', nota: p.notaGeneral, alergias: p.alergias ?? '',
    lineas: p.lineas.map(l => ({ ...l, refId: l.itemId })),
    estado: p.estado === 'nuevo' ? 'recibido' : p.estado,
    historial: p.historial.map(h => ({ ...h, estado: h.estado === 'nuevo' ? 'recibido' : h.estado })),
  }));
}

export function filtrarCargosLegacyRestaurante(cargos: CargoHuesped[], reservaId: string, huespedId: string): CargoHuesped[] {
  const prefijos = leerPedidosPortal()
    .filter(p => p.reservaId === reservaId && p.huespedId === huespedId)
    .map(p => `pedido-${p.id}-`);
  return cargos.filter(c =>
    c.categoria !== 'Restaurante' && c.categoria !== 'Room service' &&
    !c.id.startsWith('room-service-') && !prefijos.some(prefijo => c.id.startsWith(prefijo))
  );
}
