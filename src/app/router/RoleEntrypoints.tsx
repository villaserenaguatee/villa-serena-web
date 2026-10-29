'use client';
import RecepcionApp from '@/features/recepcion/pages/RecepcionApp';
import HuespedApp from '@/features/huesped/pages/HuespedApp';
import RoomServiceApp from '@/features/roomservice/pages/RoomServiceApp';
import AdminApp from '@/features/admin/pages/AdminApp';
import MantenimientoApp from '@/features/mantenimiento/pages/MantenimientoApp';
import CleaningApp from '@/features/limpieza/pages/LimpiezaApp';
import ScopedI18nProvider from '@/i18n/ScopedI18nProvider';
import { RoleGuard } from '@/components/common/RoleGuard';
const noop = () => { };
export function RecepcionRoleApp({ conectado = false }: { conectado?: boolean }) {
  return <RoleGuard role="recepcion">
    <ScopedI18nProvider><RecepcionApp conectado={conectado} onCambiarModulo={noop} /></ScopedI18nProvider>
  </RoleGuard>;
}
export function HuespedRoleApp() {
  return <RoleGuard role="huesped">
    <ScopedI18nProvider>
      <HuespedApp onCambiarModulo={noop} />
    </ScopedI18nProvider>
  </RoleGuard>;
}
export function RoomServiceRoleApp({ conectado = false }: { conectado?: boolean }) {
  return <RoleGuard role="room-service">
    <ScopedI18nProvider><RoomServiceApp onCambiarModulo={noop} conectado={conectado} /></ScopedI18nProvider>
  </RoleGuard>;
}
export function LimpiezaRoleApp({ conectado = false }: { conectado?: boolean }) {
  return <RoleGuard role="limpieza">
    <ScopedI18nProvider><CleaningApp onCambiarModulo={noop} conectado={conectado} /></ScopedI18nProvider>
  </RoleGuard>;
}
export function AdminRoleApp() {
  return <RoleGuard role="admin">
    <ScopedI18nProvider><AdminApp onCambiarModulo={noop} /></ScopedI18nProvider>
  </RoleGuard>;
}
export function MantenimientoRoleApp() {
  return <RoleGuard role="mantenimiento">
    <MantenimientoApp onCambiarModulo={noop} />
  </RoleGuard>;
}
