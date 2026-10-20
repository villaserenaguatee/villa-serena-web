import { NextRequest, NextResponse } from 'next/server';
import { withStaffSession, writeCookies } from '@/lib/bff/auth/http';
export const runtime = 'nodejs';
// El render del servidor no puede escribir cookies; este handler completa la renovación.
export async function GET(request: NextRequest) {
  const next = request.nextUrl.searchParams.get('next') ?? '/panel';
  const allowed = /^\/(panel|admin|recepcion|room-service|limpieza|mantenimiento)(\/|$)/.test(next) && !next.includes('\\');
  const result = await withStaffSession(request, async (_, employee) => employee, true);
  if (result.response) {
    if (result.response.status !== 401) return result.response;
    return writeCookies(NextResponse.redirect(new URL('/panel/login', request.url)), request);
  }
  const target = result.value.debeCambiarContrasena ? '/panel/cambiar-contrasena' : allowed ? next : '/panel';
  const response = NextResponse.redirect(new URL(target, request.url));
  return result.rotated ? writeCookies(response, request, result.rotated) : response;
}
