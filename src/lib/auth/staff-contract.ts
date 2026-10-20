import type { components } from '@/lib/api/schema';
import type { SessionUser, UserRole } from './types';
export type Employee = components['schemas']['EmpleadoSesion'];
export type Tokens = components['schemas']['Tokens'];
export type StaffSession = components['schemas']['SesionEmpleado'];
export type LoginInput = components['schemas']['LoginPeticion'];
export type PasswordInput = components['schemas']['CambiarContrasenaPeticion'];
export function staffHome(employee: Employee) {
  return employee.rol === 'ADMIN' ? '/admin' : employee.rol === 'RECEPCION' ? '/recepcion' :
    employee.rol === 'ROOM_SERVICE' ? '/room-service' : employee.area === 'MANTENIMIENTO' ? '/mantenimiento' : '/limpieza';
}
export function staffCanAccess(employee: Employee, role: UserRole) {
  return employee.rol === 'ADMIN' ? role === 'admin' : employee.rol === 'RECEPCION' ? role === 'recepcion' :
    employee.rol === 'ROOM_SERVICE' ? role === 'room-service' : employee.rol === 'MANTENIMIENTO_LIMPIEZA' &&
      ((role === 'limpieza' && ['LIMPIEZA', 'AMBAS'].includes(employee.area ?? '')) || (role === 'mantenimiento' && ['MANTENIMIENTO', 'AMBAS'].includes(employee.area ?? '')));
}
export function sessionUser(employee: Employee): SessionUser {
  return { id: String(employee.id), name: employee.nombre, email: employee.correo,
    role: staffHome(employee).slice(1) as UserRole, staff: employee };
}
