import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { receptionRoute } from '../../src/lib/bff/receptionHttp';

test('Recepción conectada: contrato, JWT privado, estados y errores sin fallback', async () => {
  const previous = { fetch: globalThis.fetch, mode: process.env.STAFF_AUTH_MODE, url: process.env.API_URL };
  process.env.STAFF_AUTH_MODE = 'spring'; process.env.API_URL = 'http://api.test';
  const employee = { id: 2, nombre: 'Recepción', correo: 'staff@example.test', rol: 'RECEPCION', area: null, debeCambiarContrasena: false };
  let role = 'RECEPCION', failure = 0, calls = 0;
  let expected: { path: string; method: string; body?: unknown; status: number };
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/yo')) return Response.json({ ...employee, rol: role });
    calls++;
    assert.equal(new URL(String(url)).pathname, `/api/v1/${expected.path}`);
    assert.equal(init?.method, expected.method);
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer privado');
    assert.equal(init?.body, expected.body === undefined ? undefined : JSON.stringify(expected.body));
    if (failure) return Response.json({ codigo: 'RECHAZADA', mensaje: 'Estado incompatible' }, { status: failure });
    return Response.json({ id: 8, accessToken: 'no-publicar' }, { status: expected.status });
  };
  const send = (origin = 'http://localhost:3000') => receptionRoute(new NextRequest(`http://localhost:3000/api/${expected.path}`, {
    method: expected.method, headers: { cookie: 'vs_staff_access=privado', origin, 'Content-Type': 'application/json' },
    ...(expected.body === undefined ? {} : { body: JSON.stringify(expected.body) }),
  }), expected.path.split('/')[0] as 'reservas' | 'habitaciones' | 'huespedes');
  try {
    for (const operation of [
      { path: 'reservas/disponibilidad', method: 'GET', status: 200 },
      { path: 'habitaciones/disponibles', method: 'GET', status: 200 },
      { path: 'huespedes', method: 'POST', body: { nombreCompleto: 'Ana' }, status: 201 },
      { path: 'reservas', method: 'POST', body: { huespedId: 8 }, status: 201 },
      { path: 'reservas/VS-ABC123/cancelacion', method: 'GET', status: 200 },
      { path: 'reservas/VS-ABC123/cancelar', method: 'POST', body: { motivo: 'Cambio' }, status: 200 },
      { path: 'reservas/VS-ABC123/habitacion', method: 'PUT', body: { habitacionId: 8 }, status: 200 },
      { path: 'reservas/VS-ABC123/check-in', method: 'POST', status: 200 },
      { path: 'reservas/VS-ABC123/huespedes-adicionales', method: 'POST', body: { nombreCompleto: 'Ana' }, status: 201 },
    ]) {
      expected = operation;
      const response = await send();
      assert.equal(response.status, operation.status);
      assert.equal(response.headers.get('X-Villa-Serena-Mode'), 'spring');
      assert.deepEqual(await response.json(), { id: 8 });
    }
    failure = 409;
    assert.equal((await send()).status, 409);
    failure = 0; role = 'ADMIN';
    const before = calls;
    assert.equal((await send()).status, 403); assert.equal(calls, before);
    role = 'RECEPCION';
    assert.equal((await send('https://ajeno.test')).status, 403); assert.equal(calls, before);
    globalThis.fetch = async url => {
      if (String(url).endsWith('/yo')) return Response.json(employee);
      throw new Error('offline');
    };
    assert.equal((await send()).status, 502);
  } finally {
    globalThis.fetch = previous.fetch;
    for (const [key, value] of Object.entries({ STAFF_AUTH_MODE: previous.mode, API_URL: previous.url })) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});
