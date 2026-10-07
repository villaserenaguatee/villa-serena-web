import { createBooking, parseBooking } from '@/lib/bff/publicBooking';
import { assertSameOrigin, publicError, readPublicJson } from '@/lib/bff/publicHttp';
import { AvailabilityError } from '@/lib/bff/publicAvailability';
export const runtime = 'nodejs';
export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = parseBooking(await readPublicJson(request));
    // Solo conserva recuperación de resultados anteriores de #13. Las altas públicas van por tarjeta.
    if (!input.recoveryCode) throw new AvailabilityError('PUBLIC_CARD_ONLY', 409);
    return Response.json(createBooking(input), { status: 201, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) { return publicError(error); }
}
