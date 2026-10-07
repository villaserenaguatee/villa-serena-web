import 'server-only';
import { randomBytes, randomUUID, scryptSync, timingSafeEqual, createHash } from 'node:crypto';
import { EMPLEADOS_INICIALES } from '@/data/pms';
import type { Employee, LoginInput, PasswordInput, StaffSession, Tokens } from '@/lib/auth/staff-contract';
import { AuthError, expired, validatePassword } from './errors';

type Account = { employee: Employee; active: boolean; salt: string; hash: Buffer; failures: number; blockedUntil: number };
type Credential = { id: number; expires: number; family: string };
// Estado exclusivo del servidor de prueba. Se reinicia al reiniciar Next.js.
export function createDemoAuth(now = Date.now, accessSeconds = 900) {
  const accounts = new Map<string, Account>();
  const access = new Map<string, Credential>(), refresh = new Map<string, Credential>();
  const digest = (token: string) => createHash('sha256').update(token).digest('hex');
  const roles: Record<string, Employee['rol']> = { 'Administración': 'ADMIN', 'Recepción': 'RECEPCION', 'Room Service': 'ROOM_SERVICE', 'Limpieza': 'MANTENIMIENTO_LIMPIEZA', 'Mantenimiento': 'MANTENIMIENTO_LIMPIEZA' };
  function add(id: number, nombre: string, correo: string, rol: Employee['rol'], area: Employee['area'], active = true, temporary = false) {
    const salt = randomBytes(16).toString('hex');
    accounts.set(correo, { employee: { id, nombre, correo, rol, area, debeCambiarContrasena: temporary }, active, salt,
      hash: scryptSync('demo123', salt, 32), failures: 0, blockedUntil: 0 });
  }
  EMPLEADOS_INICIALES.forEach((e, i) => {
    const rol = roles[e.rol];
    if (rol) add(i + 1, e.nombre, e.correo.toLowerCase(), rol, e.rol === 'Limpieza' ? 'LIMPIEZA' : e.rol === 'Mantenimiento' ? 'MANTENIMIENTO' : null, e.activo);
  });
  add(1001, 'Administración', 'admin@villaserena.gt', 'ADMIN', null);
  add(1002, 'Recepción', 'recepcion@villaserena.gt', 'RECEPCION', null);
  add(1003, 'Limpieza', 'limpieza@villaserena.gt', 'MANTENIMIENTO_LIMPIEZA', 'LIMPIEZA');
  add(1004, 'Room Service', 'roomservice@villaserena.gt', 'ROOM_SERVICE', null);
  add(1005, 'Mantenimiento', 'mantenimiento@villaserena.gt', 'MANTENIMIENTO_LIMPIEZA', 'MANTENIMIENTO');
  // Variantes del personal existente para comprobar temporal, inactivo y área Ambas.
  add(1006, 'Recepción (temporal)', 'temporal@villaserena.gt', 'RECEPCION', null, true, true);
  add(1007, 'Mantenimiento y limpieza', 'ambas@villaserena.gt', 'MANTENIMIENTO_LIMPIEZA', 'AMBAS');
  add(1008, 'Recepción (inactivo)', 'inactivo@villaserena.gt', 'RECEPCION', null, false);
  function account(id: number) { const a = [...accounts.values()].find(a => a.employee.id === id); if (!a?.active) throw expired(); return a; }
  function revoke(family: string) {
    for (const map of [access, refresh]) for (const [key, value] of map) if (value.family === family) map.delete(key);
  }
  function issue(id: number, family: string = randomUUID()): Tokens {
    // Limita el estado vencido sin conservar tokens en texto plano.
    for (const map of [access, refresh]) for (const [key, value] of map) if (value.expires <= now()) map.delete(key);
    const accessToken = randomBytes(32).toString('base64url'), refreshToken = randomBytes(32).toString('base64url');
    access.set(digest(accessToken), { id, family, expires: now() + accessSeconds * 1000 });
    refresh.set(digest(refreshToken), { id, family, expires: now() + 7 * 86400000 });
    return { accessToken, refreshToken, tipoToken: 'Bearer', expiraEn: accessSeconds };
  }
  function credential(map: Map<string, Credential>, token: string) {
    const value = map.get(digest(token));
    if (!value || value.expires <= now()) throw expired();
    return value;
  }
  return {
    async login(input: LoginInput): Promise<StaffSession> {
      const a = accounts.get(input.correo.trim().toLowerCase());
      if (a && a.blockedUntil > now()) throw new AuthError('CUENTA_BLOQUEADA', 401, 'Cuenta bloqueada por intentos fallidos. Intenta de nuevo en 15 minutos.');
      if (a && a.blockedUntil) { a.failures = 0; a.blockedUntil = 0; }
      if (!a?.active || !timingSafeEqual(scryptSync(input.contrasena, a.salt, 32), a.hash)) {
        if (a && ++a.failures >= 5) a.blockedUntil = now() + 900000;
        throw new AuthError('CREDENCIALES_INVALIDAS', 401, 'Correo o contraseña incorrectos.');
      }
      a.failures = 0;
      return { ...issue(a.employee.id), empleado: { ...a.employee } };
    },
    async yo(token: string): Promise<Employee> { return { ...account(credential(access, token).id).employee }; },
    async renew(token: string): Promise<Tokens> {
      const value = credential(refresh, token); account(value.id); revoke(value.family);
      return issue(value.id, value.family);
    },
    async logout(_token: string, refreshToken: string) {
      const value = refresh.get(digest(refreshToken)); if (value) revoke(value.family);
    },
    async change(token: string, input: PasswordInput): Promise<StaffSession> {
      const value = credential(access, token), a = account(value.id);
      validatePassword(input);
      if (!timingSafeEqual(scryptSync(input.contrasenaActual, a.salt, 32), a.hash))
        throw new AuthError('CONTRASENA_ACTUAL_INCORRECTA', 400, 'La contraseña actual es incorrecta.');
      a.hash = scryptSync(input.contrasenaNueva, a.salt, 32); a.employee.debeCambiarContrasena = false;
      for (const map of [access, refresh]) for (const [key, entry] of map) if (entry.id === value.id) map.delete(key);
      return { ...issue(value.id), empleado: { ...a.employee } };
    },
  };
}
const globalDemo = globalThis as typeof globalThis & { villaStaffDemo?: ReturnType<typeof createDemoAuth> };
export const demoAuth = () => globalDemo.villaStaffDemo ??= createDemoAuth();
