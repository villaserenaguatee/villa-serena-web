import { getRooms } from '@/lib/api/reception';
import { conditionLabels } from '@/lib/receptionPresentation';
import type { RoomState } from '@/lib/bff/contracts/reception';

// La copia local identifica habitaciones por número; el BFF mantiene su ID propio.
// Nunca confiar en la condición antigua del navegador ni continuar si falla el BFF.
export async function requireReadyCheckInRoom(number: string, load: () => Promise<RoomState[]> = getRooms): Promise<void> {
  const room = (await load()).find(r => r.numero === number);
  if (!room) throw new Error('No se encontró la habitación asignada en Habitaciones.');
  if (room.ocupacion !== 'LIBRE' || room.condicion !== 'LIMPIA') {
    throw new Error(`La habitación ${number} no está libre y limpia: ${room.ocupacion === 'OCUPADA' ? 'ocupada' : 'libre'} y ${conditionLabels[room.condicion]?.toLocaleLowerCase('es') ?? 'condición desconocida'}.`);
  }
}
