import type { ReactNode } from 'react';
import { StaffServerGuard } from '@/components/common/StaffServerGuard';
import {headers} from 'next/headers';
import {AdminDemoProvider} from '@/features/admin/demo/AdminDemoContext';
import {adminLocalDemoEnabled} from '@/features/admin/demo/adminDemoGuard';
export default async function Layout({ children }: {
  children: ReactNode;
}) {
  const host = (await headers()).get('host') ?? '';
  const localDemo = adminLocalDemoEnabled({environment:process.env.NODE_ENV,host,staffMode:process.env.STAFF_AUTH_MODE,bffMode:process.env.VILLA_SERENA_BFF_MODE,apiUrl:process.env.API_URL});
  return <StaffServerGuard role="admin"><AdminDemoProvider enabled={localDemo}>
    {process.env.STAFF_AUTH_MODE === 'spring' ? <div className="flex h-dvh flex-col overflow-hidden"><div className="flex min-h-0 flex-1">{children}</div></div> : children}
  </AdminDemoProvider></StaffServerGuard>;
}
