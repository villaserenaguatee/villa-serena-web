"use client";
import { useSearchParams } from 'next/navigation';
import GuestCodeLogin from '@/components/public/GuestCodeLogin';
export default function LoginPage() { const params = useSearchParams(); return <GuestCodeLogin code={params.get('codigo') ?? ''} fromHome={!params.get('codigo') && params.get('acceso') !== 'huesped'} />; }
