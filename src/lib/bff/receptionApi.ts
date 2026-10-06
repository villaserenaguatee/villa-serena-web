import 'server-only';
import type { components } from '@/lib/api/schema';

type Schema = components['schemas'];
export class ReceptionApiError extends Error {
  constructor(public code: string, public status: number, message: string) { super(message); }
}
// El BFF de sesión (#4) debe proporcionar el token del servidor. No acepta tokens del navegador.
export function createReceptionApi(baseUrl: string, accessToken: string, request: typeof fetch = fetch) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Revisa la URL del API.');
  if (!accessToken) throw new ReceptionApiError('SESSION_NOT_READY', 503, 'La sesión del personal está pendiente de conexión.');
  async function call<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
    let response: Response;
    try {
      response = await request(new URL(path, base), {
        method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json', ...(body ? { 'Content-Type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
    } catch {
      // Nunca repetir una creación o check-in tras un resultado incierto.
      throw new ReceptionApiError('API_UNAVAILABLE', 502, 'No se pudo consultar el API. Revisa el resultado antes de repetir la operación.');
    }
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const error = payload && typeof payload === 'object' ? payload as Record<string, unknown> : {};
      throw new ReceptionApiError(typeof error.codigo === 'string' ? error.codigo : 'API_ERROR', response.status,
        typeof error.mensaje === 'string' ? error.mensaje : 'No se pudo completar la operación en el API.');
    }
    if (!payload || typeof payload !== 'object') throw new ReceptionApiError('INVALID_API_RESPONSE', 502, 'El API devolvió una respuesta incompleta.');
    return payload as T;
  }
  const query = (values: Record<string, string | number>) => new URLSearchParams(Object.entries(values).map(([key, value]) => [key, String(value)]));
  return {
    calendar: (from: string, to: string) => call<Schema['CalendarioReservas']>(`/api/v1/reservas/calendario?${query({ desde: from, hasta: to })}`),
    guests: (search: string) => call<Schema['Huesped'][]>(`/api/v1/huespedes?${query({ q: search })}`),
    registerGuest: (input: Schema['HuespedDatos']) => call<Schema['RegistroHuespedRespuesta']>('/api/v1/huespedes', 'POST', input),
    availability: (arrival: string, departure: string, guests: number) => call<Schema['OpcionDisponibleRecepcion'][]>(`/api/v1/reservas/disponibilidad?${query({ entrada: arrival, salida: departure, huespedes: guests })}`),
    createReservation: (input: Schema['ReservaRecepcionPeticion']) => call<Schema['ReservaDetalle']>('/api/v1/reservas', 'POST', input),
    detail: (code: string) => call<Schema['ReservaDetalle']>(`/api/v1/reservas/${encodeURIComponent(code)}`),
    addGuest: (code: string, input: Schema['HuespedAdicionalDatos']) => call<Schema['HuespedAdicional']>(`/api/v1/reservas/${encodeURIComponent(code)}/huespedes-adicionales`, 'POST', input),
    checkIn: (code: string) => call<Schema['ReservaDetalle']>(`/api/v1/reservas/${encodeURIComponent(code)}/check-in`, 'POST'),
  };
}
