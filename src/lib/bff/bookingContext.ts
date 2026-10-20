import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import type { CreatedPublicDto } from './contracts/public';
const state = globalThis as typeof globalThis & { vsBookingContexts?: Map<string, { created: CreatedPublicDto; expires: number }> };
const contexts = () => state.vsBookingContexts ??= new Map();
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export const BOOKING_CONTEXT_COOKIE = 'vs_booking_context';
export function creationResponse(created: CreatedPublicDto, request: Request) {
  const token = randomBytes(32).toString('base64url');
  for (const [key, value] of contexts()) if (value.expires <= Date.now()) contexts().delete(key);
  contexts().set(hash(token), { created: structuredClone(created), expires: Date.now() + 7200000 });
  const response = NextResponse.json(created, { status: 201, headers: { 'Cache-Control': 'no-store', 'X-Villa-Serena-Mode': 'demo' } });
  response.cookies.set(BOOKING_CONTEXT_COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: new URL(request.url).protocol === 'https:', path: '/', maxAge: 7200 });
  return response;
}
export function creationContext(token: string, code: string) {
  if ((process.env.VILLA_SERENA_BFF_MODE ?? 'demo') !== 'demo') return null;
  const value = contexts().get(hash(token));
  return value && value.expires > Date.now() && value.created.codigo === code ? value.created : null;
}
