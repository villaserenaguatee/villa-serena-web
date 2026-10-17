import type { ReactNode } from 'react';
import { StaffServerGuard } from '@/components/common/StaffServerGuard';
export default function Layout({ children }: {
  children: ReactNode;
}) {
  return <StaffServerGuard role="admin">
    {process.env.STAFF_AUTH_MODE === 'spring' ? <div className="flex h-dvh flex-col overflow-hidden"><div className="flex min-h-0 flex-1">{children}</div></div> : children}
  </StaffServerGuard>;
}
