import 'server-only';
import { AuthError } from './auth/errors';
/** Enforce the byte budget while reading, including requests without Content-Length. */
export async function readLimitedBody(request: Request, maximum: number): Promise<string> {
  const length = request.headers.get('content-length');
  if (length && Number(length) > maximum) throw new AuthError('CONTENIDO_DEMASIADO_GRANDE', 413, 'El contenido supera el tamaño permitido.');
  if (!request.body) return '';
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > maximum) { await reader.cancel(); throw new AuthError('CONTENIDO_DEMASIADO_GRANDE', 413, 'El contenido supera el tamaño permitido.'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return new TextDecoder().decode(bytes);
}
