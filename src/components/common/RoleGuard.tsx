'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/auth/types';
export function RoleGuard({ role, children }: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && (!user || user.role !== role))
      router.replace('/login');
  }, [user, loading, role, router]);
  if (loading || !user || user.role !== role) {
    return <div className="vs-loading">Cargando Villa Serena…</div>;
  }
  return <>{children}</>;
}
