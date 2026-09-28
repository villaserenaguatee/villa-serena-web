export interface TarjetaGuardada {
  id: string;
  marca: string;
  ultimos4: string;
  titular: string;
  vencimiento: string;
  principal: boolean;
}
const KEY = 'vs-payment-methods';
export function leerTarjetas(): TarjetaGuardada[] {
  if (typeof window === 'undefined')
    return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  }
  catch {
    return [];
  }
}
export function guardarTarjetas(v: TarjetaGuardada[]) {
  if (typeof window !== 'undefined')
    localStorage.setItem(KEY, JSON.stringify(v));
}
export function tarjetaPrincipal() { return leerTarjetas().find(t => t.principal) ?? leerTarjetas()[0]; }
export function agregarTarjeta(t: Omit<TarjetaGuardada, 'id'>) {
  const prev = leerTarjetas();
  const next = t.principal ? prev.map(x => ({ ...x, principal: false })) : prev;
  const card = { ...t, id: `card-${Date.now()}` };
  guardarTarjetas([...next, card]);
  return card;
}
export function eliminarTarjeta(id: string) { guardarTarjetas(leerTarjetas().filter(t => t.id !== id)); }
