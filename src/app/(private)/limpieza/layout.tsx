import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';
export default function Layout({ children }: {
  children: ReactNode;
}) {
  return <RoleGuard role="limpieza">
    {children}
  </RoleGuard>;
}
