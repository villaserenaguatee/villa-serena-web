import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { incidenciaFotoRoute } from '../../src/lib/bff/incidenciaFoto';
import { validarFoto, MAX_FOTO } from '../../src/lib/incidenciaValidation';
import { POST, GET } from '../../src/app/api/[...ruta]/route';
import { receptionRoute } from '../../src/lib/bff/receptionHttp';

test('foto: límite, tipo, contenido, multipart y clave sin tokens', async () => {
  assert.match(validarFoto({ type: 'image/png', size: 6 * 1024 * 1024 }), /5 MB/);
  assert.match(validarFoto({ type: 'application/pdf', size: 40 }), /JPG/);
  assert.equal(validarFoto({ type: 'image/jpeg', size: MAX_FOTO }), '');
  const previous = { fetch: globalThis.fetch, mode: process.env.STAFF_AUTH_MODE, url: process.env.API_URL };
  process.env.STAFF_AUTH_MODE = 'spring'; process.env.API_URL = 'http://api.test';
  let uploads = 0;
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/yo')) return Response.json({ id: 5, nombre: 'Técnico', correo: 'staff@example.test', rol: 'MANTENIMIENTO_LIMPIEZA', area: 'MANTENIMIENTO', debeCambiarContrasena: false });
    uploads++;
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer privado');
    assert.equal(new Headers(init?.headers).get('Content-Type'), null);
    assert.ok(init?.body instanceof FormData); assert.equal(init.body.get('uso'), 'INCIDENCIA');
    return Response.json({ clave: 'privado/incidencias/foto.png', accessToken: 'no-publicar' }, { status: 201 });
  };
  const request = async (file: File, uso = 'INCIDENCIA', origin = 'http://localhost:3000') => {
    const form = new FormData(); form.set('archivo', file); form.set('uso', uso);
    const multipart = new Response(form);
    return new NextRequest('http://localhost:3000/api/archivos/imagenes', { method: 'POST', headers: { origin, cookie: 'vs_staff_access=privado', 'content-type': multipart.headers.get('content-type')! }, body: await multipart.arrayBuffer() });
  };
  try {
    const png = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'foto.png', { type: 'image/png' });
    assert.equal((await incidenciaFotoRoute(await request(png, 'INCIDENCIA', 'http://evil.test'))).status, 403);
    assert.equal((await incidenciaFotoRoute(await request(png, 'MENU'))).status, 403);
    assert.equal((await incidenciaFotoRoute(await request(new File(['texto'], 'foto.png', { type: 'image/png' })))).status, 400);
    assert.equal((await incidenciaFotoRoute(await request(new File([new Uint8Array(MAX_FOTO + 100000)], 'grande.png', { type: 'image/png' })))).status, 413);
    assert.equal(uploads, 0);
    const response = await incidenciaFotoRoute(await request(png)); assert.equal(response.status, 201);
    assert.deepEqual(await response.json(), { clave: 'privado/incidencias/foto.png' }); assert.equal(uploads, 1);
  } finally { globalThis.fetch = previous.fetch; for (const [key, value] of Object.entries({ STAFF_AUTH_MODE: previous.mode, API_URL: previous.url })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});

test('incidencias: área y rol en BFF; reportar permitido a Limpieza, tomar denegado', async () => {
  const previous = { fetch: globalThis.fetch, mode: process.env.STAFF_AUTH_MODE, url: process.env.API_URL };
  process.env.STAFF_AUTH_MODE = 'spring'; process.env.API_URL = 'http://api.test'; let calls = 0;
  globalThis.fetch = async url => {
    if (String(url).endsWith('/yo')) return Response.json({ id: 3, nombre: 'Limpieza', correo: 'staff@example.test', rol: 'MANTENIMIENTO_LIMPIEZA', area: 'LIMPIEZA', debeCambiarContrasena: false });
    calls++; return Response.json({ id: 1, accessToken: 'no-publicar' }, { status: 201 });
  };
  const req = (path: string, method = 'POST') => new NextRequest(`http://localhost:3000/api/${path}`, { method, headers: { origin: 'http://localhost:3000', cookie: 'vs_staff_access=privado' } });
  const ctx = (ruta: string[]) => ({ params: Promise.resolve({ ruta }) });
  try {
    assert.equal((await GET(req('incidencias', 'GET'), ctx(['incidencias']))).status, 403);
    assert.equal((await POST(req('incidencias/1/tomar'), ctx(['incidencias', '1', 'tomar']))).status, 403);
    assert.equal((await GET(req('room-service/pedidos', 'GET'), ctx(['room-service', 'pedidos']))).status, 403);
    assert.equal(calls, 0);
    const response = await POST(req('incidencias'), ctx(['incidencias'])); assert.equal(response.status, 201); assert.deepEqual(await response.json(), { id: 1 });
  } finally { globalThis.fetch = previous.fetch; for (const [key, value] of Object.entries({ STAFF_AUTH_MODE: previous.mode, API_URL: previous.url })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});

test('habitaciones conectadas: sesión del servidor, no mezcla con datos demo', async () => {
  const previous = { fetch: globalThis.fetch, mode: process.env.STAFF_AUTH_MODE, url: process.env.API_URL };
  process.env.STAFF_AUTH_MODE = 'spring'; process.env.API_URL = 'http://api.test';
  globalThis.fetch = async (url, init) => {
    if (String(url).endsWith('/yo')) return Response.json({ id: 2, nombre: 'Recepción', correo: 'staff@example.test', rol: 'RECEPCION', area: null, debeCambiarContrasena: false });
    assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer privado');
    assert.equal(new URL(String(url)).searchParams.get('piso'), '2');
    return Response.json([]);
  };
  try {
    const response = await receptionRoute(new NextRequest('http://localhost:3000/api/habitaciones?piso=2', { headers: { cookie: 'vs_staff_access=privado' } }), 'habitaciones');
    assert.equal(response.status, 200); assert.equal(response.headers.get('X-Villa-Serena-Mode'), 'spring'); assert.deepEqual(await response.json(), []);
    let attempts = 0;
    globalThis.fetch = async (url, init) => {
      const path = new URL(String(url)).pathname;
      if (path.endsWith('/yo')) return Response.json({ id: 2, nombre: 'Recepción', correo: 'staff@example.test', rol: 'RECEPCION', area: null, debeCambiarContrasena: false });
      if (path.endsWith('/renovar')) return Response.json({ accessToken: 'renovado', refreshToken: 'nuevo-refresh', tipoToken: 'Bearer', expiraEn: 900 });
      assert.ok(path.endsWith('/4/marcar-sucia')); assert.equal(init?.body, undefined);
      attempts++; return attempts === 1 ? Response.json({}, { status: 401 }) : Response.json({ id: 4, condicion: 'SUCIA', accessToken: 'no-publicar' });
    };
    const dirty = await receptionRoute(new NextRequest('http://localhost:3000/api/habitaciones/4/marcar-sucia', { method: 'POST', headers: { origin: 'http://localhost:3000', cookie: 'vs_staff_access=privado; vs_staff_refresh=refresh' }, body: '' }), 'habitaciones');
    assert.equal(dirty.status, 200); assert.equal(attempts, 2); assert.deepEqual(await dirty.json(), { id: 4, condicion: 'SUCIA' });
    globalThis.fetch = async url => { if (String(url).endsWith('/yo')) return Response.json({ id: 2, nombre: 'Recepción', correo: 'staff@example.test', rol: 'RECEPCION', area: null, debeCambiarContrasena: false }); throw new Error('desconectado'); };
    assert.equal((await receptionRoute(new NextRequest('http://localhost:3000/api/habitaciones', { headers: { cookie: 'vs_staff_access=privado' } }), 'habitaciones')).status, 502);
  } finally { globalThis.fetch = previous.fetch; for (const [key, value] of Object.entries({ STAFF_AUTH_MODE: previous.mode, API_URL: previous.url })) { if (value === undefined) delete process.env[key]; else process.env[key] = value; } }
});
