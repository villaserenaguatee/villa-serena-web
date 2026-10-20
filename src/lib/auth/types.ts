export type UserRole = 'admin' | 'recepcion' | 'limpieza' | 'room-service' | 'mantenimiento' | 'huesped';
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  guestId?: string;
  staff?: import('./staff-contract').Employee;
}
export const ROLE_HOME: Record<UserRole, string> = {
  admin: '/admin',
  recepcion: '/recepcion',
  limpieza: '/limpieza',
  'room-service': '/room-service',
  mantenimiento: '/mantenimiento',
  huesped: '/huesped',
};
