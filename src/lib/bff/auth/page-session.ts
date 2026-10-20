import 'server-only';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authProvider } from './provider';
import { isAuthError } from './errors';
import { ACCESS_COOKIE, REFRESH_COOKIE } from './http';
export async function requireStaff() {
  const jar = await cookies(), path = (await headers()).get('x-staff-path') ?? '/panel';
  try {
    const employee = await authProvider().yo(jar.get(ACCESS_COOKIE)?.value ?? '');
    if (employee.debeCambiarContrasena && path !== '/panel/cambiar-contrasena') redirect('/panel/cambiar-contrasena');
    return employee;
  } catch (error) {
    if (!isAuthError(error)) throw error;
    if (error.status !== 401) throw error;
    if (jar.get(REFRESH_COOKIE)?.value) redirect(`/api/auth/continuar?next=${encodeURIComponent(path)}`);
    redirect('/panel/login');
  }
}
