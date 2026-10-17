import { NextRequest } from 'next/server';
import { bookingEmailRoute } from '@/lib/bff/bookingEmailVerification';
export const runtime = 'nodejs';
export async function POST(request: NextRequest, context: { params: Promise<{ accion: string }> }) {
  return bookingEmailRoute(request, (await context.params).accion);
}
