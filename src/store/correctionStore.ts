import { guardarEmpleados, leerEmpleados } from '@/store/employeeStore';
export type EstadoCorreccion = 'pendiente' | 'aprobada' | 'rechazada';
export type SolicitudCorreccion = {
  id: string;
  empleadoId?: string;
  empleado: string;
  area: string;
  codigo: string;
  dato: string;
  actual: string;
  nuevo: string;
  motivo?: string;
  creadaEn: string;
  estado: EstadoCorreccion;
  leidaAdmin?: boolean;
  resueltaEn?: string;
  motivoRechazo?: string;
};
export type NotificacionEmpleado = {
  id: string;
  empleadoId?: string;
  codigo: string;
  titulo: string;
  mensaje: string;
  motivo?: string;
  creadaEn: string;
  leida?: boolean;
};
const KEY = 'vs-correcciones-personal';
const NKEY = 'vs-notificaciones-empleado';
export const EVENT = 'vs-correcciones-personal-updated';
export const EMP_EVENT = 'vs-notificaciones-empleado-updated';
export function leerCorrecciones(): SolicitudCorreccion[] {
  if (typeof window === 'undefined')
    return [];
  try {
    const x = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(x) ? x : [];
  }
  catch {
    return [];
  }
}
export function guardarCorrecciones(v: SolicitudCorreccion[]) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event(EVENT));
}
export function crearCorreccion(v: Omit<SolicitudCorreccion, 'id' | 'creadaEn' | 'estado' | 'leidaAdmin'>) {
  const s: SolicitudCorreccion = { ...v, id: `corr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, creadaEn: new Date().toISOString(), estado: 'pendiente', leidaAdmin: false };
  guardarCorrecciones([s, ...leerCorrecciones()]);
  return s;
}
export function marcarLeidasAdmin() { guardarCorrecciones(leerCorrecciones().map(x => ({ ...x, leidaAdmin: true }))); }
export function leerNotificacionesEmpleado(): NotificacionEmpleado[] {
  if (typeof window === 'undefined')
    return [];
  try {
    const x = JSON.parse(localStorage.getItem(NKEY) || '[]');
    return Array.isArray(x) ? x : [];
  }
  catch {
    return [];
  }
}
function notificarEmpleado(n: NotificacionEmpleado) {
  const all = [n, ...leerNotificacionesEmpleado()];
  localStorage.setItem(NKEY, JSON.stringify(all));
  window.dispatchEvent(new Event(EMP_EVENT));
}
export function resolverCorreccion(id: string,
  aprobar: boolean,
  motivoRechazo = '') {
    const req = leerCorrecciones().find(x => x.id === id);
  if (!req)
    return;
  if (aprobar) {
    const lista = leerEmpleados().map(e => {
      if ((req.empleadoId && e.id === req.empleadoId) || e.codigoEmpleado === req.codigo) {
        if (req.dato === 'Nombre completo')
          return { ...e, nombre: req.nuevo };
        if (req.dato === 'Teléfono')
          return { ...e, telefono: req.nuevo };
        if (req.dato === 'Correo electrónico')
          return { ...e, correo: req.nuevo };
      }
      return e;
    });
    guardarEmpleados(lista);
  }
  const next = leerCorrecciones().map(x => x.id === id ? { ...x, estado: (aprobar ? 'aprobada' : 'rechazada') as EstadoCorreccion, resueltaEn: new Date().toISOString(), motivoRechazo: motivoRechazo || undefined } : x);
  guardarCorrecciones(next);
  notificarEmpleado({
    id: `notif-${Date.now()}`,
    empleadoId: req.empleadoId,
    codigo: req.codigo,
    titulo: aprobar ? 'Corrección aprobada' : 'Corrección no aprobada',
    mensaje: aprobar ? 'Administración aprobó la corrección solicitada en tu perfil.' : 'Administración revisó tu solicitud de corrección.',
    motivo: motivoRechazo || undefined,
    creadaEn: new Date().toISOString()
  });
}
