import type { ReactNode } from 'react';
import { StaffServerGuard } from '@/components/common/StaffServerGuard';
import ReceptionConnectionBoundary from '@/components/common/ReceptionConnectionBoundary';
import '@event-calendar/core/index.css';
export const dynamic = 'force-dynamic';
export default function Layout({ children }: { children: ReactNode }) {
  return <StaffServerGuard role="recepcion">
    <ReceptionConnectionBoundary roomsConnected={process.env.STAFF_AUTH_MODE === 'spring'} connected={process.env.STAFF_AUTH_MODE === 'spring' || (process.env.VILLA_SERENA_BFF_MODE ?? 'demo') !== 'demo'}>{children}</ReceptionConnectionBoundary>
  </StaffServerGuard>;
}
