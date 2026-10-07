import { MantenimientoRoleApp } from '@/app/router/RoleEntrypoints';
import IncidenciasConectadas from '@/features/mantenimiento/pages/IncidenciasConectadas';
export default function Page() { return process.env.STAFF_AUTH_MODE === 'spring' ? <IncidenciasConectadas /> : <MantenimientoRoleApp />; }
