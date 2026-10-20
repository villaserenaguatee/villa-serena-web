import { NextRequest, NextResponse } from 'next/server';
import { runtimeModeAllowed } from '@/lib/runtimeMode';
const staffRoots = ['/panel', '/admin', '/recepcion', '/room-service', '/limpieza', '/mantenimiento'];
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!runtimeModeAllowed({environment:process.env.NODE_ENV,hostname:request.nextUrl.hostname,
    staffMode:process.env.STAFF_AUTH_MODE,guestMode:process.env.GUEST_AUTH_MODE,
    bffMode:process.env.VILLA_SERENA_BFF_MODE,apiUrl:process.env.API_URL})) {
    const message = 'No se pudo conectar con el servicio. Intenta nuevamente más tarde.';
    return path.startsWith('/api/')
      ? NextResponse.json({codigo:'CONFIGURACION_INVALIDA',mensaje:message,detalles:[]},{status:503,headers:{'Cache-Control':'no-store'}})
      : new NextResponse(message,{status:503,headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
  }
  if (path.startsWith('/api/') && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method) && request.headers.get('origin') !== request.nextUrl.origin)
    return NextResponse.json({ codigo: 'ORIGIN_NO_PERMITIDO', mensaje: 'Origen de la petición no permitido.', detalles: [] }, { status: 403 });
  const headers = new Headers(request.headers);
  headers.delete('x-staff-path');
  if (staffRoots.some(root => path === root || path.startsWith(root + '/'))) {
    headers.set('x-staff-path', path);
    if (path !== '/panel/login' && !request.cookies.get('vs_staff_access')?.value && !request.cookies.get('vs_staff_refresh')?.value)
      return NextResponse.redirect(new URL('/panel/login', request.url));
  }
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ['/api/:path*', '/portal/:path*', '/panel/:path*', '/admin/:path*', '/recepcion/:path*', '/room-service/:path*', '/limpieza/:path*', '/mantenimiento/:path*'] };
