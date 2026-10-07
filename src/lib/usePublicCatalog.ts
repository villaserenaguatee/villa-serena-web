import { useEffect, useState } from 'react';
import { publicRooms, type PublicRoom } from '@/data/publicRoomSeed';
import { tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { getPublicCatalog, getPublicHotel, getPublicQuotes } from '@/lib/api/public';
import { publicSearchError } from '@/lib/publicStayValidation';
import type { HotelDto, QuoteDto, RoomTypeDto } from '@/lib/bff/contracts/public';

export type CatalogRoom = PublicRoom & { apiTypeId: number };
export function usePublicCatalog() {
  const [catalog, setCatalog] = useState<RoomTypeDto[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    getPublicCatalog(controller.signal).then(setCatalog).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, []);
  const rooms: CatalogRoom[] = catalog ? publicRooms.flatMap(offer => {
    const type = catalog.find(t => t.nombre === tipoPublicoATipoHotel(offer.type));
    return type ? [{ ...offer, price: type.precioBaseNoche, capacity: Math.min(offer.capacity, type.capacidad), apiTypeId: type.id }] : [];
  }) : [];
  return { rooms, loading: !catalog && !error, error };
}
export function usePublicHotel() {
  const [hotel, setHotel] = useState<HotelDto | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getPublicHotel(controller.signal).then(setHotel).catch(() => { /* Conserva el diseño; sin sustituir una respuesta real. */ });
    return () => controller.abort();
  }, []);
  return hotel;
}
export function usePublicQuotes(arrival: string, departure: string, adults: number, children: number, capacity = 5) {
  const key = JSON.stringify([arrival, departure, adults, children, capacity]);
  const [result, setResult] = useState<{ key: string; quotes: QuoteDto[]; error: string } | null>(null);
  const validation = publicSearchError(arrival, departure, adults, children, capacity);
  useEffect(() => {
    if (validation) return;
    const controller = new AbortController();
    getPublicQuotes(arrival, departure, adults + children, controller.signal).then(quotes => setResult({ key, quotes, error: '' }))
      .catch(e => { if (!controller.signal.aborted) setResult({ key, quotes: [], error: e.message }); });
    return () => controller.abort();
  }, [arrival, departure, adults, children, key, validation]);
  return { quotes: result?.key === key && !validation ? result.quotes : [], loading: !validation && result?.key !== key,
    error: validation ?? (result?.key === key ? result.error : '') };
}
