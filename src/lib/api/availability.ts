import type { AvailabilityInput, AvailabilityResponse } from '@/lib/bff/contracts/availability';
export async function getPublicAvailability(input: AvailabilityInput, signal?: AbortSignal): Promise<AvailabilityResponse> {
  const response = await fetch('/api/public/availability', { method: 'POST',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input), signal, cache: 'no-store' });
  if (!response.ok) throw new Error('AVAILABILITY_UNAVAILABLE');
  const payload: AvailabilityResponse = await response.json();
  if (payload.mode !== 'demo' || !Array.isArray(payload.rooms) || !payload.query ||
    payload.query.arrival !== input.arrival || payload.query.departure !== input.departure ||
    payload.query.adults !== input.adults || payload.query.children !== input.children) throw new Error('AVAILABILITY_RESPONSE_INVALID');
  return payload;
}
