import 'server-only';
import { demoAuth } from './demo';
import { createSpringAuth } from './spring';
import { AuthError } from './errors';
export function authProvider() {
  const mode = process.env.STAFF_AUTH_MODE ?? 'demo';
  if (mode === 'demo') return demoAuth();
  if (mode === 'spring' && process.env.API_URL) return createSpringAuth(process.env.API_URL);
  throw new AuthError('CONFIGURACION_INVALIDA', 503, 'Configura STAFF_AUTH_MODE y API_URL en el servidor.');
}
