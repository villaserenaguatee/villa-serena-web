export class AuthError extends Error {
  constructor(public codigo: string, public status: number, mensaje: string) { super(mensaje); }
}
// Next empaqueta Route Handlers y componentes de servidor por separado.
// El proveedor demo global puede devolver errores de otro paquete; no usar instanceof AuthError.
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof Error && 'codigo' in error && typeof error.codigo === 'string' &&
    'status' in error && typeof error.status === 'number';
}
export const expired = () => new AuthError('SESION_VENCIDA', 401, 'Tu sesión venció. Inicia sesión de nuevo.');
export function validatePassword(input: { contrasenaActual: string; contrasenaNueva: string; confirmacion: string }) {
  if (input.contrasenaNueva !== input.confirmacion)
    throw new AuthError('DATOS_INVALIDOS', 400, 'La confirmación no coincide con la nueva contraseña.');
  if (input.contrasenaNueva.length < 8 || !/[a-záéíóúñ]/i.test(input.contrasenaNueva) || !/\d/.test(input.contrasenaNueva) || input.contrasenaNueva === input.contrasenaActual)
    throw new AuthError('CONTRASENA_INVALIDA', 400, 'La nueva contraseña debe tener al menos 8 caracteres, una letra y un número, y ser distinta de la actual.');
}
