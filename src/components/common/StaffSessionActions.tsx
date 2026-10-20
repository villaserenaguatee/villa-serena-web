'use client';
import { useState } from 'react';
import Link from 'next/link';
import { staffRequest } from '@/lib/auth/staff-client';
export default function StaffSessionActions() {
  const [error, setError] = useState(''), [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true); setError('');
    try { await staffRequest('logout', {}); window.location.assign('/panel/login'); }
    catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cerrar sesión.'); setBusy(false); }
  }
  return <div className="flex flex-wrap items-center gap-4"><Link href="/panel/cambiar-contrasena">Cambiar contraseña</Link><button disabled={busy} onClick={logout}>{busy ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>{error && <span role="alert">{error}</span>}</div>;
}
