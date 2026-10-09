import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { NextRequest } from 'next/server';
import { guestRoute, guestPortalData, DEMO_GUEST_EMAIL, GUEST_COOKIE } from '@/lib/bff/guestAccess';
const base = 'http://localhost:3035';
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
function post(route: string, input: object) { return guestRoute(new NextRequest(`${base}/api/app/${route}`, { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify(input) }), route.split('/')); }
const outboxCode = () => JSON.parse(readFileSync(`.data/guest-outbox/${digest(DEMO_GUEST_EMAIL)}.json`, 'utf8')).codigo;
test('OTP: respuesta genérica, vencimiento, uso único, bloqueo y renovación privada', async () => {
  const realNow = Date.now; let clock = realNow(); Date.now = () => clock;
  try {
    const known = await post('acceso/solicitar-codigo', { correo: DEMO_GUEST_EMAIL });
    const unknown = await post('acceso/solicitar-codigo', { correo: 'sin-reservas@example.com' });
    assert.deepEqual(await known.json(), await unknown.json());
    const expired = outboxCode(); clock += 600001;
    assert.equal((await post('acceso/verificar-codigo', { correo: DEMO_GUEST_EMAIL, codigo: expired })).status, 401);
    for (let i = 0; i < 4; i++) assert.equal((await post('acceso/verificar-codigo', { correo: DEMO_GUEST_EMAIL, codigo: '000000' })).status, 401);
    await post('acceso/solicitar-codigo', { correo: DEMO_GUEST_EMAIL });
    assert.equal(outboxCode(), expired, 'Solicitar durante el bloqueo no genera otro código');
    clock += 900001; await post('acceso/solicitar-codigo', { correo: DEMO_GUEST_EMAIL }); const code = outboxCode();
    const verify = await post('acceso/verificar-codigo', { correo: DEMO_GUEST_EMAIL, codigo: code }); assert.equal(verify.status, 204); assert.equal(await verify.text(), '');
    assert.equal(guestPortalData('sesion-inventada', ''), null);
    const portal = guestPortalData(verify.cookies.get(GUEST_COOKIE)!.value, '');
    assert.ok(portal?.supported);
    assert.equal(portal.huesped.correo, DEMO_GUEST_EMAIL);
    assert.ok(portal.reservas.every(r => r.huespedId === portal.huesped.id));
    assert.deepEqual(guestPortalData(verify.cookies.get(GUEST_COOKIE)!.value, '', 'VS-DEMO02'), { supported: false, reason: 'reservation' });
    assert.equal((await post('acceso/verificar-codigo', { correo: DEMO_GUEST_EMAIL, codigo: code })).status, 401);
    const cookie = verify.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
    clock += 900001;
    const renewed = await guestRoute(new NextRequest(`${base}/api/app/reservas/VS-DEMO01`, { headers: { Cookie: cookie } }), ['reservas', 'VS-DEMO01']);
    assert.equal(renewed.status, 200); assert.notEqual(renewed.cookies.get(GUEST_COOKIE)?.value, verify.cookies.get(GUEST_COOKIE)?.value);
    assert.ok(!/accessToken|refreshToken/.test(await renewed.text()));
    assert.equal((await guestRoute(new NextRequest(`${base}/api/app/reservas`, { headers: { Cookie: cookie } }), ['reservas'])).status, 401, 'Refresh anterior revocado');
  } finally { Date.now = realNow; }
});
