import type { Huesped, Reserva } from '@/lib/pms/types';

const LEGACY_KEY = 'vs-portal-recepcion';
const RESERVAS_KEY = 'vs-reservas';
const HUESPEDES_KEY = 'vs-huespedes';

function readArray<T>(key: string, fallback: T[]): T[] {
  const raw = localStorage.getItem(key);
  if (raw === null)
    return fallback;
  const parsed: unknown = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed as T[] : fallback;
}

function mergeGuests(canonical: Huesped[], legacy: Huesped[]) {
  const merged = [...canonical];
  const legacyIdMap = new Map<string, string>();

  for (const guest of legacy) {
    const existing = merged.find(item =>
      item.id === guest.id ||
      (Boolean(guest.documento) &&
        item.tipoDocumento === guest.tipoDocumento &&
        item.documento === guest.documento),
    );
    if (existing) {
      legacyIdMap.set(guest.id, existing.id);
      const index = merged.indexOf(existing);
      merged[index] = { ...guest, ...existing };
    }
    else {
      legacyIdMap.set(guest.id, guest.id);
      merged.push(guest);
    }
  }

  return { guests: merged, legacyIdMap };
}

function mergeReservations(canonical: Reserva[], legacy: Reserva[], guestIds: Map<string, string>) {
  const merged = [...canonical];

  for (const reservation of legacy) {
    const linked = {
      ...reservation,
      huespedId: guestIds.get(reservation.huespedId) || reservation.huespedId,
    };
    const index = merged.findIndex(item => item.id === linked.id || item.codigo === linked.codigo);
    if (index < 0)
      merged.push(linked);
    else
      merged[index] = {
        ...linked,
        ...merged[index],
        huespedId: guestIds.get(merged[index].huespedId) || merged[index].huespedId,
      };
  }

  return merged;
}

export function migrateLegacyPortalReceptionData() {
  if (typeof window === 'undefined')
    return;

  const legacyRaw = localStorage.getItem(LEGACY_KEY);
  if (legacyRaw === null)
    return;

  const legacy: unknown = JSON.parse(legacyRaw);
  if (!legacy || typeof legacy !== 'object')
    throw new Error(`No se pudo migrar ${LEGACY_KEY}: formato inválido.`);
  const data = legacy as Partial<{ huespedes: Huesped[]; reservas: Reserva[] }>;
  if (!Array.isArray(data.huespedes) || !Array.isArray(data.reservas))
    throw new Error(`No se pudo migrar ${LEGACY_KEY}: faltan las listas de huéspedes o reservas.`);

  const canonicalGuests = readArray<Huesped>(HUESPEDES_KEY, []);
  const canonicalReservations = readArray<Reserva>(RESERVAS_KEY, []);
  const { guests, legacyIdMap } = mergeGuests(canonicalGuests, data.huespedes);
  for (const guest of canonicalGuests) {
    const canonical = guests.find(item =>
      item.id === guest.id ||
      (Boolean(guest.documento) &&
        item.tipoDocumento === guest.tipoDocumento &&
        item.documento === guest.documento),
    );
    if (canonical)
      legacyIdMap.set(guest.id, canonical.id);
  }
  const reservations = mergeReservations(canonicalReservations, data.reservas, legacyIdMap);

  localStorage.setItem(HUESPEDES_KEY, JSON.stringify(guests));
  localStorage.setItem(RESERVAS_KEY, JSON.stringify(reservations));
  localStorage.removeItem(LEGACY_KEY);
  window.dispatchEvent(new Event('vs-huespedes-updated'));
  window.dispatchEvent(new Event('vs-reservas-updated'));
}
