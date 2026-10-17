import 'server-only';
import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { mkdir, open } from 'node:fs/promises';
import path from 'node:path';
import { NextRequest, NextResponse } from 'next/server';
import { readLimitedBody } from './readLimitedBody';
import { writeBookingEmailProof } from './bookingEmailVerification';

type Provider = 'google' | 'facebook';
type Transaction = { provider: Provider; state: string; verifier: string; query: string; draft: string; expires: number };
type Profile = { draft: string; provider: Provider; nombre: string; apellidos: string; correo: string; expires: number };
const FLOW = 'vs_booking_oauth', PROFILE = 'vs_booking_profile';
const publicKeys = ['habitacion', 'slug', 'habitacionId', 'tipoHabitacionId', 'categoria', 'precio', 'noches', 'llegada', 'salida', 'adultos', 'ninos', 'huespedes', 'total', 'draft'];
const noStore = { 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
const budget = globalThis as typeof globalThis & { bookingOAuthBudget?: { until: number; used: number } };
function origin() {
  const url = new URL(process.env.BOOKING_OAUTH_ORIGIN || 'http://localhost:3054');
  if (url.username || url.password || url.pathname !== '/' || url.search || url.hash || (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('configuration');
  return url.origin;
}
function key() {
  const value = process.env.BOOKING_OAUTH_COOKIE_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(value)) throw new Error('configuration');
  return Buffer.from(value, 'hex');
}
function seal(value: Transaction | Profile) {
  const iv = randomBytes(12), cipher = createCipheriv('aes-256-gcm', key(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64url');
}
function unseal<T extends { expires: number }>(value: string | undefined, allowExpired = false): T {
  if (!value || value.length > 8000) throw new Error('invalid');
  const bytes = Buffer.from(value, 'base64url'), decipher = createDecipheriv('aes-256-gcm', key(), bytes.subarray(0, 12));
  decipher.setAuthTag(bytes.subarray(12, 28));
  const result = JSON.parse(Buffer.concat([decipher.update(bytes.subarray(28)), decipher.final()]).toString()) as T;
  if (!allowExpired && result.expires < Date.now()) throw new Error('expired');
  return result;
}
function cookieOptions() { return { httpOnly: true, sameSite: 'lax' as const, secure: origin().startsWith('https:'), path: '/api/auth/booking-social', maxAge: 600 }; }
function config(provider: Provider) {
  const prefix = provider === 'google' ? 'GOOGLE' : 'FACEBOOK';
  const id = process.env[`${prefix}_CLIENT_ID`], secret = process.env[`${prefix}_CLIENT_SECRET`];
  const version = process.env.FACEBOOK_GRAPH_VERSION;
  if (!id || !secret || (provider === 'facebook' && !/^v\d+\.\d+$/.test(version || ''))) throw new Error('configuration');
  key();
  return { id, secret, version, callback: `${origin()}/api/auth/booking-social/${provider}/callback` };
}
function providerValue(value: string): Provider { if (value !== 'google' && value !== 'facebook') throw new Error('invalid'); return value; }
async function fetchJson(url: string, init: RequestInit = {}): Promise<Record<string, unknown>> {
  const response = await fetch(url, { ...init, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error('provider');
  const result = await response.json();
  if (!result || typeof result !== 'object' || result.error) throw new Error('provider');
  return result;
}
// A durable one-use marker, containing no identity, tokens or reservation data.
async function consume(state: string) {
  const directory = path.resolve(process.env.BOOKING_OAUTH_STATE_DIR || '.data/booking-oauth-used');
  await mkdir(directory, { recursive: true });
  const file = await open(path.join(directory, createHash('sha256').update(state).digest('hex')), 'wx', 0o600);
  await file.close();
}
export async function startBookingSocial(request: NextRequest, rawProvider: string) {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin || new URL(request.url).origin !== origin()) return NextResponse.json({ codigo: 'ORIGIN_NO_PERMITIDO' }, { status: 403, headers: noStore });
    if (!budget.bookingOAuthBudget || budget.bookingOAuthBudget.until <= Date.now()) budget.bookingOAuthBudget = { until: Date.now() + 60000, used: 0 };
    if (++budget.bookingOAuthBudget.used > 30) return NextResponse.json({ codigo: 'SOCIAL_LIMITE' }, { status: 429, headers: { ...noStore, 'Retry-After': '60' } });
    const provider = providerValue(rawProvider), input = JSON.parse(await readLimitedBody(request, 6000));
    if (typeof input.query !== 'string' || input.query.length > 1800) throw new Error('invalid');
    const supplied = new URLSearchParams(input.query), query = new URLSearchParams();
    for (const name of publicKeys) if (supplied.has(name)) query.set(name, supplied.get(name)!);
    const draft = query.get('draft') || '';
    if (!/^[0-9a-f-]{36}$/i.test(draft)) throw new Error('invalid');
    const settings = config(provider), state = randomBytes(32).toString('base64url'), verifier = randomBytes(32).toString('base64url');
    const url = new URL(provider === 'google' ? 'https://accounts.google.com/o/oauth2/v2/auth' : `https://www.facebook.com/${settings.version}/dialog/oauth`);
    url.search = new URLSearchParams({ client_id: settings.id, redirect_uri: settings.callback, response_type: 'code', scope: provider === 'google' ? 'openid email profile' : 'public_profile,email', state }).toString();
    if (provider === 'google') { url.searchParams.set('code_challenge', createHash('sha256').update(verifier).digest('base64url')); url.searchParams.set('code_challenge_method', 'S256'); }
    const response = NextResponse.json({ url: url.toString() }, { headers: noStore });
    response.cookies.set(FLOW, seal({ provider, state, verifier, query: query.toString(), draft, expires: Date.now() + 600000 }), { ...cookieOptions(), maxAge: 7200 });
    response.cookies.set(PROFILE, '', { ...cookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    const configuration = error instanceof Error && error.message === 'configuration';
    return NextResponse.json({ codigo: configuration ? 'SOCIAL_NO_CONFIGURADO' : 'SOCIAL_SOLICITUD_INVALIDA' }, { status: configuration ? 503 : 400, headers: noStore });
  }
}
export async function callbackBookingSocial(request: NextRequest, rawProvider: string) {
  let flow: Transaction | undefined;
  let status = 'error';
  let profile: Profile | undefined;
  let bookingReceipt = '';
  try {
    const provider = providerValue(rawProvider);
    flow = unseal<Transaction>(request.cookies.get(FLOW)?.value, true);
    if (flow.expires < Date.now()) throw new Error('expired');
    const state = request.nextUrl.searchParams.get('state') || '';
    if (provider !== flow.provider || state.length !== flow.state.length || !timingSafeEqual(Buffer.from(state), Buffer.from(flow.state))) throw new Error('invalid');
    await consume(state);
    if (request.nextUrl.searchParams.has('error')) { status = request.nextUrl.searchParams.get('error') === 'access_denied' ? 'cancelled' : 'error'; }
    else {
      const code = request.nextUrl.searchParams.get('code');
      if (!code || code.length > 4096) throw new Error('invalid');
      const settings = config(provider);
      const token = await fetchJson(provider === 'google' ? 'https://oauth2.googleapis.com/token' : `https://graph.facebook.com/${settings.version}/oauth/access_token`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ client_id: settings.id, client_secret: settings.secret, redirect_uri: settings.callback, code, ...(provider === 'google' ? { grant_type: 'authorization_code', code_verifier: flow.verifier } : {}) }) });
      if (typeof token.access_token !== 'string') throw new Error('provider');
      const url = new URL(provider === 'google' ? 'https://openidconnect.googleapis.com/v1/userinfo' : `https://graph.facebook.com/${settings.version}/me`);
      if (provider === 'facebook') { url.searchParams.set('fields', 'id,first_name,last_name,email'); url.searchParams.set('appsecret_proof', createHmac('sha256', settings.secret).update(token.access_token).digest('hex')); }
      const user = await fetchJson(url.toString(), { headers: { Authorization: `Bearer ${token.access_token}` } });
      if (typeof user[provider === 'google' ? 'sub' : 'id'] !== 'string') throw new Error('provider');
      const text = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
      // Profile data only. No account linking, guest/staff token issuance or email-verification receipt.
      const email = text(user.email, 150);
      profile = { provider, draft: flow.draft, nombre: text(user[provider === 'google' ? 'given_name' : 'first_name'], 75), apellidos: text(user[provider === 'google' ? 'family_name' : 'last_name'], 75), correo: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && (provider !== 'google' || user.email_verified === true) ? email : '', expires: Date.now() + 600000 };
      if (provider === 'google' && profile.correo && typeof token.id_token === 'string' && process.env.API_URL) {
        try {
          const proof = await fetchJson(new URL('/api/v1/publico/correo/google', process.env.API_URL).toString(), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ correo: profile.correo, borrador: flow.draft, idToken: token.id_token }) });
          if (proof.verificado === true && typeof proof.comprobante === 'string' && /^[A-Za-z0-9_-]{43}$/.test(proof.comprobante)) bookingReceipt = proof.comprobante;
        } catch { console.warn('Booking Google email verification unavailable; email challenge remains required.'); }
      }
      status = 'profile';
    }
  } catch { /* Never forward provider errors, codes or tokens to the page. */ }
  const target = new URL('/reservar/datos', origin());
  if (flow) target.search = flow.query;
  target.searchParams.set('social', status);
  const response = NextResponse.redirect(target, 303);
  for (const [name, value] of Object.entries(noStore)) response.headers.set(name, value);
  response.cookies.set(FLOW, '', { ...cookieOptions(), maxAge: 0 });
  response.cookies.set(PROFILE, profile ? seal(profile) : '', { ...cookieOptions(), maxAge: profile ? 600 : 0 });
  if (bookingReceipt && flow) writeBookingEmailProof(response, request, flow.draft, bookingReceipt);
  return response;
}
export function readBookingSocialProfile(request: NextRequest) {
  try {
    const profile = unseal<Profile>(request.cookies.get(PROFILE)?.value);
    if (profile.draft !== request.nextUrl.searchParams.get('draft')) throw new Error('invalid');
    return NextResponse.json({ provider: profile.provider, nombre: profile.nombre, apellidos: profile.apellidos, correo: profile.correo }, { headers: noStore });
  } catch { return NextResponse.json({ codigo: 'SOCIAL_PERFIL_NO_DISPONIBLE' }, { status: 401, headers: noStore }); }
}
