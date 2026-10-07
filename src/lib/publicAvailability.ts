import { useEffect, useState } from 'react';
import type { PublicRoom } from '@/data/publicRooms';
import { leerReservas, RESERVAS_EVENT } from '@/store/reservationStore';
import { HABITACIONES_EVENT, leerHabitaciones } from '@/store/roomStore';
import { tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { habitacionesDisponibles } from '@/features/recepcion/pages/recUtils';
import { getPublicAvailability } from '@/lib/api/availability';
import type { AvailabilityQuery } from '@/lib/bff/contracts/availability';
import { fechaHotel } from '@/lib/hotel';
import { publicSearchError } from '@/lib/publicStayValidation';
export function todayISO() {
  return fechaHotel();
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validStay(arrival: string, departure: string) {
  return validDate(arrival) && validDate(departure) && !publicSearchError(arrival, departure, 1, 0);
}
export function validGuests(adults: number, children: number) {
  return Number.isInteger(adults) && adults >= 1 && Number.isInteger(children) && children >= 0;
}
export function readAvailability() {
  return { habitaciones: leerHabitaciones(), reservas: leerReservas() };
}
export type PublicAvailability = ReturnType<typeof readAvailability> & { query?: AvailabilityQuery; error?: boolean };
export function usePublicAvailability(query: AvailabilityQuery, capacity = 5) {
  const { arrival, departure, adults, children } = query;
  const [inventory, setInventory] = useState<PublicAvailability | null>(null);
  useEffect(() => {
    let controller: AbortController | undefined;
    let disposed = false;
    const refresh = () => {
      controller?.abort();
      controller = new AbortController();
      const current = controller;
      setInventory(null);
      if (publicSearchError(arrival, departure, adults, children, capacity)) {
        setInventory({ habitaciones: [], reservas: [], query: { arrival, departure, adults, children } });
        return;
      }
      const local = readAvailability();
      void getPublicAvailability({ arrival, departure, adults, children, demo: {
        rooms: local.habitaciones,
        holds: local.reservas.map(reservation => ({ code: reservation.codigo, roomId: reservation.habitacionId,
          roomType: reservation.tipoHabitacion, arrival: reservation.fechaEntrada, departure: reservation.fechaSalida, status: reservation.estado })),
      } }, current.signal).then(result => {
        if (!disposed && !current.signal.aborted) setInventory({ habitaciones: result.rooms, reservas: [], query: result.query });
      }).catch(() => {
        if (!disposed && !current.signal.aborted) setInventory({ habitaciones: [], reservas: [], query: { arrival, departure, adults, children }, error: true });
      });
    };
    const events = [HABITACIONES_EVENT, RESERVAS_EVENT, 'storage', 'focus'];
    refresh();
    events.forEach(event => window.addEventListener(event, refresh));
    return () => { disposed = true; controller?.abort(); events.forEach(event => window.removeEventListener(event, refresh)); };
  },
    [arrival, departure, adults, children, capacity]);
  return inventory;
}
export function availableRoom(room: PublicRoom,
  arrival: string,
  departure: string,
  guests: number,
  inventory: PublicAvailability | null,
  roomId?: string) {
  if (!inventory || inventory.error || (inventory.query && (inventory.query.arrival !== arrival || inventory.query.departure !== departure ||
    inventory.query.adults + inventory.query.children !== guests)) || !validStay(arrival, departure) || !Number.isInteger(guests) || guests < 1 || room.capacity < guests)
    return undefined;
  const tipo = tipoPublicoATipoHotel(room.type);
  if (inventory.query) {
    // BFF results already contain only available rooms; the browser selects presentation metadata.
    return inventory.habitaciones.find(h => h.tipo === tipo && h.piso === room.floor && h.capacidad >= guests && (!roomId || h.id === roomId));
  }
  // Legacy local creation remains unchanged until the next migration block.
  return habitacionesDisponibles(arrival, departure, inventory.habitaciones, inventory.reservas, { personas: guests, tipo })
    .find(h => h.piso === room.floor && (!roomId || h.id === roomId));
}
