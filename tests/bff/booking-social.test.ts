import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import { NextRequest } from 'next/server';
import { startBookingSocial, callbackBookingSocial, readBookingSocialProfile } from '@/lib/bff/bookingSocial';

test('reservation OAuth protocol guards; no provider authentication simulated or claimed', async () => {
  const names = ['GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'FACEBOOK_CLIENT_ID', 'FACEBOOK_CLIENT_SECRET', 'FACEBOOK_GRAPH_VERSION', 'BOOKING_OAUTH_COOKIE_KEY', 'BOOKING_OAUTH_ORIGIN', 'BOOKING_OAUTH_STATE_DIR'];
  const original = Object.fromEntries(names.map(n => [n, process.env[n]]));
  const origin = 'http://localhost:3054';
  process.env.BOOKING_OAUTH_ORIGIN = origin;
  process.env.BOOKING_OAUTH_COOKIE_KEY = randomBytes(32).toString('hex');
  process.env.BOOKING_OAUTH_STATE_DIR = '.data/booking-oauth-protocol-tests';
  const query = new URLSearchParams({ draft: randomUUID(), slug: 'habitacion-estandar', llegada: '2026-11-16', salida: '2026-11-18', adultos: '2', ninos: '0' });
  const req = (provider: string, from = origin) => new NextRequest(`${origin}/api/auth/booking-social/${provider}/start`, { method: 'POST', headers: { Origin: from, 'Content-Type': 'application/json' }, body: JSON.stringify({ query: query.toString() }) });
  try {
    delete process.env.GOOGLE_CLIENT_ID; delete process.env.GOOGLE_CLIENT_SECRET;
    assert.equal((await startBookingSocial(req('google'), 'google')).status, 503);
    assert.equal((await startBookingSocial(req('google', 'https://other.invalid'), 'google')).status, 403);
    assert.equal(readBookingSocialProfile(new NextRequest(`${origin}/api/auth/booking-social/profile?draft=${query.get('draft')}`)).status, 401);
    for (const provider of ['google', 'facebook']) {
      // Only construct authorization URLs and denial/error callbacks. Never exchange fake credentials.
      process.env[`${provider.toUpperCase()}_CLIENT_ID`] = 'protocol-fixture-not-real';
      process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] = randomBytes(32).toString('hex');
      process.env.FACEBOOK_GRAPH_VERSION = 'v99.0'; // URL fixture only; never sent to Meta.
      for (const error of ['access_denied', 'server_error']) {
        const start = await startBookingSocial(req(provider), provider); assert.equal(start.status, 200);
        const auth = new URL((await start.json()).url), cookie = start.cookies.get('vs_booking_oauth')!;
        assert.equal(auth.searchParams.get('redirect_uri'), `${origin}/api/auth/booking-social/${provider}/callback`);
        assert.equal(auth.searchParams.has('client_secret'), false);
        assert.equal(auth.searchParams.has('correo'), false);
        if (provider === 'google') assert.equal(auth.searchParams.get('code_challenge_method'), 'S256');
        const callback = new NextRequest(`${origin}/api/auth/booking-social/${provider}/callback?${new URLSearchParams({ state: auth.searchParams.get('state')!, error })}`, { headers: { Cookie: `${cookie.name}=${cookie.value}` } });
        const result = await callbackBookingSocial(callback, provider), target = new URL(result.headers.get('location')!);
        assert.equal(target.searchParams.get('social'), error === 'access_denied' ? 'cancelled' : 'error');
        for (const [key, value] of query) assert.equal(target.searchParams.get(key), value);
        assert.equal(result.cookies.getAll().some(c => c.name.startsWith('vs_staff') || c.name.startsWith('vs_guest')), false);
        assert.equal(result.cookies.get('vs_booking_profile')?.value, '');
        assert.equal(new URL((await callbackBookingSocial(callback, provider)).headers.get('location')!).searchParams.get('social'), 'error');
      }
      const forged = await callbackBookingSocial(new NextRequest(`${origin}/api/auth/booking-social/${provider}/callback?state=forged&code=forged`, { headers: { Cookie: 'vs_booking_oauth=forged' } }), provider);
      assert.equal(new URL(forged.headers.get('location')!).searchParams.get('social'), 'error');
      assert.equal(forged.cookies.get('vs_booking_profile')?.value, '');
    }
  } finally { for (const n of names) { if (original[n] === undefined) delete process.env[n]; else process.env[n] = original[n]; } }
});
