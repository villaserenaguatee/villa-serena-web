import { useEffect, useState } from 'react';
const KEY = 'vs-public-booking-draft';
const MAX_AGE = 2 * 60 * 60 * 1000;
const publicKeys = ['habitacion', 'slug', 'habitacionId', 'categoria', 'precio', 'noches', 'llegada', 'salida', 'adultos', 'ninos', 'huespedes', 'total'];
type Draft = { id: string; createdAt: number; params: string; attempt?: { fingerprint: string; id: string; code?: string } };
export class BookingAttemptPendingError extends Error {}
export function readBookingDraft(id: string): Draft | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(KEY) || 'null') as Draft | null;
    return draft?.id === id && typeof draft.params === 'string' && Date.now() - draft.createdAt < MAX_AGE ? draft : null;
  } catch { return null; }
}
export function saveBookingDraft(params: URLSearchParams, previousId = ''): URLSearchParams {
  const previous = readBookingDraft(previousId);
  if (previous?.attempt && previous.params !== params.toString()) throw new BookingAttemptPendingError('Resolve the existing attempt first');
  const draft: Draft = previous?.params === params.toString() ? previous : { id: crypto.randomUUID(), createdAt: Date.now(), params: params.toString() };
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  const query = new URLSearchParams();
  for (const key of publicKeys) if (params.has(key)) query.set(key, params.get(key)!);
  query.set('draft', draft.id);
  return query;
}
export function updateDraftEmail(id: string, email: string) {
  const draft = readBookingDraft(id);
  if (!draft) throw new Error('Draft unavailable');
  const params = new URLSearchParams(draft.params);
  if (draft.attempt && params.get('correo') !== email) throw new BookingAttemptPendingError('Resolve the existing attempt first');
  params.set('correo', email);
  sessionStorage.setItem(KEY, JSON.stringify({ ...draft, params: params.toString() }));
}
export function bookingAttempt(id: string, fingerprint: string): string {
  const draft = readBookingDraft(id);
  if (!draft) throw new Error('Draft unavailable');
  if (draft.attempt?.fingerprint === fingerprint) return draft.attempt.id;
  if (draft.attempt) throw new BookingAttemptPendingError('Resolve the existing attempt first');
  draft.attempt = { id: crypto.randomUUID(), fingerprint };
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  return draft.attempt.id;
}
export function finishBookingAttempt(draftId: string, requestId: string, code?: string) {
  const draft = readBookingDraft(draftId);
  if (draft?.attempt?.id !== requestId) return;
  // Only discard after the server explicitly rejected the attempt without writing.
  if (code) draft.attempt.code = code;
  else delete draft.attempt;
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}
export function useBookingDraft(query: string) {
  const [params, setParams] = useState<URLSearchParams | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(query).get('draft') || '';
    const draft = readBookingDraft(id);
    setParams(draft ? new URLSearchParams(draft.params) : null);
  }, [query]);
  return params;
}
