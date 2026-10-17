import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { guestPortalData, connectedGuestPortalData, GUEST_COOKIE, REFRESH_COOKIE } from '@/lib/bff/guestAccess';
import GuestPortal from '@/components/public/GuestPortal';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ codigo?: string;seccion?:string }> }) {
  const query=await searchParams,code=query.codigo;
  const section=['inicio','checkin','restaurante','servicios','chat','habitacion','experiencias','cuenta','reservar'].includes(query.seccion??'')?query.seccion:undefined;
  const jar = await cookies();
  const data = process.env.GUEST_AUTH_MODE === 'spring'
    ? await connectedGuestPortalData(jar.get(GUEST_COOKIE)?.value ?? '', code)
    : guestPortalData(jar.get(GUEST_COOKIE)?.value ?? '', jar.get('vs_guest_refresh')?.value ?? '', code);
  if (!data && process.env.GUEST_AUTH_MODE === 'spring' && jar.get(REFRESH_COOKIE)?.value)
    redirect(`/api/app/sesion?${new URLSearchParams({...code?{codigo:code}:{},...section?{seccion:section}:{}}).toString()}`);
  if (!data) redirect(`/login?acceso=huesped&codigo=${encodeURIComponent(code ?? '')}`);
  if (!data.supported && data.reason === 'reservation') notFound();
  if (!data.supported) return <main className="guest-reservation-page"><section className="guest-reservation-card"><h1>Portal del huésped</h1><p>Tu reserva está disponible, pero todavía no podemos abrir esta estancia en el portal.</p><Link href="/">Volver al inicio</Link></section></main>;
  return <GuestPortal habitaciones={'habitaciones' in data ? data.habitaciones as import('@/lib/pms/types').HabitacionHotel[] : undefined} conectado={process.env.GUEST_AUTH_MODE === 'spring'} huesped={data.huesped} reservas={data.reservas} selectedCode={code} publicSummary={'publicSummary' in data ? data.publicSummary : undefined} />;
}
