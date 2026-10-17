import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { readLimitedBody } from './readLimitedBody';
const COOKIE = 'vs_booking_email';
const headers = { 'Cache-Control': 'no-store', 'X-Villa-Serena-Mode': 'spring' };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function writeBookingEmailProof(response: NextResponse, request: Request, draft: string, receipt: string) {
  if (!uuid.test(draft) || !/^[A-Za-z0-9_-]{43}$/.test(receipt)) throw new Error('Invalid booking proof');
  const hostname = new URL(request.url).hostname;
  response.cookies.set(COOKIE, draft + '.' + receipt, { httpOnly: true, sameSite: 'lax', path: '/', secure: !['localhost', '127.0.0.1', '[::1]'].includes(hostname), maxAge: 1800 });
}
export function bookingEmailProof(request: Request, draft: string): string {
  const value = request.headers.get('cookie')?.split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='))?.slice(COOKIE.length + 1) || '';
  const [savedDraft, proof] = value.split('.');
  return uuid.test(draft) && savedDraft === draft && /^[A-Za-z0-9_-]{43}$/.test(proof || '') ? proof : '';
}
export async function bookingEmailRoute(request: NextRequest, action: string) {
  if (request.headers.get('origin') !== request.nextUrl.origin) return NextResponse.json({ codigo: 'ORIGIN_NO_PERMITIDO' }, { status: 403, headers });
  if (!['solicitar', 'verificar', 'estado', 'actualizar'].includes(action)) return NextResponse.json({ codigo: 'RUTA_NO_ENCONTRADA' }, { status: 404, headers });
  try {
    const input = JSON.parse(await readLimitedBody(request, 2048));
    if (!input || typeof input.correo !== 'string' || input.correo.trim().length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.correo.trim()) || typeof input.borrador !== 'string' || !uuid.test(input.borrador) || (input.nombre !== undefined && (typeof input.nombre !== 'string' || input.nombre.length > 150)) || (action === 'verificar' && (typeof input.codigo !== 'string' || !/^\d{6}$/.test(input.codigo)))) return NextResponse.json({ codigo: 'DATOS_INVALIDOS' }, { status: 400, headers });
    if (process.env.VILLA_SERENA_BFF_MODE !== 'api' || !process.env.API_URL) return NextResponse.json({ codigo: 'API_NO_DISPONIBLE' }, { status: 503, headers });
    if(action==='actualizar' && (typeof input.anterior!=='string' || input.anterior.length>150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.anterior.trim()))) return NextResponse.json({codigo:'DATOS_INVALIDOS'},{status:400,headers});
    const proof = bookingEmailProof(request, input.borrador);
    const upstream = await fetch(new URL('/api/v1/publico/correo/' + action, process.env.API_URL), { method: 'POST', cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'Content-Type': 'application/json', 'X-Booking-Email-Verification': proof }, body: JSON.stringify({ correo: input.correo.trim(), borrador: input.borrador, ...(action === 'verificar' ? { codigo: input.codigo } : action==='actualizar'?{anterior:input.anterior.trim()}:{ nombre: input.nombre || '' }) }) });
    const payload = await upstream.json();
    const receipt = action === 'verificar' && upstream.ok ? payload.comprobante : '';
    if (action === 'verificar' && upstream.ok && (typeof receipt !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(receipt))) throw new Error('invalid');
    delete payload.comprobante;
    const response = NextResponse.json(payload, { status: upstream.status, headers });
    const cookie = { httpOnly: true, sameSite: 'lax' as const, path: '/', secure: !['localhost', '127.0.0.1', '[::1]'].includes(request.nextUrl.hostname) };
    if (receipt) writeBookingEmailProof(response, request, input.borrador, receipt);
    else if (upstream.ok && (action === 'solicitar' || (action==='actualizar' && payload.cambiado))) response.cookies.set(COOKIE, '', { ...cookie, maxAge: 0 });
    if (upstream.headers.has('Retry-After')) response.headers.set('Retry-After', upstream.headers.get('Retry-After')!);
    return response;
  } catch { return NextResponse.json({ codigo: 'VERIFICACION_NO_DISPONIBLE', mensaje: 'No se pudo completar la verificación. Conservamos tus datos; vuelve a intentarlo.' }, { status: 502, headers }); }
}
