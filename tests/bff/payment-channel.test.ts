import test, { describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { NextRequest, type NextResponse } from 'next/server';
import { POST } from '@/app/api/admin/canal-simulado/reservas/route';
import { GET as publicGet, POST as publicPost } from '@/app/api/publico/[...ruta]/route';
import { POST as proxyPost } from '@/app/api/[...ruta]/route';
import { authRoute } from '@/lib/bff/auth/http';
import { channelServerHeaders } from '@/lib/bff/channelCredentials';
import { readPublicContractState, contractHolds } from '@/lib/bff/publicContractStore';
import { demoCatalog, demoCreate, demoQuotes, demoPayment, demoStatus } from '@/lib/bff/publicContract';
import { paymentView } from '@/lib/paymentResult';
import { randomUUID } from 'node:crypto';
import type { ChannelInput } from '@/lib/bff/contracts/channel';

describe('Issue 6: resultado y canal exclusivamente simulados', () => {
  const keys = ['VILLA_SERENA_BFF_MODE', 'VILLA_SERENA_BFF_STATE_PATH', 'VILLA_SERENA_PUBLIC_CONTRACT_PATH', 'CANAL_BOOKING_CODIGO', 'CANAL_BOOKING_CLAVE'];
  let original: (string | undefined)[], directory: string;
  const origin = 'http://localhost:3006', path = '/api/admin/canal-simulado/reservas';
  const arrival = new Date(Date.now() + 150 * 86400000).toISOString().slice(0, 10);
  const departure = new Date(Date.parse(arrival) + 2 * 86400000).toISOString().slice(0, 10);
  beforeEach(() => {
    original = keys.map(k => process.env[k]); directory = mkdtempSync(join(tmpdir(), 'vs-issue6-'));
    process.env.VILLA_SERENA_BFF_MODE = 'demo'; process.env.VILLA_SERENA_BFF_STATE_PATH = join(directory, 'hotel.json');
    process.env.VILLA_SERENA_PUBLIC_CONTRACT_PATH = join(directory, 'public.json');
    process.env.CANAL_BOOKING_CODIGO = 'canal-servidor-prueba'; process.env.CANAL_BOOKING_CLAVE = 'clave-servidor-prueba-no-publica';
  });
  afterEach(() => { rmSync(directory, { recursive: true, force: true }); keys.forEach((k, i) => { if (original[i] === undefined) delete process.env[k]; else process.env[k] = original[i]; }); });
  const input = (): ChannelInput => ({ canal: 'BOOKING', reserva: { identificadorExterno: 'EXTERNO-01', tipoHabitacionId: 1, entrada: arrival, salida: departure, numeroHuespedes: 2, montoTotal: 840,
    huesped: { nombreCompleto: 'Prueba Canal', correo: 'canal@example.test', telefono: '+502 55550101', nacionalidad: 'Guatemala', tipoDocumento: 'DPI', numeroDocumento: '1234567890123' } } });
  const request = (body: unknown, cookie = '', requestOrigin = origin) => new NextRequest(origin + path, { method: 'POST', headers: { Origin: requestOrigin, Cookie: cookie, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  async function login(correo = 'admin@villaserena.gt') {
    const response = await authRoute(new NextRequest(origin + '/api/auth/login', { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ correo, contrasena: 'demo123' }) }), 'login');
    assert.equal(response.status, 200);
    return response.cookies.getAll().map(c => `${c.name}=${c.value}`).join('; ');
  }
  test('tres vistas, expiración y combinaciones inconsistentes rechazadas', async () => {
    for (const [code, expected] of [['VS-DEMO01', 'confirmed'], ['VS-DEMO02', 'processing'], ['VS-DEMO03', 'incomplete'], ['VS-DEMO04', 'incomplete']] as const) {
      const response = await publicGet(new Request(`${origin}/api/publico/reservas/${code}/estado?success=true&pagado=1`));
      assert.equal(response.status, 200); assert.equal(paymentView(await response.json(), code), expected);
    }
    assert.equal(paymentView(demoStatus('VS-DEMO02'), 'VS-DEMO02', true), 'incomplete');
    assert.throws(() => paymentView({ ...demoStatus('VS-DEMO02'), estadoReserva: 'CONFIRMADA' }, 'VS-DEMO02'));
    assert.throws(() => paymentView(demoStatus('VS-DEMO01'), 'VS-DEMO02'));
    assert.equal((await publicPost(new Request(`${origin}/api/publico/reservas/VS-DEMO04/pago`, { method: 'POST', headers: { Origin: origin } }))).status, 409);
  });
  test('regresar, repetir consultas y reintentar pago no confirman una reserva nueva', async () => {
    const created = demoCreate(input().reserva, randomUUID());
    const first = demoPayment(created.codigo, origin);
    for (let i = 0; i < 5; i++) {
      const response = await publicGet(new Request(`${origin}/api/publico/reservas/${created.codigo}/estado?estadoPago=APROBADO&success=true`));
      assert.equal((await response.json()).estadoReserva, 'PENDIENTE_PAGO');
      assert.deepEqual(demoPayment(created.codigo, origin), first);
    }
    assert.equal(readPublicContractState().entries.length, 1);
  });
  test('ADMIN recibe 201 y repetición 200 con la misma reserva, también tras leer del disco', async () => {
    const cookie = await login(), first = await POST(request(input(), cookie));
    assert.equal(first.status, 200); const created = await first.json(); assert.equal(created.codigoHttp, 201);
    assert.equal(created.respuesta.estado, 'CONFIRMADA'); assert.equal(created.respuesta.canal, 'BOOKING');
    const second = await (await POST(request(input(), cookie))).json(); assert.equal(second.codigoHttp, 200); assert.deepEqual(second.respuesta, created.respuesta);
    const changed = input(); changed.reserva.montoTotal = 2000;
    assert.deepEqual((await (await POST(request(changed, cookie))).json()).respuesta, created.respuesta);
    assert.equal(readPublicContractState().channels?.length, 1); assert.equal(contractHolds().length, 1);
    assert.ok(!JSON.stringify(created).includes(process.env.CANAL_BOOKING_CLAVE!));
    assert.deepEqual(Object.keys(created.respuesta).sort(), ['codigo', 'estado', 'canal', 'identificadorExterno', 'tipoHabitacion', 'entrada', 'salida', 'numeroHuespedes', 'montoTotal'].sort());
  });
  test('idempotencia por canal e identificador y envíos concurrentes', async () => {
    const cookie = await login();
    const results = await Promise.all(Array.from({ length: 4 }, () => POST(request(input(), cookie)).then(r => r.json())));
    assert.deepEqual(results.map(r => r.codigoHttp).sort(), [200, 200, 200, 201]);
    assert.equal(new Set(results.map(r => r.respuesta.codigo)).size, 1);
    const expedia = { ...input(), canal: 'EXPEDIA' as const };
    assert.equal((await (await POST(request(expedia, cookie))).json()).codigoHttp, 201);
    assert.equal(readPublicContractState().channels?.length, 2);
  });
  test('Recepción, otros roles, sin sesión, temporal, Origin ajeno y proxy no pueden enviar', async () => {
    assert.equal((await POST(request(input()))).status, 401);
    for (const correo of ['recepcion@villaserena.gt', 'temporal@villaserena.gt', 'ambas@villaserena.gt']) {
      const response = await POST(request(input(), await login(correo))); assert.equal(response.status, 403);
    }
    const cookie = await login();
    assert.equal((await POST(request(input(), cookie, 'https://ajeno.example'))).status, 403);
    assert.equal((await POST(request(input(), cookie, ''))).status, 403);
    for (const ruta of [['canal', 'reservas'], ['admin', 'canal-simulado'], ['admin', 'canal-simulado', 'otro']])
      assert.equal((await proxyPost(request(input(), cookie), { params: Promise.resolve({ ruta }) })).status, 403);
    assert.equal(readPublicContractState().channels?.length ?? 0, 0);
  });
  test('renueva sesión ADMIN sin exponer tokens en el resultado', async () => {
    const cookie = (await login()).split('; ').filter(c => c.startsWith('vs_staff_refresh=')).join('; ');
    const response = await POST(request(input(), cookie)); assert.equal(response.status, 200);
    assert.ok((response as NextResponse).cookies.getAll().every(c => c.httpOnly));
    assert.ok(!JSON.stringify(await response.json()).includes('Token'));
  });
  test('validación, falta de cupo y claves ajenas nunca se reflejan', async () => {
    const cookie = await login();
    for (const mutate of [(v: ChannelInput) => v.reserva.montoTotal = 0, (v: ChannelInput) => v.reserva.huesped.correo = 'mal', (v: ChannelInput) => v.reserva.identificadorExterno = 'x'.repeat(61)]) {
      const value = input(); mutate(value); assert.equal((await POST(request(value, cookie))).status, 400);
    }
    for (const mutate of [(v: ChannelInput) => v.reserva.entrada = '2020-01-01', (v: ChannelInput) => v.reserva.numeroHuespedes = 3, (v: ChannelInput) => v.reserva.salida = v.reserva.entrada]) {
      const value = input(); mutate(value); assert.equal((await (await POST(request(value, cookie))).json()).codigoHttp, 400);
    }
    const leaked = await POST(request({ ...input(), clave: process.env.CANAL_BOOKING_CLAVE }, cookie));
    assert.equal(leaked.status, 400); assert.ok(!(await leaked.text()).includes(process.env.CANAL_BOOKING_CLAVE!));
    const count = demoCatalog().find(t => t.id === 1)!;
    let creations = 0;
    while (demoQuotes(arrival, departure, 2).some(q => q.tipoHabitacion.id === count.id)) {
      const next = input(); next.reserva.identificadorExterno = `CUPOS-${creations++}`;
      assert.equal((await (await POST(request(next, cookie))).json()).codigoHttp, 201);
      assert.ok(creations < 50);
    }
    assert.equal((await (await POST(request(input(), cookie))).json()).codigoHttp, 409);
    assert.throws(() => demoCreate(input().reserva, randomUUID()), { status: 409 });
    assert.equal(readPublicContractState().channels?.length, creations);
  });
  test('modo real no usa fixtures ni simula éxito; configuración solo del servidor', async () => {
    const headers = channelServerHeaders('BOOKING'); assert.equal(headers.get('X-Canal-Clave'), process.env.CANAL_BOOKING_CLAVE);
    assert.equal(headers.get('X-Canal-Codigo'), process.env.CANAL_BOOKING_CODIGO);
    process.env.VILLA_SERENA_BFF_MODE = 'api';
    assert.equal((await POST(request(input(), await login()))).status, 503);
    assert.equal((await publicGet(new Request(`${origin}/api/publico/reservas/VS-DEMO01/estado`))).status, 503);
    delete process.env.CANAL_BOOKING_CLAVE; assert.throws(() => channelServerHeaders('BOOKING'), { status: 503 });
  });
  test('almacenamiento corrupto de canales falla sin simular inventario libre', async () => {
    const cookie = await login(); await POST(request(input(), cookie));
    const file = process.env.VILLA_SERENA_PUBLIC_CONTRACT_PATH!, state = JSON.parse(readFileSync(file, 'utf8'));
    state.channels.push(state.channels[0]); writeFileSync(file, JSON.stringify(state));
    assert.equal((await POST(request(input(), cookie))).status, 503);
    assert.throws(() => demoQuotes(arrival, departure, 2), { status: 503 });
  });
});
