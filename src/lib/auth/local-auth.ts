import type { SessionUser, UserRole } from './types';
import { leerEmpleados } from '@/store/employeeStore';
import { cuentaHuespedExpirada } from '@/store/guestAccountAccess';
const ROLE_MAP: Record<string, UserRole> = {
  'Administración': 'admin',
  'Recepción': 'recepcion',
  'Limpieza': 'limpieza',
  'Room Service': 'room-service',
  'Mantenimiento': 'mantenimiento',
};
const ACCESS_PASSWORD = 'demo123';
const ROLE_ACCOUNTS: Record<string, {
  id: string;
  name: string;
  role: UserRole;
}> = {
  'admin@villaserena.gt': { id: 'role-admin', name: 'Administración', role: 'admin' },
  'recepcion@villaserena.gt': { id: 'role-recepcion', name: 'Recepción', role: 'recepcion' },
  'limpieza@villaserena.gt': { id: 'role-limpieza', name: 'Limpieza', role: 'limpieza' },
  'roomservice@villaserena.gt': { id: 'role-roomservice', name: 'Room Service', role: 'room-service' },
  'mantenimiento@villaserena.gt': { id: 'role-mantenimiento', name: 'Mantenimiento', role: 'mantenimiento' },
};
export async function loginLocal(email: string,
  password: string): Promise<SessionUser> {
  await new Promise((r) => setTimeout(r, 350));
  const normalized = email.toLowerCase().trim();
  const roleAccount = ROLE_ACCOUNTS[normalized];
  if (roleAccount) {
    if (!password.trim())
      throw new Error('Ingresa una contraseña.');
    return { id: roleAccount.id, email: normalized, name: roleAccount.name, role: roleAccount.role };
  }
  const empleado = leerEmpleados().find((e) => e.correo.toLowerCase() === normalized);
  if (empleado) {
    if (!empleado.activo) {
      throw new Error('Esta cuenta de empleado está inactiva. Solicita a Administración que la active.');
    }
    if (password !== ACCESS_PASSWORD)
      throw new Error('Correo o contraseña incorrectos.');
    const role = ROLE_MAP[empleado.rol];
    if (!role)
      throw new Error('El área de este empleado no tiene acceso configurado.');
    return { id: empleado.id, email: empleado.correo, name: empleado.nombre, role };
  }
  if (normalized === 'anamorales@gmail.com' && password === ACCESS_PASSWORD) {
    if (cuentaHuespedExpirada(normalized)) {
      throw new Error('El acceso de esta estancia finalizó 24 horas después del check-out. Contacta a Recepción si necesitas ayuda.');
    }
    return { id: 'hu-ana', email: normalized, name: 'Ana Morales', role: 'huesped' };
  }
  throw new Error('Correo o contraseña incorrectos.');
}
