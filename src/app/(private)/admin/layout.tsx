import type { ReactNode } from 'react';
import { StaffServerGuard } from '@/components/common/StaffServerGuard';
export default function Layout({ children }: {
  children: ReactNode;
}) {
  return <StaffServerGuard role="admin">
    {process.env.STAFF_AUTH_MODE === 'spring' ? <div className="flex h-dvh flex-col overflow-hidden"><p role="status" className="shrink-0 bg-[#FFF9E8] p-3 text-sm text-[#18345C] lg:ml-56">Administración conectada al hotel.</p><div className="flex min-h-0 flex-1">{children}</div></div> : children}
  </StaffServerGuard>;
}
