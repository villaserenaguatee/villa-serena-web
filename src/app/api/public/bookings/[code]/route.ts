import { bookingResult } from '@/lib/bff/publicBooking';
import { publicError } from '@/lib/bff/publicHttp';
export const runtime = 'nodejs';
export async function GET(_request: Request, context: { params: Promise<{ code: string }> }) {
  try { return Response.json(bookingResult((await context.params).code), { headers: { 'Cache-Control': 'no-store' } }); }
  catch (error) { return publicError(error); }
}
