import {test} from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '@/app/api/publico/[...ruta]/route';
import {validDocument, validNationalPhone} from '@/lib/guestValidation';

test('manual MVP: DPI preserves zeroes and phone validation stays active', () => {
  assert.equal(validDocument('DPI', '0012345678901'), true);
  for (const value of ['123', '00123456789012', '001234567890A']) assert.equal(validDocument('DPI', value), false);
  assert.equal(validDocument('PASAPORTE', 'AB123456'), false);
  assert.equal(validNationalPhone('+502', '55551234'), true);
  assert.equal(validNationalPhone('+502', '555512345'), false);
  assert.equal(validNationalPhone('+502', 'abcd1234'), false);
});

test('booking BFF rejects passports and invalid DPI before forwarding or creating', async () => {
  const mode = process.env.VILLA_SERENA_BFF_MODE, api = process.env.API_URL, originalFetch = globalThis.fetch;
  process.env.VILLA_SERENA_BFF_MODE = 'api';
  process.env.API_URL = 'https://backend.invalid';
  let calls = 0;
  globalThis.fetch = async () => { calls++; throw new Error('No upstream calls allowed'); };
  try {
    for (const huesped of [{tipoDocumento:'PASAPORTE',numeroDocumento:'AB1234'}, {tipoDocumento:'DPI',numeroDocumento:'123'}, {tipoDocumento:'DPI',numeroDocumento:1234567890123}]) {
      const response = await POST(new Request('http://localhost:3080/api/publico/reservas', {
        method: 'POST', headers: {'Origin':'http://localhost:3080','Idempotency-Key':'mvp-contract-test-123456','Content-Type':'application/json'},
        body: JSON.stringify({huesped}),
      }));
      assert.equal(response.status, 400);
    }
    assert.equal(calls, 0);
  } finally {
    globalThis.fetch = originalFetch;
    if (mode === undefined) delete process.env.VILLA_SERENA_BFF_MODE; else process.env.VILLA_SERENA_BFF_MODE = mode;
    if (api === undefined) delete process.env.API_URL; else process.env.API_URL = api;
  }
});
