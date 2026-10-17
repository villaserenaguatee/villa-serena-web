import type { components } from './schema';
export type GuestAccount = components['schemas']['CuentaHuesped'];
export type GuestCheckout = components['schemas']['VistaCheckout'];
export async function guestAccountCall<T>(code:string,route:'cuenta'|'checkout',body?:unknown,signal?:AbortSignal):Promise<T>{
 const response=await fetch(`/api/app/reservas/${encodeURIComponent(code)}/${route}`,{method:body===undefined?'GET':'POST',cache:'no-store',signal,...(body===undefined?{}:{headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})});
 const value=await response.json().catch(()=>null);if(!response.ok)throw new Error(value?.mensaje??'No se pudo consultar la cuenta.');return value;
}
