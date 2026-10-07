import { notFound } from 'next/navigation';
import AccountDemo from '@/components/panel/AccountDemo';
import { DEMO_RESERVATION_CODE } from '@/lib/mocks/cuenta';

export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (codigo !== DEMO_RESERVATION_CODE) notFound();
  return <AccountDemo />;
}
