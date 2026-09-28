import type { ObjetoOlvidado } from '@/lib/pms/types';
export const CLAVE_OBJETOS_OLVIDADOS = 'vs-objetos-olvidados';
export function leerObjetosOlvidados(): ObjetoOlvidado[] {
  if (typeof window === 'undefined')
    return [];
  try {
    const x = JSON.parse(localStorage.getItem(CLAVE_OBJETOS_OLVIDADOS) || '[]');
    return Array.isArray(x) ? x : [];
  }
  catch {
    return [];
  }
}
export function guardarObjetosOlvidados(objetos: ObjetoOlvidado[]) {
  if (typeof window === 'undefined')
    return;
  localStorage.setItem(CLAVE_OBJETOS_OLVIDADOS, JSON.stringify(objetos));
  window.dispatchEvent(new CustomEvent('vs-objetos-actualizados'));
}
export function registrarObjetoOlvidado(objeto: ObjetoOlvidado) {
  const actuales = leerObjetosOlvidados();
  guardarObjetosOlvidados([objeto, ...actuales.filter(o => o.id !== objeto.id)]);
}
export function actualizarObjetoOlvidado(id: string, cambios: Partial<ObjetoOlvidado>) { guardarObjetosOlvidados(leerObjetosOlvidados().map(o => o.id === id ? { ...o, ...cambios } : o)); }
