import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareStripeBooking } from '@/lib/publicStripeBooking';
import { activeBookingDraft, bookingReceipt } from '@/lib/bookingDraft';

test('payment protocol: Stripe starts only after creation response; retry reuses stored code', async () => {
  const storage = new Map<string, string>();
  const oldStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const oldFetch = globalThis.fetch;
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  } });
  const id = crypto.randomUUID(), params = new URLSearchParams({ slug: 'habitacion-estandar', tipoHabitacionId: '3', llegada: '2026-11-16', salida: '2026-11-18', adultos: '2', ninos: '0', nombre: 'PROTOCOL FIXTURE', apellidos: 'ONLY', correo: 'protocol@example.test', telefono: '+502 55555555', tipoDocumento: 'DPI', documento: '0000000000123', nacionalidad: 'Guatemalteca' });
  storage.set('vs-public-booking-draft', JSON.stringify({ id, createdAt: Date.now(), params: params.toString() }));
  const calls: string[] = [];
  const actions: (string | null)[] = [];
  // Protocol double only: never contacts API, SMTP or Stripe, never represents a real reservation.
  globalThis.fetch = async (input, init) => {
    const url = String(input); calls.push(url);
    actions.push(new Headers(init?.headers).get('X-Villa-Serena-Booking-Action'));
    if (url === '/api/publico/reservas') return new Response(JSON.stringify({ codigo: 'VS-CHECK1', estado: 'PENDIENTE_PAGO', total: 840 }), { headers: { 'X-Villa-Serena-Mode': 'spring', 'Content-Type': 'application/json' } });
    throw new Error('Stripe blocked in protocol test');
  };
  try {
    await assert.rejects(prepareStripeBooking(params, id), /Stripe blocked/);
    assert.deepEqual(calls, ['/api/publico/reservas', '/api/publico/reservas/VS-CHECK1/pago']);
    const saved = JSON.parse(storage.get('vs-public-booking-draft')!);
    assert.equal(saved.attempt.code, 'VS-CHECK1');
    await assert.rejects(prepareStripeBooking(params, id, true), /Stripe blocked/);
    assert.deepEqual(calls, ['/api/publico/reservas', '/api/publico/reservas/VS-CHECK1/pago', '/api/publico/reservas/VS-CHECK1/pago']);
    assert.deepEqual(actions, ['continue-payment', 'continue-payment', 'recover-payment']);
    assert.equal(JSON.parse(storage.get('vs-public-booking-draft')!).attempt.id, saved.attempt.id);
    storage.clear(); // Separate protocol fixture, not production storage.
    const other=crypto.randomUUID();storage.set('vs-public-booking-draft',JSON.stringify({id:other,createdAt:Date.now(),params:params.toString()}));
    const afterExpiry:string[]=[];
    globalThis.fetch=async input=>{afterExpiry.push(String(input));const expired=JSON.parse(storage.get('vs-public-booking-draft')!);expired.updatedAt=Date.now()-2*60*60*1000;storage.set('vs-public-booking-draft',JSON.stringify(expired));activeBookingDraft();return new Response(JSON.stringify({codigo:'VS-CHECK2',estado:'PENDIENTE_PAGO',total:840}),{headers:{'X-Villa-Serena-Mode':'spring','Content-Type':'application/json'}});};
    await assert.rejects(prepareStripeBooking(params,other),/discarded/);
    assert.deepEqual(afterExpiry,['/api/publico/reservas']);assert.equal(storage.has('vs-public-booking-draft'),false);assert.equal(bookingReceipt()?.code,'VS-CHECK2');
  } finally {
    globalThis.fetch = oldFetch;
    if (oldStorage) Object.defineProperty(globalThis, 'sessionStorage', oldStorage);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});
