import MantenimientoConectado from '@/features/mantenimiento/pages/MantenimientoConectado';
import ScopedI18nProvider from '@/i18n/ScopedI18nProvider';
import {MantenimientoRoleApp} from '@/app/router/RoleEntrypoints';
export default function Page(){return process.env.STAFF_AUTH_MODE==='spring'?<ScopedI18nProvider><MantenimientoConectado initial="activos"/></ScopedI18nProvider>:<MantenimientoRoleApp/>;}
