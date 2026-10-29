"use client";
import { useEffect, useState } from 'react';
import { AuthContext } from '@/app/providers/AuthProvider';
import { HuespedPortal, seleccionarEstanciaHuesped } from '@/features/huesped/pages/HuespedApp';
import ScopedI18nProvider from '@/i18n/ScopedI18nProvider';
import type { Huesped, Reserva } from '@/lib/pms/types';
export default function GuestPortal({ huesped, reservas, selectedCode, publicSummary, habitaciones, conectado = false }: { huesped: Huesped; reservas: Reserva[]; selectedCode?: string; publicSummary?: { total: number; estadoPago: string | null }; conectado?: boolean; habitaciones?: import('@/lib/pms/types').HabitacionHotel[] }) {
  const [valid, setValid] = useState(false);
  const accessPath = `/login?acceso=huesped&codigo=${encodeURIComponent(selectedCode ?? '')}`;
  useEffect(() => {
    let active = true;
    async function verify() {
      try {
        const response = await fetch('/api/app/reservas', { cache: 'no-store' });
        const own: { codigo: string }[] = response.ok ? await response.json() : [];
        if (active) { if (!response.ok || (selectedCode && !own.some(r => r.codigo === selectedCode))) { setValid(false); window.location.replace(accessPath); } else setValid(true); }
      } catch { if (active) { setValid(false); window.location.replace(accessPath); } }
    }
    void verify(); const timer = setInterval(() => { void verify(); }, 60000);
    const focus = () => { void verify(); }; window.addEventListener('focus', focus);
    return () => { active = false; clearInterval(timer); window.removeEventListener('focus', focus); };
  }, [accessPath, selectedCode]);
  const reserva = reservas.find(r => r.codigo === selectedCode && r.huespedId === huesped.id) ?? seleccionarEstanciaHuesped(reservas, huesped.id);
  if (!valid) return <main className="vs-loading" aria-busy="true"><span role="progressbar" className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#E5E0D8] border-t-[#18345C]" /></main>;
  if (!reserva) return <main className="guest-reservation-page"><p>No encontramos una estancia disponible.</p></main>;
  const logout = async () => {
    const response = await fetch('/api/app/cerrar-sesion', { method: 'POST' });
    if (!response.ok) throw new Error('No se pudo cerrar la sesión.');
    setValid(false);
  };
  return <AuthContext.Provider value={{ user: { id: `guest-account-${huesped.id}`, guestId: huesped.id, name: huesped.nombre, email: huesped.correo, role: 'huesped' }, loading: false, login: async () => { throw new Error('Verifica el correo con un código de acceso.'); }, logout }}>
    <ScopedI18nProvider><HuespedPortal key={reserva.codigo} habitacionesApi={habitaciones} conectado={conectado} onCambiarModulo={() => {}} huesped={huesped} reservaInicial={reserva} reservasAutorizadas={reservas} publicSummary={publicSummary} /></ScopedI18nProvider>
  </AuthContext.Provider>;
}
