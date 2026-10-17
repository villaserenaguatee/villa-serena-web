import { NextRequest, NextResponse } from 'next/server';
import { withStaffSession, ACCESS_COOKIE, REFRESH_COOKIE, writeCookies } from '@/lib/bff/auth/http';
import { guestRoute, GUEST_COOKIE, REFRESH_COOKIE as GUEST_REFRESH } from '@/lib/bff/guestAccess';
export const runtime = 'nodejs';
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const exp = request.nextUrl.searchParams.get('exp') ?? '', firma = request.nextUrl.searchParams.get('firma') ?? '';
  if (!/^[a-f0-9-]{36}$/.test(id) || !/^\d{10,12}$/.test(exp) || !/^[a-f0-9]{64}$/.test(firma)) return NextResponse.json({ mensaje: 'El enlace no es válido.' }, { status: 403 });
  if (!process.env.API_URL) return NextResponse.json({ mensaje: 'API no disponible.' }, { status: 503 });
  let access = '', session: NextResponse | undefined;
  if (request.cookies.get(ACCESS_COOKIE) || request.cookies.get(REFRESH_COOKIE)) {
    const staff = await withStaffSession(request, async token => token);
    if (staff.response) return staff.response;
    access = staff.value; session = new NextResponse();
    if (staff.rotated) writeCookies(session, request, staff.rotated);
  } else if (request.cookies.get(GUEST_COOKIE) || request.cookies.get(GUEST_REFRESH)) {
    session = await guestRoute(request, ['reservas']);
    if (!session.ok) return session;
    access = session.cookies.get(GUEST_COOKIE)?.value ?? request.cookies.get(GUEST_COOKIE)?.value ?? '';
  } else return NextResponse.json({ mensaje: 'Debes iniciar sesión.' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const apply = (response: NextResponse) => { if (session) for (const c of session.cookies.getAll()) response.cookies.set(c); return response; };
  try {
    const r = await fetch(new URL(`/api/v1/archivos/lectura/${id}?exp=${exp}&firma=${firma}`, process.env.API_URL), { headers: { Authorization: `Bearer ${access}` }, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
    if (!r.ok) return apply(NextResponse.json({ mensaje: r.status === 403 ? 'El enlace venció o no es válido. Solicita uno nuevo.' : 'No se pudo consultar el archivo.' }, { status: r.status }));
    return apply(new NextResponse(await r.arrayBuffer(), { headers: { 'Content-Type': r.headers.get('content-type') ?? 'application/octet-stream', 'Content-Disposition': r.headers.get('content-disposition') ?? 'attachment', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "sandbox; default-src 'none'" } }));
  } catch { return apply(NextResponse.json({ mensaje: 'No se pudo consultar el archivo.' }, { status: 502 })); }
}
