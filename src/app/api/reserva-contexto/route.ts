import { NextRequest, NextResponse } from 'next/server';
import { BOOKING_CONTEXT_COOKIE, creationContext } from '@/lib/bff/bookingContext';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  const value = creationContext(request.cookies.get(BOOKING_CONTEXT_COOKIE)?.value ?? '', request.nextUrl.searchParams.get('codigo') ?? '');
  return NextResponse.json(value ?? { mensaje: 'El contexto de esta reserva no está disponible. Verifica tu correo para consultar tu reserva.' }, { status: value ? 200 : 401, headers: { 'Cache-Control': 'no-store' } });
}
