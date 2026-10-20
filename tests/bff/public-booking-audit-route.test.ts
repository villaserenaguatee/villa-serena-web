import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET, POST } from '@/app/api/publico/[...ruta]/route';

test('audit wiring keeps GET read-only and traces rejected POST without exposing payload', async () => {
  const originalFetch = globalThis.fetch, originalInfo = console.info;
  const mode = process.env.VILLA_SERENA_BFF_MODE, url = process.env.API_URL;
  const logs: string[] = [], calls: string[] = [];
  process.env.VILLA_SERENA_BFF_MODE = 'api'; process.env.API_URL = 'http://api.invalid';
  console.info = value => { logs.push(String(value)); };
  globalThis.fetch = async (input, init) => { calls.push(init?.method || 'GET'); return Response.json(init?.method === 'POST' ? { codigo: 'CORREO_NO_VERIFICADO' } : [], { status: init?.method === 'POST' ? 403 : 200 }); };
  try {
    const get = await GET(new Request('http://localhost:3054/api/publico/ofertas'));
    assert.equal(get.status, 200); assert.equal(logs.length, 0);
    const post = await POST(new Request('http://localhost:3054/api/publico/reservas', { method: 'POST', headers: { Origin: 'http://localhost:3054', 'Content-Type': 'application/json', 'Idempotency-Key': 'private-attempt-key-1234', Cookie: 'private-cookie', 'X-Villa-Serena-Booking-Action': 'continue-payment' }, body: JSON.stringify({ huesped: { correo: 'private@example.test', tipoDocumento: 'DPI', numeroDocumento: '0000000000001' }, borradorId: crypto.randomUUID() }) }));
    assert.equal(post.status, 403); assert.match(post.headers.get('X-Villa-Serena-Request-Id')!, /^[a-f0-9-]{36}$/);
    assert.deepEqual(calls, ['GET', 'POST']); assert.equal(logs.length, 2);
    assert.equal(JSON.parse(logs[1]).status, 403);
    for (const value of ['private@example.test', '0000000000001', 'private-cookie', 'private-attempt-key-1234']) assert.equal(logs.join('').includes(value), false);
  } finally {
    globalThis.fetch = originalFetch; console.info = originalInfo;
    if (mode === undefined) delete process.env.VILLA_SERENA_BFF_MODE; else process.env.VILLA_SERENA_BFF_MODE = mode;
    if (url === undefined) delete process.env.API_URL; else process.env.API_URL = url;
  }
});
