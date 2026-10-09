import { NextRequest } from 'next/server';
import { guestRoute } from '@/lib/bff/guestAccess';
export const runtime = 'nodejs';
async function handler(request: NextRequest, context: { params: Promise<{ ruta: string[] }> }) {
  return guestRoute(request, (await context.params).ruta);
}
export const GET = handler;
export const POST = handler;
