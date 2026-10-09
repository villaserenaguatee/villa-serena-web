import { redirect } from 'next/navigation';
import AccountLookup from '@/components/panel/AccountLookup';

export default function Page() {
  if (process.env.STAFF_AUTH_MODE !== 'spring') redirect('/panel/recepcion/reservas/VS-DEMO-4C/cuenta');
  return <AccountLookup />;
}
