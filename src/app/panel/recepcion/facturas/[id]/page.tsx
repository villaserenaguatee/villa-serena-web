import InvoiceDemo from '@/components/panel/InvoiceDemo';

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <InvoiceDemo id={id} />;
}
