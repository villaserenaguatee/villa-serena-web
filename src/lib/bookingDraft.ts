import { useEffect, useState } from 'react';
const KEY = 'vs-public-booking-draft';
const RECEIPT = 'vs-public-booking-receipt';
const MAX_AGE = 2 * 60 * 60 * 1000;
const publicKeys = ['habitacion', 'slug', 'habitacionId', 'tipoHabitacionId', 'categoria', 'precio', 'noches', 'llegada', 'salida', 'adultos', 'ninos', 'huespedes', 'total'];
type Draft = { id: string; createdAt: number; updatedAt?: number; params: string; attempt?: { fingerprint: string; flow?: 'stripe' | 'hotel'; id: string; code?: string } };
export class BookingAttemptPendingError extends Error {}
export function bookingReceipt(): { draftId: string; attemptId: string; code?: string } | null {
  try { const r=JSON.parse(sessionStorage.getItem(RECEIPT)||'null'); return r && typeof r.draftId==='string' && typeof r.attemptId==='string' ? r : null; } catch { return null; }
}
function retire(draft: Draft) {
  if (draft.attempt) sessionStorage.setItem(RECEIPT, JSON.stringify({ draftId:draft.id, attemptId:draft.attempt.id, ...(draft.attempt.code ? {code:draft.attempt.code} : {}) }));
  sessionStorage.removeItem(KEY);
}
export function activeBookingDraft(): Draft | null {
  try {
    const draft=JSON.parse(sessionStorage.getItem(KEY)||'null') as Draft | null;
    if (!draft || typeof draft.id!=='string' || typeof draft.params!=='string' || !Number.isFinite(draft.createdAt)) return null;
    if (Date.now()-(draft.updatedAt??draft.createdAt)>=MAX_AGE) { retire(draft); return null; }
    return draft;
  } catch { return null; }
}
export function discardBookingDraft(id: string) {
  const draft=activeBookingDraft();
  if (draft?.id===id) { const code=draft.attempt?.code; retire(draft); return code; }
  return undefined;
}
/** Call only after the backend reports a terminal result for this exact code. */
export function completeBookingDraft(code: string) {
  const draft=activeBookingDraft(), receipt=bookingReceipt();
  if(draft?.attempt?.code===code) sessionStorage.removeItem(KEY);
  if(receipt?.code===code) sessionStorage.removeItem(RECEIPT);
}
export function readBookingDraft(id: string): Draft | null {
  const draft=activeBookingDraft(); return draft?.id===id ? draft : null;
}
/** Explicit edit destination; never use browser history or expose personal fields. */
export function bookingDataHref(id: string, fallback: URLSearchParams): string {
  const saved=readBookingDraft(id), source=saved?new URLSearchParams(saved.params):fallback;
  const query=new URLSearchParams();
  for(const key of publicKeys)if(source.has(key))query.set(key,source.get(key)!);
  if(id)query.set('draft',id);
  query.set('editar','1');
  return '/reservar/datos?'+query;
}
export function saveBookingDraft(params: URLSearchParams, previousId = ''): URLSearchParams {
  const previous = readBookingDraft(previousId);
  if(previousId&&!previous) throw new BookingAttemptPendingError('This draft expired or was discarded; do not resend it');
  const active=activeBookingDraft();
  if(active?.attempt && active.id!==previousId) throw new BookingAttemptPendingError('Resolve the existing attempt first');
  if (previous?.attempt && previous.params !== params.toString()) throw new BookingAttemptPendingError('Resolve the existing attempt first');
  const draft: Draft = previous ? { ...previous, updatedAt:Date.now(), params: params.toString() } : { id: crypto.randomUUID(), createdAt: Date.now(), params: params.toString() };
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
  sessionStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt:Date.now(), params: params.toString() }));
}
/** Import provider details without changing the identity of the returning booking. */
export function mergeBookingProfile(id: string, profile: { nombre?: unknown; apellidos?: unknown; correo?: unknown }): URLSearchParams {
  const draft = readBookingDraft(id);
  if (!draft) throw new Error('Draft unavailable');
  const params = new URLSearchParams(draft.params);
  for (const name of ['nombre', 'apellidos', 'correo'] as const) {
    if (!params.get(name)?.trim() && typeof profile[name] === 'string') params.set(name, profile[name]);
  }
  if (draft.attempt && params.toString() !== draft.params) throw new BookingAttemptPendingError('Resolve the existing attempt first');
  if(params.toString()===draft.params) return params;
  sessionStorage.setItem(KEY, JSON.stringify({ ...draft, updatedAt:Date.now(), params: params.toString() }));
  return params;
}
async function digest(value: string) { return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),b=>b.toString(16).padStart(2,'0')).join(''); }
export async function bookingAttempt(id: string, fingerprint: string): Promise<string> {
  let draft = readBookingDraft(id);
  if (!draft) throw new Error('Draft unavailable');
  const retired=bookingReceipt();
  if(retired) throw new BookingAttemptPendingError('Resolve the previous request before creating another booking');
  const flow=JSON.parse(fingerprint).flow==='stripe'?'stripe':'hotel';
  const hashed=flow==='stripe'?await digest(fingerprint):fingerprint;
  draft=readBookingDraft(id);
  if(!draft || bookingReceipt()) throw new BookingAttemptPendingError('Resolve the previous request first');
  if(draft.attempt){
    const old=draft.attempt.fingerprint;
    if(old===hashed || (!/^[a-f0-9]{64}$/.test(old) && await digest(old)===hashed)){
      draft.attempt.fingerprint=hashed;
      draft.attempt.flow=flow;
      sessionStorage.setItem(KEY,JSON.stringify(draft));return draft.attempt.id;
    }
  }
  if (draft.attempt) throw new BookingAttemptPendingError('Resolve the existing attempt first');
  draft.attempt = { id: crypto.randomUUID(), fingerprint:hashed, flow };
  sessionStorage.setItem(KEY, JSON.stringify(draft));
  return draft.attempt.id;
}
export function finishBookingAttempt(draftId: string, requestId: string, code?: string) {
  const draft = readBookingDraft(draftId);
  if (draft?.attempt?.id !== requestId) {
    const receipt=bookingReceipt();
    if(receipt?.draftId===draftId&&receipt.attemptId===requestId){
      if(code&&/^VS-[A-Z0-9]{6}$/.test(code))sessionStorage.setItem(RECEIPT,JSON.stringify({...receipt,code}));
      else if(!code&&!receipt.code)sessionStorage.removeItem(RECEIPT);
    }
    return;
  }
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
