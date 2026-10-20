import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { sameOrigin, withStaffSession, writeCookies, authError } from './http';
import { AuthError } from './errors';

export async function wsTicketRoute(request: NextRequest) {
  try {
    sameOrigin(request);
    const session = await withStaffSession(request, async access => {
      if (process.env.STAFF_AUTH_MODE !== 'spring' || !process.env.API_URL)
        throw new AuthError('TIEMPO_REAL_NO_DISPONIBLE', 503, 'El tiempo real requiere conexión al API.');
      let response: Response;
      try {
        response = await fetch(new URL('/api/v1/auth/ws-ticket', process.env.API_URL), {
          method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
          headers: { Authorization: `Bearer ${access}`, Accept: 'application/json' },
        });
      } catch { throw new AuthError('API_NO_DISPONIBLE', 502, 'No se pudo contactar al API.'); }
      if (!response.ok) throw new AuthError('ERROR_TICKET', response.status, response.status === 401 ? 'Tu sesión venció.' : 'No se pudo obtener el ticket de tiempo real.');
      const value = await response.json().catch(() => null);
      const expires = Date.parse(value?.expiraEn);
      if (typeof value?.ticket !== 'string' || !value.ticket || !Number.isFinite(expires) || expires <= Date.now() || expires > Date.now() + 65000)
        throw new AuthError('RESPUESTA_INVALIDA', 502, 'El API devolvió un ticket inválido.');
      // Lista explícita: ni JWT ni campos adicionales llegan al navegador.
      return { ticket: value.ticket, expiraEn: value.expiraEn as string };
    });
    if (session.response) return session.response;
    const response = NextResponse.json(session.value, { headers: { 'Cache-Control': 'no-store' } });
    return session.rotated ? writeCookies(response, request, session.rotated) : response;
  } catch (error) { return authError(error); }
}
