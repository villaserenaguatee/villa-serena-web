import { NextRequest, NextResponse } from 'next/server';
import { authError, sameOrigin, withStaffSession, writeCookies } from '@/lib/bff/auth/http';
import { AuthError } from '@/lib/bff/auth/errors';
import { parseChannelInput, simulateChannel } from '@/lib/bff/channelSimulator';
import { AvailabilityError } from '@/lib/bff/publicAvailability';
export const runtime = 'nodejs';
export async function POST(request: NextRequest) {
  try {
    sameOrigin(request);
    const session = await withStaffSession(request, async (_access, employee) => {
      if (employee.rol !== 'ADMIN') throw new AuthError('ACCESO_DENEGADO', 403, 'Acceso denegado');
      if ((process.env.VILLA_SERENA_BFF_MODE ?? 'demo') !== 'demo') throw new AuthError('API_NOT_READY', 503, 'La conexión real está pendiente de validación.');
      const reader = request.body?.getReader();
      if (!reader) throw new AuthError('DATOS_INVALIDOS', 400, 'Completa los datos de la reserva.');
      const chunks: Uint8Array[] = []; let size = 0;
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        size += value.length;
        if (size > 16384) { await reader.cancel(); throw new AuthError('DATOS_INVALIDOS', 400, 'Los datos son demasiado largos.'); }
        chunks.push(value);
      }
      try {
        const input = parseChannelInput(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        return simulateChannel(input);
      } catch (e) {
        if (e instanceof AvailabilityError) throw new AuthError(e.code, e.status, e.status === 400 ? 'Revisa los datos obligatorios del huésped y de la reserva.' : 'No se pudo completar la simulación. Intenta nuevamente.');
        throw new AuthError('DATOS_INVALIDOS', 400, 'Envía datos JSON válidos.');
      }
    });
    if (session.response) return session.response;
    const response = NextResponse.json(session.value, { headers: { 'Cache-Control': 'no-store', 'X-Villa-Serena-Mode': 'demo' } });
    return session.rotated ? writeCookies(response, request, session.rotated) : response;
  } catch (e) { return authError(e); }
}
