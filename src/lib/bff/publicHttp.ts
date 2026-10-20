import 'server-only';
import { AvailabilityError } from './publicAvailability';
export function assertSameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
    throw new AvailabilityError('ORIGIN_FORBIDDEN', 403);
  }
}
export async function readPublicJson(request: Request): Promise<unknown> {
  if (!request.body) throw new AvailabilityError('INVALID_JSON', 400);
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new AvailabilityError('REQUEST_TOO_LARGE', 413); }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw new AvailabilityError('INVALID_JSON', 400); }
}
export function publicError(error: unknown) {
  return Response.json({ error: { code: error instanceof AvailabilityError ? error.code : 'BOOKING_UNAVAILABLE' } },
    { status: error instanceof AvailabilityError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
}
