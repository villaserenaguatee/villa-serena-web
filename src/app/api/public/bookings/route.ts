import { createBooking, parseBooking } from '@/lib/bff/publicBooking';
import { assertSameOrigin, publicError, readPublicJson } from '@/lib/bff/publicHttp';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    return Response.json(createBooking(parseBooking(await readPublicJson(request))), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return publicError(error); }
}
