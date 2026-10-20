import 'server-only';
import { createHash, randomUUID } from 'node:crypto';

/** Client action is diagnostic metadata, never authorization. No body/cookie logging. */
export function publicBookingAudit(request: Request, operation: 'create' | 'checkout', key: string | null) {
  const id = randomUUID(), started = Date.now();
  const supplied = request.headers.get('X-Villa-Serena-Booking-Action');
  const action = supplied === 'continue-payment' || supplied === 'recover-payment' ? supplied : 'unspecified';
  const context = { event: 'public_booking_write', requestId: id, operation, action,
    ...(key ? { attemptHash: createHash('sha256').update(key).digest('hex').slice(0, 16) } : {}) };
  console.info(JSON.stringify({ ...context, phase: 'started', at: new Date().toISOString() }));
  return { id, finish(status: number, payload?: unknown) {
    const code = payload && typeof payload === 'object' && 'codigo' in payload ? (payload as { codigo: unknown }).codigo : null;
    console.info(JSON.stringify({ ...context, phase: 'finished', at: new Date().toISOString(), status, durationMs: Date.now() - started,
      ...(typeof code === 'string' && /^VS-[A-Z0-9]{6}$/.test(code) ? { reservationCode: code } : {}) }));
  } };
}
