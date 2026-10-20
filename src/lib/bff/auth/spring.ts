import 'server-only';
import type { Employee, LoginInput, PasswordInput, StaffSession, Tokens } from '@/lib/auth/staff-contract';
import { AuthError } from './errors';
import { publicEmployee, serverSession, serverTokens } from './response';
export function createSpringAuth(baseUrl: string, request: typeof fetch = fetch) {
  const base = new URL(baseUrl);
  if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password || base.search || base.hash)
    throw new AuthError('CONFIGURACION_INVALIDA', 503, 'Revisa la configuración del API.');
  async function call<T>(path: string, method: string, input?: unknown, token?: string): Promise<T> {
    let response: Response;
    try { response = await request(new URL(`/api/v1/auth/${path}`, base), {
      method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json', ...(input ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(input ? { body: JSON.stringify(input) } : {}),
    }); } catch { throw new AuthError('API_NO_DISPONIBLE', 502, 'No se pudo contactar al API.'); }
    const payload = response.status === 204 ? null : await response.json().catch(() => null);
    if (!response.ok) throw new AuthError(payload?.codigo ?? 'ERROR_API', response.status, payload?.mensaje ?? 'No se pudo completar la petición.');
    return payload as T;
  }
  return {
    login: async (input: LoginInput) => serverSession(await call<StaffSession>('login', 'POST', input)),
    yo: async (token: string) => publicEmployee(await call<Employee>('yo', 'GET', undefined, token)),
    renew: async (refreshToken: string) => serverTokens(await call<Tokens>('renovar', 'POST', { refreshToken })),
    logout: (token: string, refreshToken: string) => call<void>('cerrar-sesion', 'POST', { refreshToken }, token),
    change: async (token: string, input: PasswordInput) => serverSession(await call<StaffSession>('cambiar-contrasena', 'POST', input, token)),
  };
}
