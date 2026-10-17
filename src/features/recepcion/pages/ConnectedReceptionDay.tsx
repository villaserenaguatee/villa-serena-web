'use client';
import { useEffect, useState } from 'react';
import { getReservation, getRooms, searchReservations } from '@/lib/api/reception';
import type { Huesped, Reserva, HabitacionHotel, TipoHabitacion, SeccionRecepcion } from '@/lib/pms/types';
import DiaRecepcion from './DiaRecepcion';

export default function ConnectedReceptionDay({ onAbrirReserva, onIr, refreshTick }: { onAbrirReserva: (code: string) => void; onIr: (section: SeccionRecepcion) => void; refreshTick: number }) {
  const [data, setData] = useState<{ reservas: Reserva[]; huespedes: Huesped[]; habitaciones: HabitacionHotel[] } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    async function load() {
      try {
        const summaries = [];
        for (let page = 0; ; page++) {
          const result = await searchReservations(new URLSearchParams({ page: String(page), size: '100' }), controller.signal);
          summaries.push(...result.contenido);
          if (page + 1 >= result.totalPaginas) break;
        }
        const [details, rooms] = await Promise.all([Promise.all(summaries.map(r => getReservation(r.codigo, controller.signal))), getRooms(new URLSearchParams(), controller.signal)]);
        const huespedes: Huesped[] = [];
        const states = { PENDIENTE_PAGO: 'pendiente', CONFIRMADA: 'confirmada', EN_ESTADIA: 'en-curso', FINALIZADA: 'finalizada', CANCELADA: 'cancelada' } as const;
        const reservas: Reserva[] = details.map(d => {
          const guestId = `bff-guest-${d.huesped.id}`;
          if (!huespedes.some(g => g.id === guestId)) huespedes.push({ id: guestId, nombre: d.huesped.nombreCompleto, correo: d.huesped.correo, telefono: d.huesped.telefono, nacionalidad: d.huesped.nacionalidad, documento: d.huesped.numeroDocumento, tipoDocumento: d.huesped.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte', creadoEn: d.creadaEn });
          return { id: d.codigo, codigo: d.codigo, huespedId: guestId, habitacionId: d.habitacion ? `bff-room-${d.habitacion.id}` : null, tipoHabitacion: d.tipoHabitacion.nombre as TipoHabitacion, fechaEntrada: d.entrada, fechaSalida: d.salida, personas: d.numeroHuespedes, estado: states[d.estado], checkInEn: d.historial.filter(h => h.estadoNuevo === 'EN_ESTADIA').at(-1)?.fechaHora, checkOutEn: d.historial.filter(h => h.estadoNuevo === 'FINALIZADA').at(-1)?.fechaHora, acompanantes: [], servicios: [], pagos: [], descuento: 0, creadoEn: d.creadaEn };
        });
        const habitaciones: HabitacionHotel[] = rooms.map(r => ({ id: `bff-room-${r.id}`, numero: r.numero, piso: r.piso, tipo: r.tipoHabitacion.nombre as TipoHabitacion, capacidad: 0, precioNoche: 0, estado: r.ocupacion === 'OCUPADA' ? 'ocupada' : r.condicion === 'FUERA_DE_SERVICIO' ? 'mantenimiento' : r.condicion !== 'LIMPIA' ? 'en-limpieza' : r.llegaHoy ? 'reservada' : 'disponible' }));
        if (!controller.signal.aborted) setData({ reservas, huespedes, habitaciones });
      } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'No se pudo consultar la vista del día.'); }
    }
    void load();
    return () => controller.abort();
  }, [refreshTick]);
  if (error) return <p role="alert" className="p-4 text-red-800">{error}</p>;
  if (!data) return <p role="status" className="p-4">Consultando reservas del día…</p>;
  return <DiaRecepcion {...data} onAbrirReserva={onAbrirReserva} onIr={onIr} />;
}
