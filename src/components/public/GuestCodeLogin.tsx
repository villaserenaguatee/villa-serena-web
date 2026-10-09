"use client";
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Mail, LockKeyhole, ArrowLeft } from 'lucide-react';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
export default function GuestCodeLogin({ code, fromHome = false }: { code: string; fromHome?: boolean }) {
  const { en } = usePublicLanguage();
  const [email, setEmail] = useState(''), [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState('');
  const destination = code ? `/portal?codigo=${encodeURIComponent(code)}` : '/portal';
  useEffect(() => { let active = true; fetch(code ? `/api/app/reservas/${encodeURIComponent(code)}` : '/api/app/reservas', { cache: 'no-store' }).then(r => { if (active && r.ok) window.location.replace(destination); }).catch(() => {}); return () => { active = false; }; }, [code, destination]);
  async function send(path: string, input: object) {
    const response = await fetch(`/api/app/acceso/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) });
    if (!response.ok) { const value = await response.json().catch(() => null); throw new Error(en ? 'Could not verify access. Check your code or try again.' : value?.mensaje ?? 'No se pudo verificar el acceso. Intenta nuevamente.'); }
  }
  async function requestCode() {
    await send('solicitar-codigo', { correo: email }); setSent(true); setMessage(en ? 'If the email has a reservation, you will receive an access code.' : 'Si el correo tiene una reserva, recibirás un código de acceso.');
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError(''); setMessage('');
    try { if (!fromHome && !sent) await requestCode(); else { await send('verificar-codigo', { correo: email, codigo: otp }); window.location.assign(destination); } } catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }
  return <main className="login-overlay-page guest-code-login"><div className="login-overlay-bg" />{fromHome && <Link href="/" className="floating-back icon-back" aria-label={en ? 'Back' : 'Volver'}><ArrowLeft size={20} /></Link>}{!fromHome && sent && <button type="button" className="floating-back icon-back" aria-label={en ? 'Back' : 'Volver'} disabled={busy} onClick={() => { setSent(false); setOtp(''); setMessage(''); setError(''); }}><ArrowLeft size={20} /></button>}<section className="floating-login-card"><VillaSerenaLogo href="/" /><form onSubmit={submit}>
    <h1>{en ? 'Sign in' : 'Iniciar sesión'}</h1><p style={fromHome || sent ? { textAlign: 'center' } : undefined}>{fromHome || sent ? (en ? 'Enter the access code to sign in' : 'Introduce el código de acceso para iniciar sesión') : (en ? 'Enter your reservation email to receive an access code' : 'Introduce el correo de tu reserva para recibir un código de acceso')}</p>
    {sent && !fromHome ? <div className="guest-code-email"><span>{en ? 'Reservation email' : 'Correo de la reserva'}</span><strong>{email}</strong></div> : <label>{fromHome ? (en ? 'Email' : 'Correo electrónico') : (en ? 'Reservation email' : 'Correo de la reserva')}<div className="input-icon"><Mail size={17} /><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} /></div></label>}
    {(fromHome || sent) && <label>{en ? 'Access code' : 'Código de acceso'}<div className="input-icon"><LockKeyhole size={17} /><input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} /></div></label>}
    {error && <div className="login-error" role="alert">{error}</div>}{message && <span className={fromHome ? '' : 'sr-only'} role="status">{message}</span>}
    <button className="login-submit" disabled={busy}>{busy ? (en ? 'Please wait…' : 'Espera…') : fromHome ? (en ? 'Sign in' : 'Iniciar sesión') : sent ? (en ? 'Verify code' : 'Verificar código') : (en ? 'Request code' : 'Solicitar código')}</button>
    {fromHome && <div className="guest-home-code-request"><span>{en ? 'No valid code?' : '¿No tienes un código vigente?'}</span><button type="button" className="forgot-link" disabled={busy} onClick={async event => { const input = event.currentTarget.form?.querySelector<HTMLInputElement>('input[type=email]'); if (!input?.reportValidity()) return; setBusy(true); setError(''); try { await requestCode(); setOtp(''); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>{en ? 'Request code' : 'Solicitar código'}</button></div>}
    {!fromHome && sent && <div className="guest-code-resend"><span>{en ? 'No code received?' : '¿No recibiste el código?'}</span><button type="button" className="forgot-link" disabled={busy} onClick={async () => { setBusy(true); setError(''); try { await requestCode(); } catch (e) { setError((e as Error).message); } finally { setBusy(false); } }}>{en ? 'Resend code' : 'Reenviar código'}</button></div>}
    {!fromHome && !sent && <Link className="guest-reservation-link" href="/">{en ? 'Back to home' : 'Volver al inicio'}</Link>}
  </form></section></main>;
}
