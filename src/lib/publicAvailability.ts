import { useEffect, useState } from 'react';
import type { PublicRoom } from '@/data/publicRooms';
import { leerReservas, RESERVAS_EVENT } from '@/store/reservationStore';
import { HABITACIONES_EVENT, leerHabitaciones } from '@/store/roomStore';
import { tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { habitacionesDisponibles } from '@/features/recepcion/pages/recUtils';
export function todayISO() {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
function validDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
export function validStay(arrival: string, departure: string) {
  return validDate(arrival) && validDate(departure) && arrival >= todayISO() && departure > arrival;
}
export function validGuests(adults: number, children: number) {
  return Number.isInteger(adults) && adults >= 1 && Number.isInteger(children) && children >= 0;
}
export function readAvailability() {
  return { habitaciones: leerHabitaciones(), reservas: leerReservas() };
}
export type PublicAvailability = ReturnType<typeof readAvailability>;
export function usePublicAvailability() {
  const [inventory, setInventory] = useState<PublicAvailability | null>(null);
  useEffect(() => {
    const refresh = () => setInventory(readAvailability());
    const events = [HABITACIONES_EVENT, RESERVAS_EVENT, 'storage', 'focus'];
    refresh();
    events.forEach(event => window.addEventListener(event, refresh));
    return () => events.forEach(event => window.removeEventListener(event, refresh));
  },
    []);
  return inventory;
}
export function availableRoom(room: PublicRoom,
  arrival: string,
  departure: string,
  guests: number,
  inventory: PublicAvailability | null,
  roomId?: string) {
  if (!inventory || !validStay(arrival, departure) || !Number.isInteger(guests) || guests < 1 || room.capacity < guests)
    return undefined;
  const tipo = tipoPublicoATipoHotel(room.type);
  return habitacionesDisponibles(arrival, departure, inventory.habitaciones, inventory.reservas, { personas: guests, tipo })
    .find(h => h.piso === room.floor && (!roomId || h.id === roomId));
}
