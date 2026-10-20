import type { ReactNode } from 'react';
import Link from 'next/link';
import { requireStaff } from '@/lib/bff/auth/page-session';
import StaffSessionActions from '@/components/common/StaffSessionActions';
export const dynamic = 'force-dynamic';
export default async function StaffPanelLayout({ children }: { children: ReactNode }) {
  const employee = await requireStaff();
  const menu = employee.debeCambiarContrasena ? [] : employee.rol === 'ADMIN' ? [['Canal simulado', '/panel/admin/canal-simulado']] :
    employee.rol === 'RECEPCION' ? [['Calendario', '/recepcion'], ['Reservas', '/recepcion/reservas'], ['Habitaciones', '/recepcion/habitaciones']] :
    employee.rol === 'ROOM_SERVICE' ? [['Pedidos', '/room-service'], ['Menú', '/room-service/menu']] :
    [...(employee.area !== 'MANTENIMIENTO' ? [['Limpieza', '/limpieza'], ['Solicitudes', '/limpieza/solicitudes']] : []),
      ['Incidencias', employee.area === 'LIMPIEZA' ? '/limpieza/incidencias' : '/mantenimiento/incidencias']];
  return <div className="min-h-screen bg-[#F7F5EF] text-[#18345C]"><header className="flex flex-wrap justify-between gap-4 border-b bg-white p-5"><Link href="/panel" className="text-xl font-semibold">Villa Serena</Link><span>{employee.nombre}</span><StaffSessionActions /></header>
    <div className="flex flex-col md:flex-row"><nav aria-label="Menú de mi rol" className="flex gap-4 border-b p-5 md:w-56 md:flex-col md:border-r">{menu.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav><main className="flex-1 p-6">{children}</main></div></div>;
}
