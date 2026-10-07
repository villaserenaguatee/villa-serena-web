import { RecepcionRoleApp } from '@/app/router/RoleEntrypoints';
import HabitacionesConectadas from '@/features/recepcion/pages/HabitacionesConectadas';
export default function Page() { return process.env.STAFF_AUTH_MODE === 'spring' ? <HabitacionesConectadas /> : <RecepcionRoleApp />; }
