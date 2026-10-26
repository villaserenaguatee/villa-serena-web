import { useEffect, useState } from 'react';
import { publicRooms, type PublicRoom } from '@/data/publicRoomSeed';
import { tipoPublicoATipoHotel } from '@/store/tarifasStore';
import { getPublicCatalogWithMode, getPublicHotel, getPublicQuotes } from '@/lib/api/public';
import { publicSearchError } from '@/lib/publicStayValidation';
import type { HotelDto, QuoteDto, RoomTypeDto } from '@/lib/bff/contracts/public';

export type CatalogRoom = PublicRoom & { apiTypeId: number; illustrativePhotos?: boolean; pendingFeatures?:string[]; verifiedFeatures?:string[]; inventoryNote?:string; bookable?:boolean };
export function usePublicCatalog(enabled=true) {
  const [catalog, setCatalog] = useState<CatalogRoom[] | null>(null);
  const [error, setError] = useState('');
  const [connectedCatalog, setConnectedCatalog] = useState(false);
  useEffect(() => {
    if(!enabled)return;
    const controller = new AbortController();
    getPublicCatalogWithMode(controller.signal).then(result => {setConnectedCatalog(result.connected);setCatalog(result.data);}).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [enabled]);
  const rooms: CatalogRoom[] = catalog ?? [];
  return { rooms, connected: Boolean(connectedCatalog), loading: enabled && !catalog && !error, error };
}
export function usePublicHotel(enabled=true) {
  const [hotel, setHotel] = useState<HotelDto | null>(null);
  useEffect(() => {
    if(!enabled)return;
    const controller = new AbortController();
    getPublicHotel(controller.signal).then(setHotel).catch(() => { /* Conserva el diseño; sin sustituir una respuesta real. */ });
    return () => controller.abort();
  }, [enabled]);
  return hotel;
}
export function usePublicQuotes(arrival: string, departure: string, adults: number, children: number, capacity = 5) {
  const key = JSON.stringify([arrival, departure, adults, children, capacity]);
  const [result, setResult] = useState<{ key: string; quotes: (QuoteDto & {ofertaSlug?:string})[]; error: string } | null>(null);
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
