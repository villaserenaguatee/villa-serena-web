'use client';
import { useEffect, useRef, useState } from 'react';
import type { Pedido, EstadoPedido } from '@/lib/pms/types';
import { turnoActual } from '@/data/pms';
import { colaPedidos, detallePedido, menuOperativo, operacion, OperationError, type PedidoRS, type MenuRS } from '@/lib/api/operaciones';
import { useTiempoReal } from '@/lib/tiempo-real/useTiempoReal';
const estados: Record<PedidoRS['estado'], EstadoPedido> = { NUEVO: 'nuevo', EN_PREPARACION: 'en-preparacion', EN_CAMINO: 'en-camino', ENTREGADO: 'entregado', CANCELADO: 'cancelado' };
export function presentarPedido(p: PedidoRS): Pedido {
  return { id: String(p.id), numero: p.id, habitacionNumero: p.habitacion.numero, piso: p.habitacion.piso, huesped: p.nombreHuesped,
    origen: 'app', turno: turnoActual(), estado: estados[p.estado], creadoEn: p.creadoEn,
    notaGeneral: p.notas ?? '', motivoCancelacion: p.motivoCancelacion ?? undefined,
    lineas: p.items.map(i => ({ itemId: String(i.itemId), nombre: i.nombre, cantidad: i.cantidad, precioUnitario: i.precioUnitario })),
    historial: p.historial.map(h => ({ estado: estados[h.estadoNuevo as PedidoRS['estado']], fechaHora: h.fechaHora, motivo: h.motivo ?? undefined })),
  };
}
export function useRoomService(enabled: boolean, avisar: (pedido: Pedido) => void) {
  const [pedidos, setPedidos] = useState<PedidoRS[]>([]), [menu, setMenu] = useState<MenuRS>({ categorias: [], items: [] });
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [loading, setLoading] = useState(enabled);
  const mounted = useRef(false), version = useRef(0), aviso = useRef(avisar), seen = useRef(new Set<number>()), locked = useRef(false);
  aviso.current = avisar;
  const recargar = async () => {
    const current = ++version.current;
    try {
      const [queue, catalog] = await Promise.all([colaPedidos(), menuOperativo()]);
      if (mounted.current && current === version.current) { setPedidos(queue); setMenu(catalog); setError(''); }
    } catch (e) { if (mounted.current && current === version.current) setError(e instanceof Error ? e.message : 'No se pudieron consultar los pedidos.'); }
    finally { if (mounted.current && current === version.current) setLoading(false); }
  };
  useEffect(() => { mounted.current = true; if (enabled) void recargar(); return () => { mounted.current = false; version.current++; }; }, [enabled]);
  useTiempoReal('/topic/pedidos', event => {
    const e = event as { tipo?: string; datos?: PedidoRS };
    if (e.tipo === 'NUEVO_PEDIDO' && e.datos && Number.isSafeInteger(e.datos.id) && !seen.current.has(e.datos.id)) {
      seen.current.add(e.datos.id);
      if (seen.current.size > 200) seen.current.delete(seen.current.values().next().value!);
      aviso.current(presentarPedido(e.datos));
    }
    void recargar();
  }, () => void recargar(), enabled, setError);
  async function action(path: string, input?: unknown) {
    if (locked.current) return;
    locked.current = true; setBusy(true); setError('');
    try { await operacion(path, 'POST', input); await recargar(); }
    catch (e) {
      if (e instanceof OperationError && e.status === 409) { await recargar(); setError('Otro empleado cambió estos datos. Se recargó su estado actual.'); }
      else setError(e instanceof Error ? e.message : 'No se pudo completar la operación.');
    } finally { locked.current = false; if (mounted.current) setBusy(false); }
  }
  return { pedidos: pedidos.map(presentarPedido), menu, error, loading, busy, recargar,
    abrir: async (id: string) => { try { const p = await detallePedido(Number(id)); if (mounted.current) setPedidos(prev => [...prev.filter(x => x.id !== p.id), p]); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo abrir el pedido.'); throw e; } },
    avanzar: (id: string) => {
      const p = pedidos.find(x => x.id === Number(id));
      const next = { NUEVO: 'EN_PREPARACION', EN_PREPARACION: 'EN_CAMINO', EN_CAMINO: 'ENTREGADO' } as const;
      if (p && p.estado in next) return action(`room-service/pedidos/${p.id}/avanzar`, { estadoEsperado: p.estado, nuevoEstado: next[p.estado as keyof typeof next] });
    },
    cancelar: (id: string, motivo: string) => action(`room-service/pedidos/${Number(id)}/cancelar`, { motivo }),
    agotar: (id: number) => action(`room-service/menu/items/${id}/agotar`),
  };
}
