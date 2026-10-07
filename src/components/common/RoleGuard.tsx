'use client';
import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/lib/auth/types';
import { staffCanAccess } from '@/lib/auth/staff-contract';
export function RoleGuard({ role, children }: {
  role: UserRole;
  children: ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  useEffect(() => {
    if (!loading && !user) router.replace(role === 'huesped' ? '/login' : '/panel/login');
    if (!loading && user?.staff?.debeCambiarContrasena) router.replace('/panel/cambiar-contrasena');
  }, [user, loading, role, router]);
  if (loading || !user || user.staff?.debeCambiarContrasena) {
    return <div className="vs-loading">Cargando Villa Serena…</div>;
  }
  if (user.staff ? !staffCanAccess(user.staff, role) : user.role !== role)
    return <main className="p-8"><h1>Acceso denegado</h1><a href="/panel">Volver a mi panel</a></main>;
  return <>{children}</>;
}
