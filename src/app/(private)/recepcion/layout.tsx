import type { ReactNode } from 'react';
import { RoleGuard } from '@/components/common/RoleGuard';
import '@event-calendar/core/index.css';
export const dynamic = 'force-dynamic';
export default function Layout({ children }: {
  children: ReactNode;
}) {
  return <RoleGuard role="recepcion">
    {(process.env.VILLA_SERENA_BFF_MODE ?? 'demo') === 'demo' ? children : <div className="p-6 text-[#18345C]">
      <h1 className="text-2xl font-semibold">Recepción pendiente de conexión</h1>
      <p>Faltan la sesión del personal y los servicios de huéspedes, reservas y habitaciones del API. No se mostrarán reservas demo en modo conectado.</p>
    </div>}
  </RoleGuard>;
}
