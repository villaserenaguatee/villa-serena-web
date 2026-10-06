import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NextRequest } from 'next/server';
import { createDemoAuth } from '../../src/lib/bff/auth/demo';
import { authRoute, withStaffSession, ACCESS_COOKIE, REFRESH_COOKIE, writeCookies } from '../../src/lib/bff/auth/http';
import { createSpringAuth } from '../../src/lib/bff/auth/spring';
import { staffCanAccess } from '../../src/lib/auth/staff-contract';
import { AuthError } from '../../src/lib/bff/auth/errors';
import { NextResponse } from 'next/server';
import { publicEmployee, serverSession } from '../../src/lib/bff/auth/response';
import { isAuthError } from '../../src/lib/bff/auth/errors';
const loginInput = { correo: 'recepcion@villaserena.gt', contrasena: 'demo123' };
const request = (path: string, input?: unknown, cookie?: string, origin = 'http://localhost:3000') => new NextRequest(`http://localhost:3000/api/auth/${path}`, {
  method: input ? 'POST' : 'GET', headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(input ? { 'Content-Type': 'application/json' } : {}) }, ...(input ? { body: JSON.stringify(input) } : {}),
});
const cookieHeader = (response: NextResponse) => response.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
test('datos demo: roles, área Ambas, cuentas inactivas y bloqueo de 15 minutos', async () => {
  let time = 0; const auth = createDemoAuth(() => time);
  for (let i = 0; i < 5; i++) await assert.rejects(auth.login({ ...loginInput, contrasena: 'incorrecta' }), { codigo: 'CREDENCIALES_INVALIDAS' });
  await assert.rejects(auth.login(loginInput), { codigo: 'CUENTA_BLOQUEADA' });
  time += 900001; assert.equal((await auth.login(loginInput)).empleado.rol, 'RECEPCION');
  await assert.rejects(auth.login({ ...loginInput, correo: 'inactivo@villaserena.gt' }), { codigo: 'CREDENCIALES_INVALIDAS' });
  const both = (await auth.login({ ...loginInput, correo: 'ambas@villaserena.gt' })).empleado;
  assert.ok(staffCanAccess(both, 'limpieza')); assert.ok(staffCanAccess(both, 'mantenimiento')); assert.ok(!staffCanAccess(both, 'admin'));
});
test('contraseña temporal: validaciones, tokens nuevos y contraseña anterior inválida', async () => {
  const auth = createDemoAuth(), old = await auth.login({ ...loginInput, correo: 'temporal@villaserena.gt' });
  assert.equal(old.empleado.debeCambiarContrasena, true);
  const input = { contrasenaActual: 'demo123', contrasenaNueva: 'NuevaClave123', confirmacion: 'NuevaClave123' };
  await assert.rejects(auth.change(old.accessToken, { ...input, confirmacion: 'otra' }), { codigo: 'DATOS_INVALIDOS' });
  await assert.rejects(auth.change(old.accessToken, { ...input, contrasenaActual: 'otra' }), { codigo: 'CONTRASENA_ACTUAL_INCORRECTA' });
  await assert.rejects(auth.change(old.accessToken, { ...input, contrasenaNueva: '12345678', confirmacion: '12345678' }), { codigo: 'CONTRASENA_INVALIDA' });
  const next = await auth.change(old.accessToken, input); assert.equal(next.empleado.debeCambiarContrasena, false);
  await assert.rejects(auth.yo(old.accessToken), { status: 401 }); await assert.rejects(auth.renew(old.refreshToken), { status: 401 });
  await assert.rejects(auth.login({ ...loginInput, correo: old.empleado.correo }), { status: 401 });
  assert.equal((await auth.login({ correo: old.empleado.correo, contrasena: input.contrasenaNueva })).empleado.debeCambiarContrasena, false);
});
test('refresh rotativo: vencimiento, revocación y cierre de sesión', async () => {
  let time = 0; const auth = createDemoAuth(() => time, 1), old = await auth.login(loginInput);
  time = 1001; await assert.rejects(auth.yo(old.accessToken), { status: 401 });
  const next = await auth.renew(old.refreshToken); await assert.rejects(auth.renew(old.refreshToken), { status: 401 });
  assert.equal((await auth.yo(next.accessToken)).rol, 'RECEPCION');
  await auth.logout(next.accessToken, next.refreshToken);
  await assert.rejects(auth.yo(next.accessToken), { status: 401 }); await assert.rejects(auth.renew(next.refreshToken), { status: 401 });
  const final = await auth.login(loginInput); time += 7 * 86400000 + 1; await assert.rejects(auth.renew(final.refreshToken), { status: 401 });
});
test('BFF: solo devuelve empleado; cookies HttpOnly, SameSite=Lax y Secure fuera de localhost', async () => {
  const response = await authRoute(request('login', loginInput), 'login'); assert.equal(response.status, 200);
  const employee = await response.json(); assert.deepEqual(Object.keys(employee).sort(), ['area', 'correo', 'debeCambiarContrasena', 'id', 'nombre', 'rol']);
  for (const c of response.cookies.getAll()) { assert.equal(c.httpOnly, true); assert.equal(c.sameSite, 'lax'); assert.equal(c.path, '/'); assert.equal(c.secure, false); }
  const secure = writeCookies(NextResponse.json({}), new Request('https://hotel.example/api/auth/login'), { accessToken: 'prueba', refreshToken: 'prueba', tipoToken: 'Bearer', expiraEn: 900 });
  assert.ok(secure.cookies.getAll().every(c => c.secure));
});
test('BFF: rechaza Origin ajeno o ausente', async () => {
  for (const origin of ['https://ajeno.example', 'null', '']) {
    const response = await authRoute(request('login', loginInput, undefined, origin), 'login'); assert.equal(response.status, 403);
  }
});
test('BFF: renovación automática sin acceso y cookies borradas si falla', async () => {
  const response = await authRoute(request('login', loginInput), 'login'), oldRefresh = response.cookies.get(REFRESH_COOKIE)!.value;
  const renewed = await authRoute(request('yo', undefined, `${REFRESH_COOKIE}=${oldRefresh}`), 'yo');
  assert.equal(renewed.status, 200); assert.notEqual(renewed.cookies.get(REFRESH_COOKIE)?.value, oldRefresh);
  const invalid = await authRoute(request('yo', undefined, `${REFRESH_COOKIE}=${oldRefresh}`), 'yo'); assert.equal(invalid.status, 401);
  assert.ok(invalid.cookies.getAll().every(c => c.maxAge === 0));
  const out = await authRoute(request('logout', {}, cookieHeader(renewed)), 'logout'); assert.equal(out.status, 204);
  const after = await authRoute(request('yo', undefined, cookieHeader(renewed)), 'yo'); assert.equal(after.status, 401);
});
test('BFF: una sola renovación ante 401 persistente y bloqueo de operaciones con temporal', async () => {
  const login = await authRoute(request('login', loginInput), 'login'); let calls = 0;
  const result = await withStaffSession(request('yo', undefined, cookieHeader(login)), async () => { calls++; throw new AuthError('SESION_VENCIDA', 401, 'Sesión vencida.'); });
  assert.equal(calls, 2); assert.equal(result.response?.status, 401);
  const temporal = await authRoute(request('login', { ...loginInput, correo: 'temporal@villaserena.gt' }), 'login');
  const blocked = await withStaffSession(request('yo', undefined, cookieHeader(temporal)), async () => 'no debe ejecutarse');
  assert.equal(blocked.response?.status, 403); assert.equal((await blocked.response!.json()).codigo, 'CONTRASENA_TEMPORAL');
});
test('adaptador Spring: contrato y rutas comprobados con transporte falso, sin API de Pablo', async () => {
  const calls: { path: string; method: string; body: unknown; authorization: string | null }[] = [];
  const mock: typeof fetch = async (url, init) => {
    calls.push({ path: new URL(String(url)).pathname, method: init!.method!, body: init!.body ? JSON.parse(String(init!.body)) : undefined, authorization: new Headers(init!.headers).get('Authorization') });
    const employee = { id: 1, nombre: 'Personal de prueba', correo: loginInput.correo, rol: 'RECEPCION', area: null, debeCambiarContrasena: false };
    return calls.at(-1)!.path.endsWith('cerrar-sesion') ? new Response(null, { status: 204 }) : Response.json(calls.at(-1)!.path.endsWith('/yo') ? employee : { accessToken: 'prueba', refreshToken: 'prueba', tipoToken: 'Bearer', expiraEn: 900, empleado: employee });
  };
  const api = createSpringAuth('http://localhost:8080', mock);
  await api.login(loginInput); await api.yo('servidor'); await api.renew('refresh'); await api.logout('servidor', 'refresh');
  await api.change('servidor', { contrasenaActual: 'demo123', contrasenaNueva: 'Nueva123', confirmacion: 'Nueva123' });
  assert.deepEqual(calls.map(c => c.path), ['login', 'yo', 'renovar', 'cerrar-sesion', 'cambiar-contrasena'].map(p => `/api/v1/auth/${p}`));
  assert.deepEqual(calls[0].body, loginInput); assert.deepEqual(calls[2].body, { refreshToken: 'refresh' }); assert.equal(calls[1].authorization, 'Bearer servidor');
});
test('respuestas incompletas se rechazan y campos adicionales nunca exponen tokens', () => {
  assert.throws(() => serverSession({}), { status: 502 });
  const employee = publicEmployee({ id: 1, nombre: 'Prueba', correo: loginInput.correo, rol: 'RECEPCION', area: null, debeCambiarContrasena: false, accessToken: 'no-exponer', refreshToken: 'no-exponer' });
  assert.ok(!('accessToken' in employee)); assert.ok(!('refreshToken' in employee));
  assert.ok(isAuthError(Object.assign(new Error('Vencida'), { codigo: 'SESION_VENCIDA', status: 401 })));
});
