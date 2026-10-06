import Link from 'next/link';
import { requireStaff } from '@/lib/bff/auth/page-session';
import { staffHome } from '@/lib/auth/staff-contract';
export default async function PanelPage() {
  const employee = await requireStaff();
  return <><h1 className="text-2xl font-semibold">Panel del personal</h1><p className="my-4">Bienvenido, {employee.nombre}.</p><Link className="underline" href={staffHome(employee)}>Abrir mi sección</Link></>;
}
