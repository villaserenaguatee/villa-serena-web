import 'server-only';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { AuthError } from './auth/errors';
import { authError, readAuthJson, sameOrigin } from './auth/http';
import { readPublicContractState } from './publicContractStore';
import { readReceptionState } from './receptionDemo';
import { HUESPEDES_INICIALES, RESERVAS_INICIALES } from '@/data/pms';
import type { components } from '@/lib/api/schema';
import type { Huesped, Reserva } from '@/lib/pms/types';
import { demoStatus } from './publicContract';
import { confirmedBookingFixture } from './confirmedBookingFixture';

type Detail = components['schemas']['ReservaAppDetalle'];
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const state = globalThis as typeof globalThis & { vsGuestAccessV1?: {
  codes: Map<string, { hash: string; expires: number; failures: number; blockedUntil: number }>;
  sessions: Map<string, { correo: string; expires: number; family: string }>;
  refresh: Map<string, { correo: string; expires: number; family: string }>;
} };
const demo = () => state.vsGuestAccessV1 ??= { codes: new Map(), sessions: new Map(), refresh: new Map() };
export const GUEST_COOKIE = 'vs_guest_access';
const REFRESH_COOKIE = 'vs_guest_refresh';
export const DEMO_GUEST_EMAIL = 'ana.morales@correo.com';
// Adaptación del módulo demo existente; no añade operaciones al API de Spring.
export function guestPortalData(access: string, refresh: string, selectedCode?: string) {
  if ((process.env.GUEST_AUTH_MODE ?? 'demo') !== 'demo') return null;
  const store = demo(), now = Date.now();
  const session = store.sessions.get(hash(access)), renewed = store.refresh.get(hash(refresh));
  const identity = session && session.expires > now ? session : renewed && renewed.expires > now ? renewed : null;
  if (!identity) return null;
  if (selectedCode && !ownReservations(identity.correo).some(r => r.codigo === selectedCode)) return { supported: false as const, reason: 'reservation' as const };
  const entry = [...readPublicContractState().entries, confirmedBookingFixture].find(e => e.created.codigo === selectedCode && e.guest.correo.toLowerCase() === identity.correo);
  if (entry) {
    const created = entry.created, guest = entry.guest;
    const id = `public-guest-${hash(identity.correo)}`;
    const huesped: Huesped = { id, nombre: guest.nombreCompleto, correo: guest.correo, telefono: guest.telefono, nacionalidad: guest.nacionalidad, documento: guest.numeroDocumento, tipoDocumento: guest.tipoDocumento === 'DPI' ? 'DPI' : 'Pasaporte', creadoEn: '' };
    const status = demoStatus(created.codigo);
    const estados = { PENDIENTE_PAGO: 'pendiente', CONFIRMADA: 'confirmada', EN_ESTADIA: 'en-curso', CANCELADA: 'cancelada', FINALIZADA: 'finalizada' } as const;
    const reserva: Reserva = { id: `public-${created.codigo}`, codigo: created.codigo, codigoBff: created.codigo, huespedId: id, habitacionId: null, tipoHabitacion: entry.roomType!, fechaEntrada: created.entrada, fechaSalida: created.salida, personas: created.numeroHuespedes, estado: estados[status.estadoReserva], acompanantes: [], servicios: [], pagos: [], descuento: 0, creadoEn: '', canal: 'DIRECTO_WEB' };
    return { supported: true as const, huesped, reservas: [reserva], publicSummary: { total: created.total, estadoPago: status.estadoPago } };
  }
  const huesped = HUESPEDES_INICIALES.find(g => g.correo.toLowerCase() === identity.correo);
  if (!huesped) return { supported: false as const, reason: 'model' as const };
  const reservas = RESERVAS_INICIALES.filter(r => r.huespedId === huesped.id && (!selectedCode || r.codigo === selectedCode));
  if (!reservas.length) return { supported: false as const, reason: 'model' as const };
  return { supported: true as const, huesped, reservas };
}
function revoke(family: string) { for (const map of [demo().sessions, demo().refresh]) for (const [key, value] of map) if (value.family === family) map.delete(key); }
function issue(correo: string) {
  const store = demo(), family = randomUUID(), access = randomBytes(32).toString('base64url'), refresh = randomBytes(32).toString('base64url');
  for (const map of [store.sessions, store.refresh]) for (const [key, value] of map) if (value.expires <= Date.now()) map.delete(key);
  store.sessions.set(hash(access), { correo, family, expires: Date.now() + 900000 });
  store.refresh.set(hash(refresh), { correo, family, expires: Date.now() + 7 * 86400000 });
  return { access, refresh };
}
function cookies(response: NextResponse, request: NextRequest, tokens?: { access: string; refresh: string }) {
  const options = { httpOnly: true, sameSite: 'lax' as const, secure: request.nextUrl.protocol === 'https:', path: '/' };
  response.cookies.set(GUEST_COOKIE, tokens?.access ?? '', { ...options, maxAge: tokens ? 900 : 0 });
  response.cookies.set(REFRESH_COOKIE, tokens?.refresh ?? '', { ...options, maxAge: tokens ? 7 * 86400 : 0 });
  response.headers.set('Cache-Control', 'no-store'); return response;
}
// Fixture explícita del resultado confirmado, sin cambiar sus estados ni las reservas de Recepción.
function ownReservations(correo: string): Detail[] {
  const fixture = confirmedBookingFixture.created;
  const confirmed: Detail[] = correo === confirmedBookingFixture.guest.correo ? [{ codigo: fixture.codigo, entrada: fixture.entrada, salida: fixture.salida, estado: fixture.estado, tipoHabitacion: fixture.tipoHabitacion, numeroHuespedes: fixture.numeroHuespedes, horaCheckOut: '12:00', habitacion: null }] : [];
  const seeded: Detail[] = readReceptionState().entries.filter(e => e.detail.huesped.correo.toLowerCase() === correo).map(({ detail: r }) => ({
    codigo: r.codigo, entrada: r.entrada, salida: r.salida, estado: r.estado, horaCheckOut: '12:00',
    tipoHabitacion: r.tipoHabitacion, numeroHuespedes: r.numeroHuespedes, habitacion: r.habitacion,
  }));
  const publicState = readPublicContractState();
  const entries = publicState.entries.filter(e => e.guest.correo.toLowerCase() === correo).map(e => ({
    codigo: e.created.codigo, entrada: e.created.entrada, salida: e.created.salida,
    estado: Date.parse(e.created.pagoVenceEn) <= Date.now() ? 'CANCELADA' as const : 'PENDIENTE_PAGO' as const,
    horaCheckOut: '12:00' as const, tipoHabitacion: e.created.tipoHabitacion, numeroHuespedes: e.created.numeroHuespedes, habitacion: null,
  }));
  if (correo === DEMO_GUEST_EMAIL) seeded.push({ codigo: 'VS-DEMO01', entrada: '2026-11-10', salida: '2026-11-12', estado: 'CONFIRMADA', horaCheckOut: '12:00', tipoHabitacion: { id: 1, nombre: 'Standard' }, numeroHuespedes: 2, habitacion: null });
  const channels = (publicState.channels ?? []).filter(e => e.guest.correo.toLowerCase() === correo).map(({ reservation: r }) => ({ codigo: r.codigo, entrada: r.entrada, salida: r.salida, estado: r.estado, horaCheckOut: '12:00' as const, tipoHabitacion: r.tipoHabitacion, numeroHuespedes: r.numeroHuespedes, habitacion: null }));
  return [...new Map([...seeded, ...entries, ...channels, ...confirmed].map(r => [r.codigo, r])).values()];
}
export async function guestRoute(request: NextRequest, segments: string[]) {
  try {
    if (request.method !== 'GET') sameOrigin(request);
    if ((process.env.GUEST_AUTH_MODE ?? 'demo') !== 'demo') throw new AuthError('CONEXION_PENDIENTE', 503, 'El acceso no está disponible en este momento.');
    const store = demo(), now = Date.now();
    if (request.method === 'POST' && segments.join('/') === 'acceso/solicitar-codigo') {
      const { correo: raw } = await readAuthJson(request, ['correo']);
      const correo = raw.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) throw new AuthError('DATOS_INVALIDOS', 400, 'Escribe un correo válido.');
      const previous = store.codes.get(correo);
      if (ownReservations(correo).length && !(previous && previous.blockedUntil > now)) {
        const codigo = String(randomInt(100000, 1000000));
        store.codes.set(correo, { hash: hash(codigo), expires: now + 600000, failures: previous?.blockedUntil && previous.blockedUntil <= now ? 0 : previous?.failures ?? 0, blockedUntil: 0 });
        // Bandeja de prueba exclusiva del servidor; nunca se devuelve el código al navegador.
        const folder = resolve(process.cwd(), '.data/guest-outbox'); mkdirSync(folder, { recursive: true });
        writeFileSync(resolve(folder, `${hash(correo)}.json`), JSON.stringify({ correo, codigo, expiraEn: new Date(now + 600000).toISOString() }), { mode: 0o600 });
      }
      return NextResponse.json({ mensaje: 'Si el correo tiene reservas, recibirás un código para entrar.' }, { headers: { 'Cache-Control': 'no-store' } });
    }
    if (request.method === 'POST' && segments.join('/') === 'acceso/verificar-codigo') {
      const input = await readAuthJson(request, ['correo', 'codigo']); const correo = input.correo.trim().toLowerCase(); const code = store.codes.get(correo);
      if (!code || code.blockedUntil > now || code.expires <= now || code.hash !== hash(input.codigo)) {
        if (code && code.blockedUntil <= now && ++code.failures >= 5) code.blockedUntil = now + 900000;
        throw new AuthError('CODIGO_INVALIDO', 401, 'El código no es válido o venció. Solicita uno nuevo o espera si alcanzaste el límite de intentos.');
      }
      code.expires = 0; code.hash = ''; code.failures = 0; code.blockedUntil = 0; // Un solo uso; el acceso correcto termina la secuencia de fallos.
      return cookies(new NextResponse(null, { status: 204 }), request, issue(correo));
    }
    const token = request.cookies.get(GUEST_COOKIE)?.value ?? ''; let session = store.sessions.get(hash(token)); let rotated: ReturnType<typeof issue> | undefined;
    if (!session || session.expires <= now) {
      const refresh = store.refresh.get(hash(request.cookies.get(REFRESH_COOKIE)?.value ?? ''));
      if (!refresh || refresh.expires <= now) throw new AuthError('SESION_VENCIDA', 401, 'Verifica tu correo para consultar tu reserva.');
      revoke(refresh.family); rotated = issue(refresh.correo); session = store.sessions.get(hash(rotated.access))!;
    }
    if (request.method === 'POST' && segments.join('/') === 'cerrar-sesion') {
      revoke(session.family); return cookies(new NextResponse(null, { status: 204 }), request);
    }
    if (request.method === 'GET' && segments[0] === 'reservas' && segments.length <= 2) {
      const reservations = ownReservations(session.correo);
      const value = segments.length === 1 ? reservations.map(({ codigo, entrada, salida, estado }) => ({ codigo, entrada, salida, estado })) : reservations.find(r => r.codigo === segments[1]);
      const response = value ? NextResponse.json(value, { headers: { 'Cache-Control': 'no-store', 'X-Villa-Serena-Mode': 'demo' } }) : authError(new AuthError('RESERVA_NO_ENCONTRADA', 404, 'No se encontró la reserva.'));
      return rotated ? cookies(response, request, rotated) : response;
    }
    throw new AuthError('RUTA_NO_PERMITIDA', 403, 'Esta operación no está disponible.');
  } catch (error) { return authError(error); }
}
