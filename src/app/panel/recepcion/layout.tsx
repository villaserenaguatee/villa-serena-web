import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';

export const dynamic = 'force-dynamic';
export default function Layout({ children }: { children: ReactNode }) {
  return <RoleGuard role="recepcion">
    {(process.env.VILLA_SERENA_BFF_MODE ?? 'demo') === 'demo' ? children : <main className="p-6">
      <h1 className="text-2xl font-semibold">Cuenta pendiente de conexión</h1>
      <p>La sesión del personal y los endpoints de cuenta, check-out y factura aún deben conectarse al API.</p>
    </main>}
  </RoleGuard>;
}
