import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bookingEmailProof, bookingEmailRoute } from '@/lib/bff/bookingEmailVerification';
import { NextRequest } from 'next/server';

test('booking receipt is read only from the cookie and must match the draft', async () => {
  const draft = '6475aa49-f767-45b5-8a8a-320cfb599e7c', proof = 'a'.repeat(43);
  const request = new Request('http://localhost:3054/api/publico/reservas', { headers: { Cookie: `unrelated=value; vs_booking_email=${draft}.${proof}`, 'X-Booking-Email-Verification': 'attacker-header' } });
  assert.equal(bookingEmailProof(request, draft), proof);
  assert.equal(bookingEmailProof(request, '809a5e8a-aafd-47a9-8364-8c1300de7b31'), '');
  assert.equal(bookingEmailProof(request, '../untrusted'), '');
  assert.equal(bookingEmailProof(new Request(request.url, { headers: { 'X-Booking-Email-Verification': proof } }), draft), '');
  const foreign = await bookingEmailRoute(new NextRequest('http://localhost:3054/api/publico/correo/solicitar', { method: 'POST', headers: { Origin: 'https://other.invalid' }, body: '{}' }), 'solicitar');
  assert.equal(foreign.status, 403);
  const invalid = await bookingEmailRoute(new NextRequest('http://localhost:3054/api/publico/correo/solicitar', { method: 'POST', headers: { Origin: 'http://localhost:3054' }, body: JSON.stringify({ correo: 'not-an-email', borrador: draft }) }), 'solicitar');
  assert.equal(invalid.status, 400);
});
