import {validPhone} from '@/lib/guestValidation';
export type PersonalDraft = Record<string, unknown>;
export type PersonalErrors = Record<string, string>;
export function validatePersonal(d: PersonalDraft, serverPassword = false): PersonalErrors {
  const errors: PersonalErrors = {};
  const text = (key: string) => typeof d[key] === 'string' ? (d[key] as string).trim() : '';
  for (const key of ['nombre', 'correo', 'telefono', 'rol', 'estado']) {
    if (!text(key)) errors[key] = 'Complete este campo';
  }
  if (text('nombre').length > 150) errors.nombre = 'Use hasta 150 caracteres';
  if (text('correo') && (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text('correo')) || text('correo').length > 150)) errors.correo = 'Ingrese un correo electrónico válido';
  if (text('telefono') && (!validPhone(text('telefono')) || text('telefono').length > 30)) errors.telefono = 'Use de 7 a 15 dígitos, sin letras, y hasta 30 caracteres con formato';
  if (text('rol') && !['ADMIN', 'RECEPCION', 'ROOM_SERVICE', 'MANTENIMIENTO_LIMPIEZA'].includes(text('rol'))) errors.rol = 'Seleccione un rol válido';
  if (text('estado') && !['ACTIVO', 'INACTIVO'].includes(text('estado'))) errors.estado = 'Seleccione un estado válido';
  if (text('rol') === 'MANTENIMIENTO_LIMPIEZA' && !['LIMPIEZA', 'MANTENIMIENTO', 'AMBAS'].includes(text('area'))) errors.area = 'Seleccione el área del empleado';
  if (!d.id && !serverPassword) {
    if (!text('accesoInicial')) errors.accesoInicial = 'Complete este campo';
    else if (text('accesoInicial').length < 12 || String(d.accesoInicial).length > 100) errors.accesoInicial = 'Use entre 12 y 100 caracteres';
  }
  const profile = (d.perfil ?? {}) as Record<string, unknown>;
  for (const key of ['turno', 'asistencia']) {
    if (typeof profile[key] === 'string' && profile[key] !== '' && !profile[key].trim()) errors['perfil.' + key] = 'Ingrese un valor o deje el campo vacío';
  }
  const date = profile.fechaContratacion;
  if (date && (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date)) errors['perfil.fechaContratacion'] = 'Ingrese una fecha válida';
  for (const key of ['salarioBase', 'bonosExtras', 'descuentosNomina']) {
    const value = profile[key];
    if (value !== undefined && value !== null && value !== '' && (String(value).trim() === '' || !Number.isFinite(Number(value)) || Number(value) < 0 || Number(value) > 9999999 || !/^\d+(\.\d{1,2})?$/.test(String(value)))) errors['perfil.' + key] = 'Ingrese un importe de 0 a 9,999,999 con hasta dos decimales';
  }
  return errors;
}
