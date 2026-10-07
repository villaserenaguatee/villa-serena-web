'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, LockKeyhole, Eye, EyeOff } from 'lucide-react';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import { useAuth } from '@/hooks/useAuth';
export default function StaffLoginPage() {
  const { login } = useAuth(), router = useRouter();
  const [correo, setCorreo] = useState(''), [contrasena, setContrasena] = useState('');
  const [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { const user = await login(correo, contrasena); router.replace(user.staff?.debeCambiarContrasena ? '/panel/cambiar-contrasena' : '/panel'); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  }
  return <main className="login-overlay-page"><div className="login-overlay-bg" /><section className="floating-login-card">
    <VillaSerenaLogo href="/" /><form onSubmit={submit}><h1>Inicio de sesión del personal</h1>
      <label>Correo<div className="input-icon"><Mail size={17} /><input type="email" autoComplete="username" value={correo} onChange={e => setCorreo(e.target.value)} required /></div></label>
      <label>Contraseña<div className="input-icon"><LockKeyhole size={17} /><input type={show ? 'text' : 'password'} autoComplete="current-password" value={contrasena} onChange={e => setContrasena(e.target.value)} required /><button type="button" aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'} onClick={() => setShow(!show)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
      {error && <div className="login-error" role="alert">{error}</div>}<button className="login-submit" disabled={busy}>{busy ? 'Iniciando sesión…' : 'Iniciar sesión'}</button>
      <Link href="/">Volver al inicio</Link>
    </form></section></main>;
}
