'use client';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
export default function ReceptionConnectionBoundary({ connected, roomsConnected, children }: { connected: boolean; roomsConnected: boolean; children: ReactNode }) {
  const pathname = usePathname();
  if (!connected || (roomsConnected && pathname === '/recepcion/habitaciones')) return children;
  return <div className="p-6 text-[#18345C]"><h1 className="text-2xl font-semibold">Recepción pendiente de conexión</h1><p>Faltan los servicios de huéspedes y reservas del API.</p><a href="/recepcion/habitaciones">Ver habitaciones</a></div>;
}
