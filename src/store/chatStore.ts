import type { MensajeChat } from '@/lib/pms/types';
export const CHAT_KEY = 'vs-chat-huesped';
const MENSAJES_OBSOLETOS = new Set(['Solicito corregir mi nombre o documento de identidad antes del check-in.',
  'Quiero consultar mi solicitud de extensión de estancia.',
  'se rompio la tuberua',
  'Imagen adjunta']);
function limpiarMensajesObsoletos(mensajes: MensajeChat[]) { return mensajes.filter(m => !MENSAJES_OBSOLETOS.has((m.textoEs || m.texto || '').trim()) && !(m.eliminadoParaTodos && !m.huespedId)); }
export function leerMensajesChat(fallback: MensajeChat[] = []): MensajeChat[] {
  if (typeof window === 'undefined')
    return fallback;
  try {
    const valor = JSON.parse(window.localStorage.getItem(CHAT_KEY) || 'null');
    if (!Array.isArray(valor))
      return fallback;
    const limpios = limpiarMensajesObsoletos(valor);
    if (limpios.length !== valor.length)
      window.localStorage.setItem(CHAT_KEY, JSON.stringify(limpios));
    return limpios;
  }
  catch {
    return fallback;
  }
}
export function guardarMensajesChat(mensajes: MensajeChat[]) {
  if (typeof window === 'undefined')
    return;
  window.localStorage.setItem(CHAT_KEY, JSON.stringify(mensajes));
  window.dispatchEvent(new CustomEvent('vs-chat-actualizado'));
}
export function actualizarMensajeChat(mensajes: MensajeChat[],
  id: string,
  actualizador: (mensaje: MensajeChat) => MensajeChat) {
  const actualizados = mensajes.map((mensaje) => mensaje.id === id ? actualizador(mensaje) : mensaje);
  guardarMensajesChat(actualizados);
  return actualizados;
}
export function mensajeVisiblePara(mensaje: MensajeChat, rol: 'huesped' | 'recepcion') {
  return !mensaje.eliminadoParaTodos && !mensaje.eliminadoPara?.includes(rol);
}
