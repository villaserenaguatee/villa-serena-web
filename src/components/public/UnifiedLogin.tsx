"use client";
import { useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff, Mail, LockKeyhole } from 'lucide-react';
import GuestCodeLogin from './GuestCodeLogin';
import { useAuth } from '@/hooks/useAuth';
import { staffHome } from '@/lib/auth/staff-contract';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
function StaffForm() {
  const { login } = useAuth(), router = useRouter(), { en } = usePublicLanguage();
  const [email, setEmail] = useState(''), [password, setPassword] = useState('');
  const [show, setShow] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try { const user = await login(email, password, true); if (!user.staff) throw new Error(en ? 'Use a staff account.' : 'Usa una cuenta del personal.'); router.replace(user.staff.debeCambiarContrasena ? '/panel/cambiar-contrasena' : staffHome(user.staff)); router.refresh(); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo iniciar sesión.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit}><h1>{en ? 'Sign in' : 'Iniciar sesión'}</h1>
    <label>{en ? 'Email' : 'Correo electrónico'}<div className="input-icon"><Mail size={17} /><input type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} /></div></label>
    <label>{en ? 'Password' : 'Contraseña'}<div className="input-icon"><LockKeyhole size={17} /><input type={show ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} /><button type="button" aria-label={show ? (en ? 'Hide password' : 'Ocultar contraseña') : (en ? 'Show password' : 'Mostrar contraseña')} onClick={() => setShow(!show)}>{show ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></label>
    {error && <div className="login-error" role="alert">{error}</div>}
    <button className="login-submit" disabled={busy}>{busy ? (en ? 'Signing in…' : 'Iniciando sesión…') : (en ? 'Sign in' : 'Iniciar sesión')}</button>
  </form>;
}
export default function UnifiedLogin({ initialStaff = false }: { initialStaff?: boolean }) {
  const [staff, setStaff] = useState(initialStaff), params = useSearchParams(), { en } = usePublicLanguage();
  const code = params.get('codigo') ?? '';
  const tabs = <div className="login-access-tabs" role="tablist" aria-label={en ? 'Account type' : 'Tipo de acceso'}><button type="button" role="tab" aria-selected={!staff} onClick={() => setStaff(false)}>{en ? 'Guest' : 'Huésped'}</button><button type="button" role="tab" aria-selected={staff} onClick={() => setStaff(true)}>{en ? 'Staff' : 'Personal'}</button></div>;
  return <GuestCodeLogin code={code} fromHome={!code && params.get('acceso') !== 'huesped'} tabs={tabs} staffForm={staff ? <StaffForm /> : undefined} />;
}
