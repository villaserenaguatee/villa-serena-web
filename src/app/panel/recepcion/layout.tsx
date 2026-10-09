import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';

export const dynamic = 'force-dynamic';
export default function Layout({ children }: { children: ReactNode }) {
  return <RoleGuard role="recepcion">{children}</RoleGuard>;
}
