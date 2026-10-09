import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { guestPortalData, GUEST_COOKIE } from '@/lib/bff/guestAccess';
import GuestPortal from '@/components/public/GuestPortal';
export const dynamic = 'force-dynamic';
export default async function Page({ searchParams }: { searchParams: Promise<{ codigo?: string }> }) {
  const code = (await searchParams).codigo;
  const jar = await cookies();
  const data = guestPortalData(jar.get(GUEST_COOKIE)?.value ?? '', jar.get('vs_guest_refresh')?.value ?? '', code);
  if (!data) redirect(`/login?acceso=huesped&codigo=${encodeURIComponent(code ?? '')}`);
  if (!data.supported && data.reason === 'reservation') notFound();
  if (!data.supported) return <main className="guest-reservation-page"><section className="guest-reservation-card"><h1>Portal del huésped</h1><p>Tu reserva está disponible, pero todavía no podemos abrir esta estancia en el portal.</p><a href="/">Volver al inicio</a></section></main>;
  return <GuestPortal huesped={data.huesped} reservas={data.reservas} selectedCode={code} publicSummary={'publicSummary' in data ? data.publicSummary : undefined} />;
}
