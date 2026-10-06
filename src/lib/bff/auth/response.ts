import 'server-only';
import type { Employee, Tokens, StaffSession } from '@/lib/auth/staff-contract';
import { AuthError } from './errors';
const invalid = () => new AuthError('RESPUESTA_API_INVALIDA', 502, 'El API devolvió una sesión incompleta.');
export function publicEmployee(value: unknown): Employee {
  if (!value || typeof value !== 'object') throw invalid();
  const e = value as Employee;
  if (!Number.isSafeInteger(e.id) || typeof e.nombre !== 'string' || typeof e.correo !== 'string' || typeof e.debeCambiarContrasena !== 'boolean' ||
    !['ADMIN', 'RECEPCION', 'ROOM_SERVICE', 'MANTENIMIENTO_LIMPIEZA'].includes(e.rol) ||
    (e.rol === 'MANTENIMIENTO_LIMPIEZA' ? !['LIMPIEZA', 'MANTENIMIENTO', 'AMBAS'].includes(e.area ?? '') : e.area !== null)) throw invalid();
  // Lista explícita: los campos adicionales de Spring nunca llegan al navegador.
  return { id: e.id, nombre: e.nombre, correo: e.correo, rol: e.rol, area: e.area, debeCambiarContrasena: e.debeCambiarContrasena };
}
export function serverTokens(value: unknown): Tokens {
  if (!value || typeof value !== 'object') throw invalid();
  const t = value as Tokens;
  if (typeof t.accessToken !== 'string' || !t.accessToken || typeof t.refreshToken !== 'string' || !t.refreshToken || t.tipoToken !== 'Bearer' || !Number.isSafeInteger(t.expiraEn) || t.expiraEn <= 0) throw invalid();
  return { accessToken: t.accessToken, refreshToken: t.refreshToken, tipoToken: t.tipoToken, expiraEn: t.expiraEn };
}
export function serverSession(value: unknown): StaffSession {
  return { ...serverTokens(value), empleado: publicEmployee((value as StaffSession).empleado) };
}
