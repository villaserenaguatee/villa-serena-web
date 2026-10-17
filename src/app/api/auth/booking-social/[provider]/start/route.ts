import { NextRequest } from 'next/server';
import { startBookingSocial } from '@/lib/bff/bookingSocial';
export const runtime = 'nodejs';
export async function POST(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  return startBookingSocial(request, (await context.params).provider);
}
