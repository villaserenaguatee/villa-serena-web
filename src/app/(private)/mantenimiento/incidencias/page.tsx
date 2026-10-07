import { redirect } from 'next/navigation';
import IncidenciasConectadas from '@/features/mantenimiento/pages/IncidenciasConectadas';
export default function Page() { if (process.env.STAFF_AUTH_MODE === 'spring') return <IncidenciasConectadas />; redirect('/mantenimiento'); }
