import 'server-only';
import { AuthError } from './auth/errors';
import type { ChannelInput } from './contracts/channel';
// Preparación para la conexión real. Solo el servidor podrá construir estas cabeceras.
// El modo de prueba no requiere ni envía credenciales de canales reales.
export function channelServerHeaders(channel: ChannelInput['canal']): Headers {
  const codigo = process.env[`CANAL_${channel}_CODIGO`], clave = process.env[`CANAL_${channel}_CLAVE`];
  if (!codigo || !clave) throw new AuthError('CONFIGURACION_INVALIDA', 503, 'Falta configurar el canal en el servidor.');
  return new Headers({ 'Content-Type': 'application/json', 'X-Canal-Codigo': codigo, 'X-Canal-Clave': clave });
}
