import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin, withStaffSession, writeCookies, authError } from './auth/http';
import { AuthError } from './auth/errors';
import { withoutSessionTokens } from './publicPayload';
import { availableReceptionRooms, assignReceptionRoom, cancelReceptionReservation, markReceptionRoomDirty, previewReceptionCancellation, receptionDetail, receptionRooms, searchReceptionReservations, ReceptionDemoError } from './receptionDemo';
import { createReceptionReservation, registerReceptionGuest, receptionCalendar, receptionAvailability } from './receptionDemo';

async function jsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  const reader = request.body?.getReader();
  if (!reader) throw new AuthError('DATOS_INVALIDOS', 400, 'Completa los datos de la operación.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) {
    const { done, value } = await reader.read(); if (done) break;
    size += value.length;
    if (size > 16384) { await reader.cancel(); throw new AuthError('DATOS_INVALIDOS', 400, 'Los datos son demasiado largos.'); }
    chunks.push(value);
  }
  let input;
  try { input = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new AuthError('DATOS_INVALIDOS', 400, 'Envía datos JSON válidos.'); }
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new AuthError('DATOS_INVALIDOS', 400, 'Envía los datos de la operación.');
  return input;
}
export async function receptionRoute(request: NextRequest, root: 'reservas' | 'habitaciones' | 'huespedes') {
  try {
    if (request.method !== 'GET') sameOrigin(request);
    let roomsBody: string | undefined;
    let status = 200;
    const session = await withStaffSession(request, async (_access, employee) => {
      if (employee.rol !== 'RECEPCION') throw new AuthError('ACCESO_DENEGADO', 403, 'Acceso denegado');
      if (process.env.STAFF_AUTH_MODE === 'spring' && root === 'habitaciones') {
        const suffix = request.nextUrl.pathname.slice('/api/habitaciones'.length);
        if (!(request.method === 'GET' && (!suffix || suffix === '/')) && !(request.method === 'POST' && /^\/\d+\/marcar-sucia$/.test(suffix)))
          throw new AuthError('RUTA_NO_ENCONTRADA', 404, 'Esta operación aún no está conectada.');
        if (request.method === 'POST' && (roomsBody ??= await request.text()).length) throw new AuthError('DATOS_INVALIDOS', 400, 'Marcar sucia no admite cuerpo.');
        let response: Response;
        try { response = await fetch(new URL(`/api/v1/habitaciones${suffix}${request.nextUrl.search}`, process.env.API_URL), { method: request.method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${_access}`, Accept: 'application/json' } }); }
        catch { throw new AuthError('API_NO_DISPONIBLE', 502, 'No se pudo consultar el API.'); }
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new AuthError('ERROR_HABITACIONES', response.status, 'No se pudo completar la operación de habitaciones.');
        if (!payload || typeof payload !== 'object') throw new AuthError('RESPUESTA_INVALIDA', 502, 'El API devolvió una respuesta incompleta.');
        return withoutSessionTokens(payload);
      }
      if ((process.env.VILLA_SERENA_BFF_MODE ?? 'demo') !== 'demo') throw new AuthError('API_NOT_READY', 503, 'La conexión real está pendiente. No se usarán datos de prueba en modo conectado.');
      const parts = request.nextUrl.pathname.slice(`/api/${root}`.length).split('/').filter(Boolean).map(decodeURIComponent), query = request.nextUrl.searchParams;
      try {
        if (root === 'huespedes' && !parts.length && request.method === 'POST') {
          const result = registerReceptionGuest(await jsonBody(request));
          status = result.yaExistia ? 200 : 201;
          return result;
        }
        if (root === 'reservas') {
          if (!parts.length && request.method === 'GET') return searchReceptionReservations(query);
          if (!parts.length && request.method === 'POST') {
            const result = createReceptionReservation(await jsonBody(request), employee.nombre);
            status = 201; return result;
          }
          if (parts.length === 1 && parts[0] === 'calendario' && request.method === 'GET') return receptionCalendar(query);
          if (parts.length === 1 && parts[0] === 'disponibilidad' && request.method === 'GET') return receptionAvailability(query);
          if (parts.length && !/^VS-[A-Z0-9]{6}$/.test(parts[0])) throw new AuthError('DATOS_INVALIDOS', 400, 'El código de reserva no es válido.');
          if (parts.length === 1 && request.method === 'GET') return receptionDetail(parts[0]);
          if (parts.length === 2 && parts[1] === 'cancelacion' && request.method === 'GET') return previewReceptionCancellation(parts[0]);
          if (parts.length === 2 && parts[1] === 'cancelar' && request.method === 'POST') {
            const body = await jsonBody(request);
            if (Object.keys(body).some(k => k !== 'motivo')) throw new AuthError('DATOS_INVALIDOS', 400, 'Envía únicamente el motivo de cancelación.');
            return cancelReceptionReservation(parts[0], body.motivo, employee.nombre);
          }
          if (parts.length === 2 && parts[1] === 'habitacion' && request.method === 'PUT') {
            const body = await jsonBody(request);
            if (Object.keys(body).some(k => k !== 'habitacionId')) throw new AuthError('DATOS_INVALIDOS', 400, 'Envía únicamente la habitación seleccionada.');
            return assignReceptionRoom(parts[0], body.habitacionId, employee.nombre);
          }
        } else if (root === 'habitaciones') {
          if (!parts.length && request.method === 'GET') return receptionRooms(query);
          if (parts.length === 1 && parts[0] === 'disponibles' && request.method === 'GET') return availableReceptionRooms(query);
          if (parts.length === 2 && /^\d+$/.test(parts[0]) && parts[1] === 'marcar-sucia' && request.method === 'POST') {
            if ((await request.text()).length) throw new AuthError('DATOS_INVALIDOS', 400, 'Marcar sucia no admite cuerpo ni otros cambios de estado.');
            return markReceptionRoomDirty(Number(parts[0]), employee.nombre);
          }
        }
        throw new AuthError('RUTA_NO_ENCONTRADA', 404, 'Esta operación no forma parte del BFF de este Issue.');
      } catch (e) {
        if (e instanceof ReceptionDemoError) throw new AuthError(e.codigo, e.status, e.message);
        throw e;
      }
    });
    if (session.response) return session.response;
    const response = NextResponse.json(session.value, { status, headers: { 'Cache-Control': 'no-store', 'X-Villa-Serena-Mode': process.env.STAFF_AUTH_MODE === 'spring' && root === 'habitaciones' ? 'spring' : 'demo' } });
    return session.rotated ? writeCookies(response, request, session.rotated) : response;
  } catch (e) { return authError(e); }
}
