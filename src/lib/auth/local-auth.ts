import type { SessionUser, UserRole } from './types';
import { leerEmpleados } from '@/store/employeeStore';
import { leerHuespedes } from '@/store/guestStore';
import { cuentaHuespedExpirada } from '@/store/guestAccountAccess';
const ROLE_MAP: Record<string, UserRole> = {
  'Administración': 'admin',
  'Recepción': 'recepcion',
  'Limpieza': 'limpieza',
  'Room Service': 'room-service',
  'Mantenimiento': 'mantenimiento',
};
const ACCESS_PASSWORD = 'demo123';
const GUEST_ACCOUNTS: Record<string, { guestId: string }> = {
  'anamorales@gmail.com': { guestId: 'hu-ana' },
};
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
  const guestAccount = GUEST_ACCOUNTS[normalized];
  if (guestAccount) {
    if (password !== ACCESS_PASSWORD)
      throw new Error('Correo o contraseña incorrectos.');
    if (cuentaHuespedExpirada(normalized)) {
      throw new Error('El acceso de esta estancia finalizó 24 horas después del check-out. Contacta a Recepción si necesitas ayuda.');
    }
    const guest = leerHuespedes().find(item => item.id === guestAccount.guestId);
    if (!guest)
      throw new Error('La cuenta no tiene un huésped válido asociado. Contacta a Recepción.');
    return {
      id: `guest-account-${guest.id}`,
      guestId: guest.id,
      email: normalized,
      name: guest.nombre,
      role: 'huesped',
    };
  }
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
  throw new Error('Correo o contraseña incorrectos.');
}

// Coherencia local; no sustituye autenticacion ni autorizacion de servidor.
export function reconstruirSesion(value: unknown): SessionUser | null {
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  const roles: UserRole[] = ['admin', 'recepcion', 'limpieza', 'room-service', 'mantenimiento', 'huesped'];
  if (typeof v.id !== 'string' || !v.id.trim() || typeof v.name !== 'string' ||
      typeof v.email !== 'string' || !roles.includes(v.role as UserRole)) return null;
  if (v.role === 'huesped') {
    if (typeof v.guestId !== 'string' || !v.guestId.trim()) return null;
    const guest = leerHuespedes().find(g => g.id === v.guestId);
    if (!guest || v.id !== 'guest-account-' + guest.id) return null;
    return { id: v.id, name: guest.nombre, email: v.email, role: 'huesped', guestId: guest.id };
  }
  if ('guestId' in v) return null;
  const demo = Object.entries(ROLE_ACCOUNTS).find(([, account]) => account.id === v.id);
  if (demo) {
    const [email, account] = demo;
    if (v.email !== email || v.role !== account.role) return null;
    return { id: account.id, name: account.name, email, role: account.role };
  }
  const empleado = leerEmpleados().find(e => e.id === v.id);
  if (!empleado || !empleado.activo) return null;
  const role = ROLE_MAP[empleado.rol];
  if (!role || v.role !== role) return null;
  return { id: empleado.id, name: empleado.nombre, email: empleado.correo, role };
}

export function esCuentaDemoArea(id: string): boolean {
  return Object.values(ROLE_ACCOUNTS).some(account => account.id === id);
}
