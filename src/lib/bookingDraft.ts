import { useEffect, useState } from 'react';
const KEY = 'vs-public-booking-draft';
const MAX_AGE = 2 * 60 * 60 * 1000;
const publicKeys = ['habitacion', 'slug', 'habitacionId', 'categoria', 'precio', 'noches', 'llegada', 'salida', 'adultos', 'ninos', 'huespedes', 'total'];
type Draft = { id: string; createdAt: number; params: string; attempt?: { fingerprint: string; id: string } };
export function readBookingDraft(id: string): Draft | null {
  try {
    const draft = JSON.parse(sessionStorage.getItem(KEY) || 'null') as Draft | null;
    return draft?.id === id && typeof draft.params === 'string' && Date.now() - draft.createdAt < MAX_AGE ? draft : null;
  } catch { return null; }
}
export function saveBookingDraft(params: URLSearchParams): URLSearchParams {
  const draft: Draft = { id: crypto.randomUUID(), createdAt: Date.now(), params: params.toString() };
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
  params.set('correo', email);
  sessionStorage.setItem(KEY, JSON.stringify({ ...draft, params: params.toString(), attempt: undefined }));
}
export function bookingAttempt(id: string, fingerprint: string): string {
  const draft = readBookingDraft(id);
  if (!draft) throw new Error('Draft unavailable');
  if (draft.attempt?.fingerprint === fingerprint) return draft.attempt.id;
  draft.attempt = { id: crypto.randomUUID(), fingerprint };
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  return draft.attempt.id;
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
