import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { wsTicketRoute } from '../../src/lib/bff/auth/ws-ticket';
import { TiempoReal } from '../../src/lib/tiempo-real/client';
import type { Client, StompConfig } from '@stomp/stompjs';

test('ticket: origen, sesión, renovación y respuesta sin JWT', async () => {
  const originalFetch = globalThis.fetch, previous = { mode: process.env.STAFF_AUTH_MODE, url: process.env.API_URL };
  process.env.STAFF_AUTH_MODE = 'spring'; process.env.API_URL = 'http://api.test';
  let ticketCalls = 0, renewal = 0;
  globalThis.fetch = async (url, init) => {
    const path = new URL(String(url)).pathname;
    if (path.endsWith('/yo')) return Response.json({ id: 4, nombre: 'Personal', correo: 'staff@example.test', rol: 'ROOM_SERVICE', area: null, debeCambiarContrasena: false });
    if (path.endsWith('/renovar')) { renewal++; return Response.json({ accessToken: 'nuevo-jwt', refreshToken: 'nuevo-refresh', tipoToken: 'Bearer', expiraEn: 900 }); }
    assert.equal(path, '/api/v1/auth/ws-ticket'); ticketCalls++;
    if (new Headers(init?.headers).get('Authorization') === 'Bearer vencido') return Response.json({}, { status: 401 });
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer nuevo-jwt');
    return Response.json({ ticket: 'opaco', expiraEn: new Date(Date.now() + 60000).toISOString(), accessToken: 'no-publicar', refreshToken: 'no-publicar' });
  };
  const request = (origin: string, cookies = '') => new NextRequest('http://localhost:3000/api/auth/ws-ticket', { method: 'POST', headers: { origin, cookie: cookies } });
  try {
    assert.equal((await wsTicketRoute(request('http://evil.test'))).status, 403);
    assert.equal((await wsTicketRoute(request('http://localhost:3000'))).status, 401);
    assert.equal(ticketCalls, 0);
    const response = await wsTicketRoute(request('http://localhost:3000', 'vs_staff_access=vencido; vs_staff_refresh=refresh'));
    assert.equal(response.status, 200); assert.equal(renewal, 1); assert.equal(ticketCalls, 2);
    assert.deepEqual(Object.keys(await response.json()).sort(), ['expiraEn', 'ticket']);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.ok(response.cookies.getAll().every(cookie => cookie.httpOnly));
  } finally { globalThis.fetch = originalFetch; if (previous.mode === undefined) delete process.env.STAFF_AUTH_MODE; else process.env.STAFF_AUTH_MODE = previous.mode; if (previous.url === undefined) delete process.env.API_URL; else process.env.API_URL = previous.url; }
});

test('STOMP: conexión compartida, ticket nuevo, resuscripción y limpieza', async () => {
  let config: StompConfig, created = 0, tickets = 0, stopped = 0;
  const callbacks = new Map<string, (message: { body: string }) => void>();
  const fake = { connected: false, active: false, connectHeaders: {}, activate() { this.active = true; }, async deactivate() { this.active = false; stopped++; },
    subscribe(destination: string, callback: (message: { body: string }) => void) { callbacks.set(destination, callback); return { unsubscribe() { callbacks.delete(destination); } }; },
  };
  const client = new TiempoReal('ws://localhost:8080/ws', options => { created++; config = options!; return fake as unknown as Client; }, async () => Response.json({ ticket: `ticket-${++tickets}` }));
  let received = 0, reload = 0;
  const first = client.subscribe('/topic/pedidos', { recibir: () => received++, recargar: () => reload++ });
  const second = client.subscribe('/topic/pedidos', { recibir: () => received++, recargar: () => reload++ });
  assert.equal(created, 1);
  await config!.beforeConnect!(fake as unknown as Client); assert.deepEqual(fake.connectHeaders, { ticket: 'ticket-1' });
  fake.connected = true; config!.onConnect!({} as never);
  assert.equal(callbacks.size, 1); assert.equal(reload, 2);
  callbacks.get('/topic/pedidos')!({ body: '{"tipo":"NUEVO_PEDIDO"}' }); assert.equal(received, 2);
  callbacks.get('/topic/pedidos')!({ body: 'json inválido' }); assert.equal(received, 2);
  fake.connected = false; config!.onWebSocketClose!({} as never);
  await config!.beforeConnect!(fake as unknown as Client); assert.deepEqual(fake.connectHeaders, { ticket: 'ticket-2' });
  fake.connected = true; config!.onConnect!({} as never); assert.equal(reload, 4);
  first(); assert.equal(stopped, 0); second(); assert.equal(stopped, 1); assert.equal(callbacks.size, 0);
});
