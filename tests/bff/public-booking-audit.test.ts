import { test } from 'node:test';
import assert from 'node:assert/strict';
import { publicBookingAudit } from '@/lib/bff/publicBookingAudit';

test('booking audit excludes request secrets, identifiers and untrusted diagnostic text', () => {
  const previous = console.info, lines: string[] = [];
  console.info = value => { lines.push(String(value)); };
  try {
    const request = new Request('http://localhost:3054/api/publico/reservas?email=private@example.test', { headers: { Cookie: 'secret-cookie', Authorization: 'Bearer secret-token', 'X-Villa-Serena-Booking-Action': 'private-personal-text' } });
    const first = publicBookingAudit(request, 'create', 'private-idempotency-key');
    first.finish(201, { codigo: 'VS-CHECK1', correo: 'private@example.test', documento: 'private-document', urlPago: 'secret-payment-url' });
    const second = publicBookingAudit(new Request(request.url, { headers: { 'X-Villa-Serena-Booking-Action': 'recover-payment' } }), 'checkout', null);
    second.finish(502, { codigo: 'private-error' });
    const parsed = lines.map(line => JSON.parse(line));
    assert.equal(parsed[0].action, 'unspecified');
    assert.equal(parsed[1].requestId, first.id);
    assert.equal(parsed[1].reservationCode, 'VS-CHECK1');
    assert.equal(parsed[2].action, 'recover-payment');
    assert.equal(parsed[3].status, 502);
    assert.notEqual(first.id, second.id);
    assert.equal(parsed[0].attemptHash.length, 16);
    for (const secret of ['private@example.test', 'private-personal-text', 'private-idempotency-key', 'secret-cookie', 'secret-token', 'private-document', 'secret-payment-url', 'private-error']) assert.equal(lines.join('').includes(secret), false);
  } finally { console.info = previous; }
});
