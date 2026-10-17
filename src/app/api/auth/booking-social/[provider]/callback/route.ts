import { NextRequest } from 'next/server';
import { callbackBookingSocial } from '@/lib/bff/bookingSocial';
export const runtime = 'nodejs';
export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  return callbackBookingSocial(request, (await context.params).provider);
}
