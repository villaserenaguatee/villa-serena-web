import { LimpiezaRoleApp } from '@/app/router/RoleEntrypoints';
export default function Page() { return <LimpiezaRoleApp conectado={process.env.STAFF_AUTH_MODE === 'spring'} />; }

