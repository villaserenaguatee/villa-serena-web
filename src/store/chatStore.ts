import type { MensajeChat } from '@/lib/pms/types';
export const CHAT_KEY = 'vs-chat-huesped';
export function leerMensajesChat(fallback: MensajeChat[] = []): MensajeChat[] {
  if (typeof window === 'undefined')
    return fallback;
  try {
    const valor = JSON.parse(window.localStorage.getItem(CHAT_KEY) || 'null');
    if (!Array.isArray(valor))
      return fallback;
    return valor;
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
