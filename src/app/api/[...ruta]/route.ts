import { NextRequest, NextResponse } from 'next/server';
import { withStaffSession, sameOrigin, authError, writeCookies } from '@/lib/bff/auth/http';
import { AuthError } from '@/lib/bff/auth/errors';
import { withoutSessionTokens } from '@/lib/bff/publicPayload';
export const runtime = 'nodejs';
// El webhook, el canal externo, el acceso móvil y las rutas auth nunca pasan por el proxy.
const permittedRoots = new Set(['publico', 'huespedes', 'reservas', 'habitaciones', 'room-service', 'limpieza', 'incidencias', 'cuentas', 'checkout', 'facturas', 'archivos', 'admin']);
async function proxy(request: NextRequest, context: { params: Promise<{ ruta: string[] }> }) {
  try {
    if (request.method !== 'GET') sameOrigin(request);
    const { ruta } = await context.params;
    if (!permittedRoots.has(ruta[0]) || (ruta[0] === 'admin' && ruta[1] === 'canal-simulado') || ruta.some(segment => !/^[a-zA-Z0-9_-]+$/.test(segment)))
      throw new AuthError('RUTA_NO_PERMITIDA', 403, 'Esta ruta no está disponible a través del BFF.');
    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer();
    const operation = async (token?: string) => {
      if ((process.env.STAFF_AUTH_MODE ?? 'demo') === 'demo')
        throw new AuthError('SIMULACION_NO_DISPONIBLE', 501, 'Esta operación no forma parte de la simulación de sesión.');
      if (!process.env.API_URL) throw new AuthError('CONFIGURACION_INVALIDA', 503, 'Configura API_URL en el servidor.');
      let response: Response;
      try { response = await fetch(new URL(`/api/v1/${ruta.map(encodeURIComponent).join('/')}${request.nextUrl.search}`, process.env.API_URL), {
        method: request.method, body, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
        headers: { Accept: 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(request.headers.get('content-type') ? { 'Content-Type': request.headers.get('content-type')! } : {}) },
      }); } catch { throw new AuthError('API_NO_DISPONIBLE', 502, 'No se pudo contactar al API.'); }
      if (response.status === 401) throw new AuthError('SESION_VENCIDA', 401, 'Tu sesión venció. Inicia sesión de nuevo.');
      if (response.status === 204) return new NextResponse(null, { status: 204 });
      const payload = await response.json().catch(() => null);
      return NextResponse.json(withoutSessionTokens(payload), { status: response.status, headers: { 'Cache-Control': 'no-store' } });
    };
    if (ruta[0] === 'publico') return operation();
    const result = await withStaffSession(request, (access, employee) => {
      if (ruta[0] === 'room-service' && employee.rol !== 'ROOM_SERVICE') throw new AuthError('ACCESO_DENEGADO', 403, 'Acceso denegado');
      if (ruta[0] === 'incidencias') {
        const report = request.method === 'POST' && ruta.length === 1;
        const maintenance = employee.rol === 'MANTENIMIENTO_LIMPIEZA' && ['MANTENIMIENTO', 'AMBAS'].includes(employee.area ?? '');
        if (report ? !['RECEPCION', 'MANTENIMIENTO_LIMPIEZA'].includes(employee.rol) : !maintenance && !(employee.rol === 'ADMIN' && request.method === 'GET'))
          throw new AuthError('ACCESO_DENEGADO', 403, 'Acceso denegado');
      }
      return operation(access);
    });
    if (result.response) return result.response;
    return result.rotated ? writeCookies(result.value, request, result.rotated) : result.value;
  } catch (error) { return authError(error); }
}
export const GET = proxy, POST = proxy, PUT = proxy, PATCH = proxy, DELETE = proxy;
