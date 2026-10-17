import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeBookingProfile, readBookingDraft, BookingAttemptPendingError } from '@/lib/bookingDraft';

test('OAuth profile keeps the returning draft ID, guest edits and pending booking attempt', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const storage = new Map<string, string>();
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: { getItem: (k: string) => storage.get(k) ?? null, setItem: (k: string, v: string) => storage.set(k, v) } });
  const key = 'vs-public-booking-draft', id = '6475aa49-f767-45b5-8a8a-320cfb599e7c';
  const params = new URLSearchParams({ slug: 'habitacion-estandar', llegada: '2026-11-16', salida: '2026-11-18', adultos: '2', ninos: '0', nombre: '', apellidos: '', correo: '' });
  try {
    const draft = { id, createdAt: Date.now(), params: params.toString() };
    storage.set(key, JSON.stringify(draft));
    const result = mergeBookingProfile(id, { nombre: 'Visitor', apellidos: 'Example', correo: 'visitor@example.test' });
    assert.equal(readBookingDraft(id)?.id, id);
    for (const name of ['slug', 'llegada', 'salida', 'adultos', 'ninos']) assert.equal(result.get(name), params.get(name));
    assert.equal(result.get('correo'), 'visitor@example.test');
    const saved = storage.get(key);
    mergeBookingProfile(id, { correo: 'different@example.test', nombre: 'Other' });
    assert.equal(storage.get(key), saved);
    storage.set(key, JSON.stringify({ ...draft, attempt: { fingerprint: 'immutable', id: 'request-existing' } }));
    const pending = storage.get(key);
    assert.throws(() => mergeBookingProfile(id, { correo: 'visitor@example.test' }), BookingAttemptPendingError);
    assert.equal(storage.get(key), pending);
  } finally { if (previous) Object.defineProperty(globalThis, 'sessionStorage', previous); else Reflect.deleteProperty(globalThis, 'sessionStorage'); }
});
