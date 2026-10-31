import {RecepcionRoleApp} from '@/app/router/RoleEntrypoints';
export default function Page(){return <RecepcionRoleApp conectado={process.env.STAFF_AUTH_MODE==='spring'}/>;}
