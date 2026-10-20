import type { ReactNode } from 'react';
import { StaffServerGuard } from '@/components/common/StaffServerGuard';
export default function Layout({ children }: {
  children: ReactNode;
}) {
  return <StaffServerGuard role="room-service">
    {children}
  </StaffServerGuard>;
}
