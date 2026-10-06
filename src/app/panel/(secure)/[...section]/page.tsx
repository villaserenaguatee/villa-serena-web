import { redirect } from 'next/navigation';
import { requireStaff } from '@/lib/bff/auth/page-session';
import { staffCanAccess } from '@/lib/auth/staff-contract';
import type { UserRole } from '@/lib/auth/types';
export default async function SectionPage({ params }: { params: Promise<{ section: string[] }> }) {
  const employee = await requireStaff(), { section } = await params;
  if (!staffCanAccess(employee, section[0] as UserRole)) return <h1>Acceso denegado</h1>;
  if (section.join('/') === 'admin/canal-simulado') return <><h1>Canal simulado</h1><p>En construcción.</p></>;
  redirect('/' + section.map(encodeURIComponent).join('/'));
}
