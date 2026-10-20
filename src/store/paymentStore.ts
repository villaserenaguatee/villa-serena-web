export interface TarjetaGuardada {
  id: string;
  huespedId: string;
  marca: string;
  ultimos4: string;
  titular: string;
  vencimiento: string;
  principal: boolean;
  demo?: boolean;
}
const KEY = 'vs-payment-methods';
// Los registros legacy sin propietario se conservan, pero no se exponen.
function leerRegistros(): unknown[] {
  if (typeof window === 'undefined') return [];
  const registros: unknown = JSON.parse(localStorage.getItem(KEY) || '[]');
  if (!Array.isArray(registros)) throw new Error('Invalid payment methods storage');
  return registros;
}
function pertenece(registro: unknown, huespedId: string): registro is TarjetaGuardada {
  return !!huespedId.trim() && typeof registro === 'object' && registro !== null &&
    'huespedId' in registro && registro.huespedId === huespedId;
}
export function leerTarjetas(huespedId: string): TarjetaGuardada[] {
  try { return leerRegistros().filter(t => pertenece(t, huespedId)); }
  catch { return []; }
}
export function guardarTarjetas(huespedId: string, tarjetas: TarjetaGuardada[]) {
  if (!huespedId.trim()) throw new Error('Guest ID required');
  if (typeof window === 'undefined') return;
  const registros = leerRegistros();
  const ajenos = registros.filter(t => !pertenece(t, huespedId));
  if (tarjetas.some(t => t.huespedId !== huespedId || ajenos.some(x =>
    typeof x === 'object' && x !== null && 'id' in x && x.id === t.id)))
    throw new Error('Payment method ownership mismatch');
  // Lista explicita de metadatos: no persistir campos adicionales del formulario.
  const propios = tarjetas.map(t => ({
    id: t.id, huespedId, marca: t.marca, ultimos4: t.ultimos4,
    titular: t.titular, vencimiento: t.vencimiento, principal: t.principal, ...(t.demo ? { demo: true } : {}),
  }));
  localStorage.setItem(KEY, JSON.stringify([...ajenos, ...propios]));
}
export function tarjetaPrincipal(huespedId: string) {
  const tarjetas = leerTarjetas(huespedId);
  return tarjetas.find(t => t.principal) ?? tarjetas[0];
}
export function agregarTarjeta(huespedId: string, t: Omit<TarjetaGuardada, 'id' | 'huespedId'>) {
  const prev = leerTarjetas(huespedId);
  const next = t.principal ? prev.map(x => ({ ...x, principal: false })) : prev;
  const card: TarjetaGuardada = {
    id: 'card-' + crypto.randomUUID(), huespedId, marca: t.marca,
    ultimos4: t.ultimos4, titular: t.titular, vencimiento: t.vencimiento, principal: t.principal, ...(t.demo ? { demo: true } : {}),
  };
  guardarTarjetas(huespedId, [...next, card]);
  return card;
}
export function eliminarTarjeta(huespedId: string, id: string) {
  const propias = leerTarjetas(huespedId);
  if (!propias.some(t => t.id === id)) return;
  guardarTarjetas(huespedId, propias.filter(t => t.id !== id));
}
