import 'server-only';
import { NextRequest, NextResponse } from 'next/server';
import { authError, sameOrigin, withStaffSession, writeCookies } from './auth/http';
import { AuthError } from './auth/errors';
import { MAX_FOTO, validarFoto } from '@/lib/incidenciaValidation';
async function boundedForm(request: Request) {
  const reader = request.body?.getReader();
  if (!reader) throw new AuthError('FOTO_INVALIDA', 400, 'Selecciona una foto.');
  const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { value, done } = await reader.read(); if (done) break; size += value.length; if (size > MAX_FOTO + 65536) { await reader.cancel(); throw new AuthError('FOTO_INVALIDA', 413, 'La foto debe pesar como máximo 5 MB.'); } chunks.push(value); }
  try { return await new Response(Buffer.concat(chunks), { headers: { 'Content-Type': request.headers.get('content-type') ?? '' } }).formData(); }
  catch { throw new AuthError('FOTO_INVALIDA', 400, 'Envía una foto JPG o PNG.'); }
}
export async function incidenciaFotoRoute(request: NextRequest) {
  try {
    sameOrigin(request);
    let cachedForm: FormData | undefined;
    const session = await withStaffSession(request, async (access, employee) => {
      if (!['RECEPCION', 'MANTENIMIENTO_LIMPIEZA', 'ADMIN'].includes(employee.rol)) throw new AuthError('ACCESO_DENEGADO', 403, 'Acceso denegado');
      if (process.env.STAFF_AUTH_MODE !== 'spring' || !process.env.API_URL) throw new AuthError('API_NO_DISPONIBLE', 503, 'La carga de fotos requiere conexión al API.');
      const form = cachedForm ??= await boundedForm(request), file = form.get('archivo');
      if (!(file instanceof File) || validarFoto(file)) throw new AuthError('FOTO_INVALIDA', 400, file instanceof File ? validarFoto(file) : 'Selecciona una foto.');
      // ADMIN conserva los usos ya definidos en el proxy; MYL/Recepción solo INCIDENCIA.
      if (employee.rol !== 'ADMIN' && form.get('uso') !== 'INCIDENCIA') throw new AuthError('ACCESO_DENEGADO', 403, 'Solo puedes cargar fotos de incidencias.');
      const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
      const jpg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
      const png = [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b);
      if (!(file.type === 'image/jpeg' ? jpg : png)) throw new AuthError('FOTO_INVALIDA', 400, 'El contenido no corresponde a una foto JPG o PNG.');
      let response: Response;
      try { response = await fetch(new URL('/api/v1/archivos/imagenes', process.env.API_URL), { method: 'POST', body: form, cache: 'no-store', redirect: 'error', signal: AbortSignal.timeout(10000), headers: { Authorization: `Bearer ${access}`, Accept: 'application/json' } }); }
      catch { throw new AuthError('API_NO_DISPONIBLE', 502, 'No se pudo subir la foto.'); }
      const value = await response.json().catch(() => null);
      if (!response.ok) throw new AuthError('ERROR_FOTO', response.status, 'No se pudo subir la foto.');
      if (typeof value?.clave !== 'string' || !value.clave) throw new AuthError('RESPUESTA_INVALIDA', 502, 'El API devolvió una imagen incompleta.');
      return { clave: value.clave };
    });
    if (session.response) return session.response;
    const response = NextResponse.json(session.value, { status: 201, headers: { 'Cache-Control': 'no-store' } });
    return session.rotated ? writeCookies(response, request, session.rotated) : response;
  } catch (e) { return authError(e); }
}
