'use client';
import { useEffect, useRef, useState } from 'react';
import {
  habitacionesLimpieza,
  iniciarLimpieza,
  interrumpirLimpieza,
  terminarLimpieza,
  colaSolicitudes,
  tomarSolicitud,
  atenderSolicitud,
  OperationError,
  type HabitacionLimpiezaAPI,
  type SolicitudLimpiezaAPI,
} from '@/lib/api/operaciones';
import { useTiempoReal } from '@/lib/tiempo-real/useTiempoReal';

export type { HabitacionLimpiezaAPI, SolicitudLimpiezaAPI };

export interface SolicitudAviso {
  id: number;
  habitacionNumero: string;
  piso: number;
  tipo: string;
  hora: string;
}

export function ordenarHabitaciones(list: HabitacionLimpiezaAPI[]): HabitacionLimpiezaAPI[] {
  return [...list].sort((a, b) => {
    if (a.llegadaHoy !== b.llegadaHoy) return a.llegadaHoy ? -1 : 1;
    const timeA = a.suciaDesde ? new Date(a.suciaDesde).getTime() : 0;
    const timeB = b.suciaDesde ? new Date(b.suciaDesde).getTime() : 0;
    if (timeA !== timeB) return timeA - timeB;
    return a.habitacion.numero.localeCompare(b.habitacion.numero);
  });
}

export function ordenarSolicitudes(list: SolicitudLimpiezaAPI[]): SolicitudLimpiezaAPI[] {
  return [...list].sort((a, b) => {
    const timeA = new Date(a.creadaEn).getTime();
    const timeB = new Date(b.creadaEn).getTime();
    return timeA - timeB;
  });
}

export function useLimpieza(
  enabled: boolean,
  usuarioActual: { id?: number | string; nombre?: string },
  avisarNuevaSolicitud?: (aviso: SolicitudAviso) => void
) {
  const [habitaciones, setHabitaciones] = useState<HabitacionLimpiezaAPI[]>([]);
  const [solicitudes, setSolicitudes] = useState<SolicitudLimpiezaAPI[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(enabled);

  const mounted = useRef(false);
  const version = useRef(0);
  const locked = useRef(false);
  const aviso = useRef(avisarNuevaSolicitud);
  aviso.current = avisarNuevaSolicitud;
  const seenSolicitudes = useRef(new Set<number>());

  const recargar = async () => {
    const current = ++version.current;
    try {
      const [habs, sols] = await Promise.all([
        habitacionesLimpieza(),
        colaSolicitudes(),
      ]);
      if (mounted.current && current === version.current) {
        setHabitaciones(ordenarHabitaciones(habs.filter(h => (h.condicion as string) !== 'LIMPIA')));
        setSolicitudes(ordenarSolicitudes(sols.filter(s => s.estado === 'PENDIENTE' || s.estado === 'EN_PROCESO')));
        setError('');
      }
    } catch (e) {
      if (mounted.current && current === version.current) {
        setError(e instanceof Error ? e.message : 'No se pudieron consultar los datos de limpieza.');
      }
    } finally {
      if (mounted.current && current === version.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    mounted.current = true;
    if (enabled) void recargar();
    return () => {
      mounted.current = false;
      version.current++;
    };
  }, [enabled]);

  // STOMP: /topic/habitaciones
  useTiempoReal(
    '/topic/habitaciones',
    event => {
      const e = event as {
        tipo?: string;
        datos?: {
          id?: number;
          habitacionId?: number;
          numero?: string;
          condicion?: string;
        };
        id?: number;
        habitacionId?: number;
        numero?: string;
        condicion?: string;
      };
      const condicion = e?.datos?.condicion ?? e?.condicion;
      const habId = e?.datos?.id ?? e?.datos?.habitacionId ?? e?.habitacionId ?? e?.id;
      const num = e?.datos?.numero ?? e?.numero;

      if (condicion === 'LIMPIA' && (habId || num)) {
        setHabitaciones(prev => prev.filter(h => (habId ? h.habitacion.id !== habId : true) && (num ? h.habitacion.numero !== num : true)));
      }
      void recargar();
    },
    () => void recargar(),
    enabled,
    setError
  );

  // STOMP: /topic/solicitudes
  useTiempoReal(
    '/topic/solicitudes',
    event => {
      const e = event as {
        accion?: string;
        datos?: {
          id?: number;
          solicitudId?: number;
          tipo?: string;
          habitacion?: { numero?: string; piso?: number };
          creadaEn?: string;
        };
        id?: number;
        solicitudId?: number;
        tipo?: string;
        habitacion?: { numero?: string; piso?: number };
        creadaEn?: string;
      };
      const solId = e?.datos?.solicitudId ?? e?.datos?.id ?? e?.solicitudId ?? e?.id;
      if (solId && Number.isSafeInteger(Number(solId)) && !seenSolicitudes.current.has(Number(solId))) {
        seenSolicitudes.current.add(Number(solId));
        if (seenSolicitudes.current.size > 200) {
          seenSolicitudes.current.delete(seenSolicitudes.current.values().next().value!);
        }
        const habNum = e?.datos?.habitacion?.numero ?? e?.habitacion?.numero ?? 'N/A';
        const piso = e?.datos?.habitacion?.piso ?? e?.habitacion?.piso ?? 0;
        const tipoSol = e?.datos?.tipo ?? e?.tipo ?? 'LIMPIEZA';
        const hora = e?.datos?.creadaEn ?? e?.creadaEn ?? new Date().toISOString();
        aviso.current?.({
          id: Number(solId),
          habitacionNumero: habNum,
          piso,
          tipo: tipoSol,
          hora,
        });
      }
      void recargar();
    },
    () => void recargar(),
    enabled,
    setError
  );

  async function ejecutarAccion(fn: () => Promise<unknown>, mensajeError: string, interpretar409?: (data: unknown) => string | null) {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      await fn();
      await recargar();
    } catch (e) {
      if (e instanceof OperationError && e.status === 409) {
        await recargar();
        const custom = interpretar409 ? interpretar409(e.data) : null;
        setError(custom || e.message || 'Conflicto de concurrencia: el registro fue modificado por otro empleado.');
      } else {
        setError(e instanceof Error ? e.message : mensajeError);
      }
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }

  const estaACargo = (empleado?: { id?: number; nombre?: string } | null) => {
    if (!empleado) return false;
    if (usuarioActual.id && empleado.id !== undefined && (Number(usuarioActual.id) === empleado.id || String(usuarioActual.id) === String(empleado.id))) return true;
    if (usuarioActual.nombre && empleado.nombre && empleado.nombre.trim().toLowerCase() === usuarioActual.nombre.trim().toLowerCase()) return true;
    return false;
  };

  return {
    habitaciones,
    solicitudes,
    loading,
    busy,
    error,
    setError,
    recargar,
    estaACargo,
    iniciar: (id: number) =>
      ejecutarAccion(
        () => iniciarLimpieza(id),
        'No se pudo iniciar la limpieza.',
        (data: any) => {
          const nombre = data?.empleadoACargo?.nombre ?? data?.empleado ?? data?.nombre;
          return nombre ? `La habitación ya está siendo limpiada por ${nombre}. Se recargó su estado actual.` : null;
        }
      ),
    interrumpir: (id: number) =>
      ejecutarAccion(
        () => interrumpirLimpieza(id),
        'No se pudo interrumpir la limpieza.'
      ),
    terminar: (id: number) =>
      ejecutarAccion(
        () => terminarLimpieza(id),
        'No se pudo terminar la limpieza.'
      ),
    tomar: (id: number) =>
      ejecutarAccion(
        () => tomarSolicitud(id),
        'No se pudo tomar la solicitud.',
        (data: any) => {
          const motivo = data?.motivo ?? data?.mensaje;
          return motivo ? `No se pudo tomar la solicitud: ${motivo}. Se recargó la lista.` : null;
        }
      ),
    atender: (id: number) =>
      ejecutarAccion(
        () => atenderSolicitud(id),
        'No se pudo marcar la solicitud como atendida.',
        (data: any) => {
          const motivo = data?.motivo ?? data?.mensaje;
          return motivo ? `No se pudo atender la solicitud: ${motivo}. Se recargó la lista.` : null;
        }
      ),
  };
}
