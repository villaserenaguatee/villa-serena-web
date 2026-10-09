"use client";
import { useSearchParams } from 'next/navigation';
import GuestReservationAccess from '@/components/public/GuestReservationAccess';
export default function Page() { const params = useSearchParams(); return <GuestReservationAccess code={params.get('codigo') ?? ''} portalAccess={params.get('acceso') === 'portal'} />; }
