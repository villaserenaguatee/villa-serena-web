import type { MensajeChat } from '@/lib/pms/types';
export const CHAT_KEY = 'vs-chat-huesped';
const PREFERENCIAS_KEY = 'vs-chat-recepcion-preferencias';
export type PreferenciasChat = { favoritos: string[]; archivados: string[]; fijados: string[] };
export function leerPreferenciasChat(): PreferenciasChat {
  try {
    const data = JSON.parse(localStorage.getItem(PREFERENCIAS_KEY) || '{}');
    const ids = (value: unknown): string[] => Array.isArray(value) ? value.filter((id): id is string => typeof id === 'string') : [];
    return { favoritos: ids(data?.favoritos), archivados: ids(data?.archivados), fijados: ids(data?.fijados) };
  } catch { return { favoritos: [], archivados: [], fijados: [] }; }
}
export function guardarPreferenciasChat(preferencias: PreferenciasChat) {
  localStorage.setItem(PREFERENCIAS_KEY, JSON.stringify(preferencias));
  window.dispatchEvent(new CustomEvent('vs-chat-actualizado'));
}
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
