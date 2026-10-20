import { RoomServiceRoleApp } from '@/app/router/RoleEntrypoints';
export default function Page() { return <RoomServiceRoleApp conectado={process.env.STAFF_AUTH_MODE === 'spring'} />; }
