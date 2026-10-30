import test from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { guestRoute, connectedGuestPortalData } from '@/lib/bff/guestAccess';

test('guest Spring: upstream OTP, private cookies and no demo fallback', async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.GUEST_AUTH_MODE;
  const originalUrl = process.env.API_URL;
  process.env.GUEST_AUTH_MODE = 'spring';
  process.env.API_URL = 'https://api.example.test';
  const base = 'http://localhost:3054';
  const post = (path: string, body: object) => guestRoute(new NextRequest(`${base}/api/app/${path}`, { method: 'POST', headers: { Origin: base }, body: JSON.stringify(body) }), path.split('/'));
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(String(url), 'https://api.example.test/api/v1/app/acceso/verificar-codigo');
      assert.equal(options?.redirect, 'error');
      assert.deepEqual(JSON.parse(String(options?.body)), { correo: 'guest@example.test', codigo: '123456' });
      return Response.json({ accessToken: 'real-access', refreshToken: 'real-refresh', tipoToken: 'Bearer', expiraEn: 900 });
    };
    const verified = await post('acceso/verificar-codigo', { correo: 'guest@example.test', codigo: '123456' });
    assert.equal(verified.status, 204);
    assert.equal(await verified.text(), '');
    assert.equal(verified.cookies.get('vs_guest_access')?.value, 'real-access');
    assert.match(verified.headers.get('set-cookie')!, /HttpOnly/i);
    globalThis.fetch = async () => Response.json({ codigo: 'NOT_FOUND', mensaje: 'No existe' }, { status: 404 });
    assert.equal((await post('acceso/solicitar-codigo', { correo: 'guest@example.test' })).status, 404);
    globalThis.fetch = async () => { throw new Error('offline'); };
    assert.equal((await post('acceso/solicitar-codigo', { correo: 'guest@example.test' })).status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalMode === undefined) delete process.env.GUEST_AUTH_MODE; else process.env.GUEST_AUTH_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.API_URL; else process.env.API_URL = originalUrl;
  }
});

test('guest Spring: concurrent expired access renews once, persists cookies and resumes the portal', async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.GUEST_AUTH_MODE;
  const originalUrl = process.env.API_URL;
  process.env.GUEST_AUTH_MODE = 'spring';
  process.env.API_URL = 'https://renew.example.test';
  const request = (path: string) => new NextRequest(`http://localhost:3054/api/app/${path}`, {
    headers: { Cookie: 'vs_guest_access=expired; vs_guest_refresh=renew-concurrent' },
  });
  let renewals = 0;
  try {
    globalThis.fetch = async (url, options) => {
      if (String(url).endsWith('/auth/renovar')) {
        renewals++;
        assert.deepEqual(JSON.parse(String(options?.body)), { refreshToken: 'renew-concurrent' });
        await new Promise(resolve => setTimeout(resolve, 20));
        return Response.json({ accessToken: 'new-access', refreshToken: 'new-refresh', tipoToken: 'Bearer', expiraEn: 900 });
      }
      if (new Headers(options?.headers).get('Authorization') !== 'Bearer new-access')
        return Response.json({ codigo: 'SESION_VENCIDA', mensaje: 'Venció' }, { status: 401 });
      return Response.json([{ codigo: 'VS-TEST01' }]);
    };
    const responses = await Promise.all([guestRoute(request('reservas'), ['reservas']), guestRoute(request('reservas'), ['reservas'])]);
    assert.equal(renewals, 1);
    for (const response of responses) {
      assert.equal(response.status, 200);
      assert.equal(response.cookies.get('vs_guest_access')?.value, 'new-access');
      assert.equal(response.cookies.get('vs_guest_refresh')?.value, 'new-refresh');
      assert.equal(response.cookies.get('vs_guest_refresh')?.maxAge, undefined);
      assert.equal(response.cookies.get('vs_guest_remember')?.maxAge, 0);
      assert.match(response.headers.get('set-cookie')!, /HttpOnly/);
      assert.match(response.headers.get('set-cookie')!, /SameSite=lax/i);
      assert.equal(JSON.stringify(await response.json()).includes('new-refresh'), false);
    }
    const resumed = await guestRoute(request('sesion?codigo=VS-TEST01'), ['sesion']);
    assert.equal(resumed.status, 307);
    assert.equal(resumed.headers.get('location'), 'http://localhost:3054/portal?codigo=VS-TEST01');
    assert.equal(renewals, 1);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalMode === undefined) delete process.env.GUEST_AUTH_MODE; else process.env.GUEST_AUTH_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.API_URL; else process.env.API_URL = originalUrl;
  }
});

test('guest Spring: invalid refresh clears cookies, while network errors preserve them', async () => {
  const originalFetch = globalThis.fetch;
  const originalMode = process.env.GUEST_AUTH_MODE;
  const originalUrl = process.env.API_URL;
  process.env.GUEST_AUTH_MODE = 'spring';
  process.env.API_URL = 'https://invalid-renew.example.test';
  const request = () => new NextRequest('http://localhost:3054/api/app/sesion', { headers: { Cookie: 'vs_guest_refresh=invalid-refresh' } });
  try {
    globalThis.fetch = async () => Response.json({ codigo: 'SESION_VENCIDA', mensaje: 'Venció' }, { status: 401 });
    const invalid = await guestRoute(request(), ['sesion']);
    assert.equal(invalid.status, 307);
    assert.match(invalid.headers.get('location')!, /\/login\?/);
    assert.equal(invalid.cookies.get('vs_guest_refresh')?.value, '');
    assert.equal(await connectedGuestPortalData('expired-access'), null, 'SSR debe iniciar recuperacion de sesion, no interpretar un error como una lista de reservas.');
    globalThis.fetch = async () => { throw new Error('offline'); };
    const offline = await guestRoute(request(), ['sesion']);
    assert.equal(offline.status, 502);
    assert.equal(offline.headers.get('set-cookie'), null);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalMode === undefined) delete process.env.GUEST_AUTH_MODE; else process.env.GUEST_AUTH_MODE = originalMode;
    if (originalUrl === undefined) delete process.env.API_URL; else process.env.API_URL = originalUrl;
  }
});
