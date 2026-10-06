'use client';
import { useState, type FormEvent } from 'react';
import { staffPassword } from '@/lib/auth/staff-client';
import { staffHome } from '@/lib/auth/staff-contract';
import { validatePassword } from '@/lib/bff/auth/errors';
export default function PasswordPage() {
  const [actual, setActual] = useState(''), [nueva, setNueva] = useState(''), [confirmacion, setConfirmacion] = useState('');
  const [busy, setBusy] = useState(false), [error, setError] = useState('');
  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const input = { contrasenaActual: actual, contrasenaNueva: nueva, confirmacion }; validatePassword(input);
      const employee = await staffPassword(input); window.location.assign(staffHome(employee));
    } catch (error) { setError(error instanceof Error ? error.message : 'No se pudo cambiar la contraseña.'); }
    finally { setBusy(false); }
  }
  return <section className="max-w-md rounded-2xl bg-white p-6 shadow"><h1 className="text-2xl font-semibold">Cambiar contraseña</h1>
    <p className="my-4">Si tu contraseña es temporal, debes cambiarla antes de abrir otras secciones. Usa al menos 8 caracteres, una letra y un número.</p>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label>Contraseña actual<input className="mt-1 w-full rounded-lg border p-2" type="password" autoComplete="current-password" required value={actual} onChange={e => setActual(e.target.value)} /></label>
      <label>Nueva contraseña<input className="mt-1 w-full rounded-lg border p-2" type="password" autoComplete="new-password" required value={nueva} onChange={e => setNueva(e.target.value)} /></label>
      <label>Confirmar nueva contraseña<input className="mt-1 w-full rounded-lg border p-2" type="password" autoComplete="new-password" required value={confirmacion} onChange={e => setConfirmacion(e.target.value)} /></label>
      {error && <p role="alert" className="text-red-700">{error}</p>}<button disabled={busy} className="login-submit">{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
    </form></section>;
}
