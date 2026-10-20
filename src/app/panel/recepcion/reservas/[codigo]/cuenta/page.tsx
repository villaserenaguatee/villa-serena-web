import { notFound } from 'next/navigation';
import AccountDemo from '@/components/panel/AccountDemo';
import AccountConnected from '@/components/panel/AccountConnected';

export default async function Page({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  if (process.env.STAFF_AUTH_MODE === 'spring') {
    if (!/^VS-[A-Z0-9]{6}$/.test(codigo)) notFound();
    return <AccountConnected code={codigo} />;
  }
  if (codigo !== 'VS-DEMO-4C') notFound();
  return <AccountDemo />;
}
