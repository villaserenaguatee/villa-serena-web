import type { ReactNode } from 'react';
import type { UserRole } from '@/lib/auth/types';
import { staffCanAccess } from '@/lib/auth/staff-contract';
import { requireStaff } from '@/lib/bff/auth/page-session';
export async function StaffServerGuard({ role, children }: { role: UserRole; children: ReactNode }) {
  const employee = await requireStaff();
  if (!staffCanAccess(employee, role)) return <main className="p-8"><h1>Acceso denegado</h1><p>Esta sección pertenece a otro rol.</p><a href="/panel">Volver a mi panel</a></main>;
  return <>{children}</>;
}
