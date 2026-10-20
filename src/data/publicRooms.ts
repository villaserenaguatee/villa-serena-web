import { useEffect, useState } from 'react';
import { leerTarifas, TARIFAS_EVENT, tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { publicRooms, type PublicRoom } from './publicRoomSeed';
export { publicRooms, type PublicRoom } from './publicRoomSeed';
export const money = (n: number) => `Q ${n.toLocaleString('en-US')}`;
function habitacionesConTarifas() {
  const tarifas = leerTarifas();
  return publicRooms.map(room => ({ ...room, price: tarifas[tipoPublicoATipoHotel(room.type)] }));
}
export function usePublicRooms() {
  const [rooms, setRooms] = useState<PublicRoom[]>(() => habitacionesConTarifas());
  useEffect(() => {
    const actualizar = () => setRooms(habitacionesConTarifas());
    window.addEventListener(TARIFAS_EVENT, actualizar);
    window.addEventListener('storage', actualizar);
    actualizar();
    return () => {
      window.removeEventListener(TARIFAS_EVENT, actualizar);
      window.removeEventListener('storage', actualizar);
    };
  },
    []);
  return rooms;
}
export function publicRoomForHotelType(tipo: string): PublicRoom {
  const tipoPublico = tipo === 'Standard' ? 'Estándar' : tipo === 'Suite Deluxe' ? 'Familiar' : tipo;
  return publicRooms.find(room => room.type === tipoPublico) ?? publicRooms[0];
}
