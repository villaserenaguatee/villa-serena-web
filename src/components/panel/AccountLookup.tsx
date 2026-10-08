'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AccountLookup() {
  const [code, setCode] = useState('');
  const router = useRouter();
  function submit(event: FormEvent) {
    event.preventDefault();
    const value = code.trim().toUpperCase();
    if (/^VS-[A-Z0-9]{6}$/.test(value)) router.push(`/panel/recepcion/reservas/${value}/cuenta`);
  }
  return <main className="mx-auto max-w-lg space-y-4 p-6 text-[#18345C]">
    <a href="/recepcion" className="underline">Volver a Recepción</a>
    <h1 className="text-2xl font-semibold">Cuenta, check-out y factura</h1>
    <form onSubmit={submit} className="space-y-3">
      <label className="block">Código de reserva<input required pattern="VS-[A-Za-z0-9]{6}" maxLength={9} placeholder="VS-ABC123" value={code} onChange={event => setCode(event.target.value.toUpperCase())} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label>
      <button className="rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white">Consultar cuenta</button>
    </form>
  </main>;
}
