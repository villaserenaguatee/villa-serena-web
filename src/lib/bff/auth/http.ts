import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { authProvider } from './provider';
import { AuthError, expired, isAuthError } from './errors';
import type { Employee, Tokens } from '@/lib/auth/staff-contract';
import { publicEmployee } from './response';
export const ACCESS_COOKIE = 'vs_staff_access', REFRESH_COOKIE = 'vs_staff_refresh';
export function sameOrigin(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin)
    throw new AuthError('ORIGIN_NO_PERMITIDO', 403, 'Origen de la petición no permitido.');
}
export function authError(error: unknown) {
  const known = isAuthError(error) ? error : new AuthError('ERROR_SESION', 502, 'No se pudo completar la sesión.');
  return NextResponse.json({ codigo: known.codigo, mensaje: known.message, detalles: [] }, { status: known.status, headers: { 'Cache-Control': 'no-store' } });
}
export function writeCookies(response: NextResponse, request: Request, tokens?: Tokens) {
  const hostname = new URL(request.url).hostname;
  const options = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: !['localhost', '127.0.0.1', '[::1]'].includes(hostname) };
  response.cookies.set(ACCESS_COOKIE, tokens?.accessToken ?? '', { ...options, maxAge: tokens?.expiraEn ?? 0 });
  response.cookies.set(REFRESH_COOKIE, tokens?.refreshToken ?? '', { ...options, maxAge: tokens ? 7 * 86400 : 0 });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
export async function readAuthJson(request: Request, fields: string[]): Promise<Record<string, string>> {
  const raw = await request.text();
  if (raw.length > 16384) throw new AuthError('DATOS_INVALIDOS', 400, 'Los datos son demasiado largos.');
  let value: Record<string, string>;
  try { value = JSON.parse(raw); } catch { throw new AuthError('DATOS_INVALIDOS', 400, 'Envía datos JSON válidos.'); }
  if (!value || typeof value !== 'object' || fields.some(key => typeof value[key] !== 'string' || !value[key] || value[key].length > 256))
    throw new AuthError('DATOS_INVALIDOS', 400, 'Completa los campos requeridos.');
  return value;
}
// Un solo intento de renovación por petición. Los tokens nunca forman parte del JSON público.
export async function withStaffSession<T>(request: NextRequest, operation: (access: string, employee: Employee, refresh: string) => Promise<T>, allowTemporary = false) {
  const provider = authProvider();
  let access = request.cookies.get(ACCESS_COOKIE)?.value ?? '';
  let refresh = request.cookies.get(REFRESH_COOKIE)?.value ?? '';
  let rotated: Tokens | undefined;
  let renewed = false;
  async function renew() {
    if (renewed || !refresh) throw expired();
    renewed = true;
    try { rotated = await provider.renew(refresh); } catch { throw expired(); }
    access = rotated.accessToken; refresh = rotated.refreshToken;
  }
  async function run() {
    if (!access) throw expired();
    const employee = await provider.yo(access);
    if (!allowTemporary && employee.debeCambiarContrasena)
      throw new AuthError('CONTRASENA_TEMPORAL', 403, 'Debes cambiar tu contraseña temporal.');
    return operation(access, employee, refresh);
  }
  try {
    let value: T;
    try { value = await run(); }
    catch (error) { if (!isAuthError(error) || error.status !== 401) throw error; await renew(); value = await run(); }
    return { value, rotated };
  } catch (error) {
    // Si se rotó antes de un 400/403, hay que devolver las cookies nuevas igualmente.
    const response = authError(error);
    if (response.status === 401) writeCookies(response, request);
    else if (rotated) writeCookies(response, request, rotated);
    return { response };
  }
}
export async function authRoute(request: NextRequest, action: 'login' | 'yo' | 'change' | 'logout') {
  try {
    if (request.method !== 'GET') sameOrigin(request);
    const provider = authProvider();
    if (action === 'login') {
      const input = await readAuthJson(request, ['correo', 'contrasena']);
      const session = await provider.login({ correo: input.correo, contrasena: input.contrasena });
      return writeCookies(NextResponse.json(publicEmployee(session.empleado)), request, session);
    }
    const input = action === 'change' ? await readAuthJson(request, ['contrasenaActual', 'contrasenaNueva', 'confirmacion']) : undefined;
    const result = await withStaffSession(request, async (access, employee, refresh) => {
      if (action === 'yo') return { employee };
      if (action === 'logout') { await provider.logout(access, refresh); return {}; }
      const session = await provider.change(access, { contrasenaActual: input!.contrasenaActual, contrasenaNueva: input!.contrasenaNueva, confirmacion: input!.confirmacion });
      return { employee: session.empleado, tokens: session };
    }, true);
    if (result.response) {
      if (action === 'logout' && result.response.status === 401) return writeCookies(new NextResponse(null, { status: 204 }), request);
      return result.response;
    }
    if (action === 'logout') return writeCookies(new NextResponse(null, { status: 204 }), request);
    const response = NextResponse.json(publicEmployee(result.value.employee), { headers: { 'Cache-Control': 'no-store' } });
    const tokens = 'tokens' in result.value ? result.value.tokens : result.rotated;
    return tokens ? writeCookies(response, request, tokens) : response;
  } catch (error) { return authError(error); }
}
