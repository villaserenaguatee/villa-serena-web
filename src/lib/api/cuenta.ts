import type { components } from './schema';
import { operacion } from './operaciones';
async function call<T>(path: string, method = 'GET', body?: unknown, signal?: AbortSignal): Promise<T> {
  try { return await operacion<T>(path, method, body, signal); }
  catch (error) {
    if (error instanceof TypeError) throw new Error('No se pudo consultar el servidor. Revisa la conexión y consulta el estado antes de repetir la operación.');
    throw error;
  }
}
export type Account = components['schemas']['CuentaRecepcion'];
export type CheckoutPreview = components['schemas']['VistaCheckout'];
export type Invoice = components['schemas']['FacturaDetalle'];
export type CheckoutInput = components['schemas']['CheckoutRecepcionPeticion'];
export const getAccount = (code: string, signal?: AbortSignal) => call<Account>(`cuentas/${encodeURIComponent(code)}`, 'GET', undefined, signal);
export const getCheckout = (code: string, signal?: AbortSignal) => call<CheckoutPreview>(`checkout/${encodeURIComponent(code)}`, 'GET', undefined, signal);
export const addCharge = (code: string, input: components['schemas']['AgregarCargoPeticion']) => call(`cuentas/${encodeURIComponent(code)}/cargos`, 'POST', input);
export const voidCharge = (code: string, id: number, motivo: string) => call(`cuentas/${encodeURIComponent(code)}/cargos/${id}/anular`, 'POST', { motivo });
export const confirmCheckout = (code: string, input: CheckoutInput) => call<components['schemas']['CheckoutResultado']>(`checkout/${encodeURIComponent(code)}`, 'POST', input);
export const getInvoice = (id: string, signal?: AbortSignal) => call<Invoice>(`facturas/${encodeURIComponent(id)}`, 'GET', undefined, signal);
