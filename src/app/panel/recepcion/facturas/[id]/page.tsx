import { notFound } from 'next/navigation';
import InvoiceDemo from '@/components/panel/InvoiceDemo';
import InvoiceConnected from '@/components/panel/InvoiceConnected';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (process.env.STAFF_AUTH_MODE === 'spring') {
    if (!/^[1-9][0-9]*$/.test(id)) notFound();
    return <InvoiceConnected id={id} />;
  }
  return <InvoiceDemo id={id} />;
}
