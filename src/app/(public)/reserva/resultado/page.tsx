"use client";
import { useSearchParams } from 'next/navigation';
import PublicPaymentStatus from '@/components/public/PublicPaymentStatus';

export default function ResultadoReserva() {
  const code = useSearchParams().get('codigo') ?? '';
  return <PublicPaymentStatus code={code} />;
}
