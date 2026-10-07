'use client';
import { useEffect, useRef } from 'react';
import { TiempoReal, type Destino } from './client';
let shared: TiempoReal | undefined;
export function useTiempoReal(destino: Destino, alRecibir: (evento: unknown) => void, alReconectar: () => void, enabled = true, alError?: (mensaje: string) => void) {
  const callbacks = useRef({ alRecibir, alReconectar, alError });
  callbacks.current = { alRecibir, alReconectar, alError };
  useEffect(() => {
    if (!enabled) return;
    shared ??= new TiempoReal(process.env.NEXT_PUBLIC_WS_URL);
    return shared.subscribe(destino, { recibir: e => callbacks.current.alRecibir(e), recargar: () => callbacks.current.alReconectar(), error: m => callbacks.current.alError?.(m) });
  }, [destino, enabled]);
}
