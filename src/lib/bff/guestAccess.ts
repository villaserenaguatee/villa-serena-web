import 'server-only';
import {readLimitedBody} from '@/lib/bff/readLimitedBody';
import { createHash, randomBytes, randomInt, randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { AuthError, isAuthError } from './auth/errors';
import { authError, readAuthJson, sameOrigin } from './auth/http';
import { readPublicContractState } from './publicContractStore';
import { readReceptionState } from './receptionDemo';
import { HUESPEDES_INICIALES, RESERVAS_INICIALES } from '@/data/pms';
import type { components } from '@/lib/api/schema';
import type { Huesped, Reserva } from '@/lib/pms/types';
import { demoStatus } from './publicContract';
import { confirmedBookingFixture } from './confirmedBookingFixture';
import { serverTokens } from './auth/response';

type SpringTokens = ReturnType<typeof serverTokens>;
const springState = globalThis as typeof globalThis & { vsGuestSpringRenewals?: Map<string, Promise<SpringTokens>> };
async function springCall(path: string, method: string, input?: unknown, access?: string, attempt?:string) {
  if (!process.env.API_URL) throw new AuthError('CONFIGURACION_INVALIDA', 503, 'Revisa la configuración del API.');
  let response: Response;
  try {
    response = await fetch(new URL(`/api/v1/${path}`, process.env.API_URL), {
      method, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: { Accept: 'application/json', ...(input ? { 'Content-Type': 'application/json' } : {}), ...(access ? { Authorization: `Bearer ${access}` } : {}), ...(attempt?{'Idempotency-Key':attempt}:{}) },
      ...(input ? { body: JSON.stringify(input) } : {}),
    });
  } catch { throw new AuthError('API_NO_DISPONIBLE', 502, 'No se pudo contactar al API.'); }
  if(response.ok&&/\/documentos\/\d+\/archivo$/.test(path))return {archivo:await response.arrayBuffer(),mime:response.headers.get('content-type')??'application/octet-stream'};
  const value = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) throw new AuthError(value?.codigo ?? 'ERROR_API', response.status, value?.mensaje ?? 'No se pudo completar la petición.');
  return value;
}
async function renewGuest(refresh: string): Promise<SpringTokens> {
  if (!refresh) throw new AuthError('SESION_VENCIDA', 401, 'Verifica tu correo para consultar tu reserva.');
  // Pestañas y verificaciones simultáneas comparten una sola rotación del refresh.
  // La clave es un hash; los tokens nuevos se conservan solo durante esta breve ventana.
  const pending = springState.vsGuestSpringRenewals ??= new Map();
  const key = hash(`${process.env.API_URL}|${refresh}`);
  let renewal = pending.get(key);
  if (!renewal) {
    renewal = springCall('auth/renovar', 'POST', { refreshToken: refresh }).then(serverTokens);
    pending.set(key, renewal);
    renewal.then(() => { setTimeout(() => pending.delete(key), 3000).unref(); }, () => pending.delete(key));
  }
  return renewal;
}
async function springGuestRoute(request: NextRequest, segments: string[]) {
  const path = segments.join('/');
  const requestCode = request.method === 'POST' && path === 'acceso/solicitar-codigo';
  const verify = request.method === 'POST' && path === 'acceso/verificar-codigo';
  const logout = request.method === 'POST' && path === 'cerrar-sesion';
  const resume = request.method === 'GET' && path === 'sesion';
  const profile = request.method === 'GET' && path === 'perfil';
  const query = request.method === 'GET' && segments[0] === 'reservas' && segments.length <= 2;
  const account = request.method === 'GET' && segments.length === 3 && segments[0] === 'reservas' && /^VS-[A-Z0-9]{6}$/.test(segments[1]) && ['cuenta','checkout'].includes(segments[2]);
  const checkout = request.method === 'POST' && segments.length === 3 && segments[0] === 'reservas' && /^VS-[A-Z0-9]{6}$/.test(segments[1]) && segments[2] === 'checkout';
  const payment = request.method==='POST'&&segments.length===3&&segments[0]==='reservas'&&/^VS-[A-Z0-9]{6}$/.test(segments[1])&&segments[2]==='pago-saldo';
  const editMessage=segments[0]==='reservas'&&/^VS-[A-Z0-9]{6}$/.test(segments[1]??'')&&segments[2]==='chat'&&segments.length===4&&/^\d+$/.test(segments[3])&&['PUT','DELETE'].includes(request.method);
  const communication = segments[0]==='reservas'&&/^VS-[A-Z0-9]{6}$/.test(segments[1]??'')&&((segments.length===3&&['chat','documentos'].includes(segments[2])&&['GET','POST'].includes(request.method))||(request.method==='GET'&&segments.length===5&&segments[2]==='documentos'&&/^\d+$/.test(segments[3])&&segments[4]==='archivo'));
  const invoice = request.method==='GET'&&segments[0]==='reservas'&&/^VS-[A-Z0-9]{6}$/.test(segments[1]??'')&&segments[2]==='factura'&&(segments.length===3||(segments.length===4&&segments[3]==='pdf'));
  const articles = segments.length===3&&segments[0]==='reservas'&&/^VS-[A-Z0-9]{6}$/.test(segments[1])&&((segments[2]==='articulos'&&request.method==='GET')||(segments[2]==='solicitudes-articulos'&&request.method==='POST'));
  const cleaning = segments.length===3 && segments[0]==='reservas' && /^VS-[A-Z0-9]{6}$/.test(segments[1]) && segments[2]==='solicitudes-limpieza' && ['GET','POST'].includes(request.method);
  const menu = request.method==='GET' && segments.length===3 && segments[0]==='reservas' && /^VS-[A-Z0-9]{6}$/.test(segments[1]) && segments[2]==='menu';
  const orders = segments.length===3 && segments[0]==='reservas' && /^VS-[A-Z0-9]{6}$/.test(segments[1]) && segments[2]==='pedidos' && ['GET','POST'].includes(request.method);
  if (!requestCode && !verify && !logout && !query && !resume && !account && !checkout && !payment && !profile && !menu && !orders && !cleaning && !communication && !editMessage && !articles && !invoice) throw new AuthError('RUTA_NO_PERMITIDA', 403, 'Esta operación no está disponible.');
  if (!process.env.API_URL) throw new AuthError('CONFIGURACION_INVALIDA', 503, 'Revisa la configuración del API.');
  let access = request.cookies.get(GUEST_COOKIE)?.value ?? '';
  let refresh = request.cookies.get(REFRESH_COOKIE)?.value ?? '';
  let rotated: SpringTokens | undefined;
  let input: unknown = requestCode || verify ? await readAuthJson(request, verify ? ['correo', 'codigo'] : ['correo']) : undefined;
  if(((communication||articles)&&request.method==='POST')||(editMessage&&request.method==='PUT')){
    const raw=await readLimitedBody(request,segments[2]==='documentos'?7100000:16384);if(raw.length>(segments[2]==='documentos'?7100000:16000))throw new AuthError('DATOS_INVALIDOS',400,'Contenido demasiado largo.');
    try{input=JSON.parse(raw);}catch{throw new AuthError('DATOS_INVALIDOS',400,'Revisa el contenido.');}
  }
  if(cleaning&&request.method==='POST'){
    const raw=await readLimitedBody(request,segments[2]==='documentos'?7100000:16384);if(raw.length>4096)throw new AuthError('DATOS_INVALIDOS',400,'Comentario demasiado largo.');
    try{input=JSON.parse(raw);}catch{throw new AuthError('DATOS_INVALIDOS',400,'Revisa el comentario.');}
    const value=input as {comentario?:unknown};if(!value||value.comentario!==undefined&&(typeof value.comentario!=='string'||value.comentario.length>500))throw new AuthError('DATOS_INVALIDOS',400,'El comentario admite hasta 500 caracteres.');
  }
  if (checkout) {
    const raw = await readLimitedBody(request,segments[2]==='documentos'?7100000:16384);
    if (raw.length > 16384) throw new AuthError('DATOS_INVALIDOS',400,'Los datos son demasiado largos.');
    try {input = JSON.parse(raw);} catch {throw new AuthError('DATOS_INVALIDOS',400,'Revisa los datos del comprador.');}
    const value = input as {comprador?:{nit?:unknown;nombreComprador?:unknown};aceptaCancelarPedidos?:unknown};
    if (typeof value?.comprador?.nit !== 'string' || typeof value.comprador.nombreComprador !== 'string' || typeof value.aceptaCancelarPedidos !== 'boolean') throw new AuthError('DATOS_INVALIDOS',400,'Revisa los datos del comprador.');
  }
  const attempt=orders&&request.method==='POST'?request.headers.get('Idempotency-Key'):null;
  if(orders&&request.method==='POST'){
    if(!attempt||!/^[a-zA-Z0-9_-]{16,100}$/.test(attempt))throw new AuthError('DATOS_INVALIDOS',400,'Identificador de solicitud inválido.');
    const raw=await readLimitedBody(request,segments[2]==='documentos'?7100000:16384);if(raw.length>16384)throw new AuthError('DATOS_INVALIDOS',400,'El pedido es demasiado largo.');
    try{input=JSON.parse(raw);}catch{throw new AuthError('DATOS_INVALIDOS',400,'Revisa el pedido.');}
  }
  const code = request.nextUrl.searchParams.get('codigo') ?? '';
  const loginPath = `/login?acceso=huesped&codigo=${encodeURIComponent(code)}`;
  const apply = (response: NextResponse) => rotated ? cookies(response, request, { access: rotated.accessToken, refresh: rotated.refreshToken, expiresIn: rotated.expiraEn }) : response;
  try {
    const operation = async () => {
      if(invoice&&segments[3]==='pdf'){const f=await springCall(`app/reservas/${segments[1]}/factura`,'GET',undefined,access);return springCall(`facturas/${f.id}/pdf`,'GET',undefined,access);}
      if(menu)await springCall(`app/reservas/${encodeURIComponent(segments[1])}`,'GET',undefined,access);
      return springCall(`app/${resume ? 'reservas' : segments.map(encodeURIComponent).join('/')}`, resume ? 'GET' : request.method,
      logout ? { refreshToken: refresh } : input, requestCode || verify ? undefined : access,attempt??undefined);
    };
    let value;
    try { value = await operation(); }
    catch (error) {
      if (requestCode || verify || !isAuthError(error) || error.status !== 401) throw error;
      rotated = await renewGuest(refresh);
      access = rotated.accessToken; refresh = rotated.refreshToken;
      value = await operation();
    }
    if(communication&&request.method==='GET'&&segments.at(-1)==='archivo')return apply(new NextResponse(value.archivo,{headers:{'Content-Type':value.mime,'Content-Disposition':'attachment','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':"sandbox; default-src 'none'"}}));
    if (verify) {
      const tokens = serverTokens(value);
      return cookies(new NextResponse(null, { status: 204 }), request, { access: tokens.accessToken, refresh: tokens.refreshToken, expiresIn: tokens.expiraEn });
    }
    if (logout) {
      const pending = springState.vsGuestSpringRenewals;
      pending?.delete(hash(`${process.env.API_URL}|${request.cookies.get(REFRESH_COOKIE)?.value ?? ''}`));
      return cookies(new NextResponse(null, { status: 204 }), request);
    }
    if (resume) {
      const target=new URL('/portal',request.url),section=request.nextUrl.searchParams.get('seccion');
      if(code)target.searchParams.set('codigo',code);
      if(section&&['inicio','checkin','restaurante','servicios','chat','habitacion','experiencias','cuenta','reservar'].includes(section))target.searchParams.set('seccion',section);
      return apply(NextResponse.redirect(target));
    }
    return apply(NextResponse.json(value, {status:orders&&request.method==='POST'?201:200, headers: { 'Cache-Control': 'no-store' } }));
  } catch (error) {
    // A failed remote revocation must never preserve this browser's session.
    // Keep the error visible; clearing cookies does not assert server revocation.
    if (logout) return cookies(authError(error), request);
    if (!requestCode && !verify && isAuthError(error) && error.status === 401) {
      const response = resume ? NextResponse.redirect(new URL(loginPath, request.url)) : authError(error);
      return cookies(response, request);
    }
    return apply(authError(error));
  }
}

type Detail = components['schemas']['ReservaAppDetalle'];
const hash = (s: string) => createHash('sha256').update(s).digest('hex');
const state = globalThis as typeof globalThis & { vsGuestAccessV1?: {
  codes: Map<string, { hash: string; expires: number; failures: number; blockedUntil: number }>;
  sessions: Map<string, { correo: string; expires: number; family: string }>;
  refresh: Map<string, { correo: string; expires: number; family: string }>;
} };
const demo = () => state.vsGuestAccessV1 ??= { codes: new Map(), sessions: new Map(), refresh: new Map() };
export const GUEST_COOKIE = 'vs_guest_access';
export const REFRESH_COOKIE = 'vs_guest_refresh';
export const DEMO_GUEST_EMAIL = 'ana.morales@correo.com';
export async function connectedGuestPortalData(access: string, code?: string) {
  const request = new NextRequest('http://localhost/api/app/reservas', { headers: { Cookie: `${GUEST_COOKIE}=${encodeURIComponent(access)}` } });
  try {
    const read = async (response: NextResponse) => {
      const value = await response.json();
      if (!response.ok) throw new AuthError(value?.codigo ?? 'ERROR_API', response.status, value?.mensaje ?? 'No se pudo consultar la reserva.');
      return value;
    };
    const response = await springGuestRoute(request, code ? ['reservas', code] : ['reservas']);
    const value = await read(response);
    const details: Detail[] = code ? [value] : await Promise.all(value.map(async (r: { codigo: string }) => {
      const detail = await springGuestRoute(request, ['reservas', r.codigo]);
      return read(detail);
    }));
    // Identidad estable solo después de validar el token con el API; el DTO
    // del huésped no incluye nombre, correo ni documento del perfil.
    const claims = JSON.parse(Buffer.from(access.split('.')[1], 'base64url').toString());
    const id = `api-guest-${claims.sub}`;
    const profile = await springCall('app/perfil','GET',undefined,access);
    const huesped: Huesped = { id, nombre:profile.nombreCompleto, correo:profile.correo, telefono:profile.telefono, nacionalidad:profile.nacionalidad, tipoDocumento:profile.tipoDocumento==='DPI'?'DPI':'Pasaporte', documento:profile.numeroDocumento, creadoEn:profile.creadoEn };
    const states = { PENDIENTE_PAGO: 'pendiente', CONFIRMADA: 'confirmada', EN_ESTADIA: 'en-curso', FINALIZADA: 'finalizada', CANCELADA: 'cancelada' } as const;
    const reservas: Reserva[] = details.map(d => ({ id: `api-reservation-${d.codigo}`, codigo: d.codigo, codigoBff: d.codigo, huespedId: id, habitacionId: d.habitacion ? `api-room-${d.habitacion.id}` : null, tipoHabitacion: d.tipoHabitacion.nombre as Reserva['tipoHabitacion'], fechaEntrada: d.entrada, fechaSalida: d.salida, personas: d.numeroHuespedes, estado: states[d.estado], acompanantes: [], servicios: [], pagos: [], descuento: 0, creadoEn: '' }));
    const habitaciones = details.flatMap(d => d.habitacion ? [{ id: 'api-room-' + d.habitacion.id, numero: d.habitacion.numero, piso: d.habitacion.piso, tipo: d.tipoHabitacion.nombre as Reserva['tipoHabitacion'], capacidad: d.numeroHuespedes, precioNoche: 0, estado: (d.estado === 'EN_ESTADIA' ? 'ocupada' : 'reservada') as import('@/lib/pms/types').EstadoHabHotel }] : []);
    return { supported: true as const, huesped, reservas, habitaciones, publicSummary: undefined };
  } catch (error) {
    if (error instanceof AuthError && error.status === 401) return null;
    if (error instanceof AuthError && error.status === 404) return { supported: false as const, reason: 'reservation' as const };
    throw error;
  }
}
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
function cookies(response: NextResponse, request: NextRequest, tokens?: { access: string; refresh: string; expiresIn?: number }) {
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(request.nextUrl.hostname);
  const options = { httpOnly: true, sameSite: 'lax' as const, secure: !local || request.nextUrl.protocol === 'https:', path: '/' };
  response.cookies.set(GUEST_COOKIE, tokens?.access ?? '', { ...options, maxAge: tokens ? tokens.expiresIn ?? 900 : 0 });
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
    if (process.env.GUEST_AUTH_MODE === 'spring') return await springGuestRoute(request, segments);
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

export { cookies as writeGuestCookies };
