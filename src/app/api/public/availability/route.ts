import { AvailabilityError, parseAvailability, queryAvailability } from '@/lib/bff/publicAvailability';
import { mergeBookingHolds, storedHolds } from '@/lib/bff/demoBookingStore';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('Origin');
    if ((origin && origin !== new URL(request.url).origin) || request.headers.get('Sec-Fetch-Site') === 'cross-site') {
      throw new AvailabilityError('ORIGIN_FORBIDDEN', 403);
    }
    if (!request.body) throw new AvailabilityError('INVALID_JSON', 400);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 2 * 1024 * 1024) { await reader.cancel(); throw new AvailabilityError('REQUEST_TOO_LARGE', 413); }
      chunks.push(value);
    }
    let body: unknown;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new AvailabilityError('INVALID_JSON', 400); }
    const input = parseAvailability(body);
    if ((process.env.VILLA_SERENA_BFF_MODE ?? 'demo') === 'demo') input.demo.holds = mergeBookingHolds(input.demo.holds, storedHolds());
    return Response.json(queryAvailability(input), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return Response.json({ error: { code: error instanceof AvailabilityError ? error.code : 'AVAILABILITY_UNAVAILABLE' } },
      { status: error instanceof AvailabilityError ? error.status : 500, headers: { 'Cache-Control': 'no-store' } });
  }
}
