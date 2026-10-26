import type {components} from '@/lib/api/schema';
import {OperationError} from '@/lib/api/operaciones';
type Hotel=components['schemas']['HotelAdmin'];
type Input=components['schemas']['HotelAdminPeticion'];
export type HotelSnapshot={hotel:Hotel;revision:string|null};
async function request(method:'GET'|'PUT',body?:Input,revision?:string|null,signal?:AbortSignal):Promise<HotelSnapshot>{
 let response:Response;
 try{response=await fetch('/api/admin/hotel',{method,cache:'no-store',signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(revision?{'If-Match':revision}:{})},...(body?{body:JSON.stringify(body)}:{})});}
 catch(error){if(signal?.aborted)throw error;throw new OperationError('No se pudo contactar al servicio. Conservamos tus cambios para reintentar.',502);}
 const value=await response.json().catch(()=>null);
 if(!response.ok)throw new OperationError(value?.mensaje??'No se pudo consultar o guardar la configuración.',response.status,value);
 if(!value||['nombre','descripcion','direccion','telefono','correo','nombreComercial','razonSocial','nit','direccionFiscal'].some(key=>typeof value[key]!=='string')||!Array.isArray(value.fotos)||value.fotos.some((foto:{clave?:unknown;orden?:unknown}|null)=>!foto||typeof foto.clave!=='string'||!Number.isInteger(foto.orden)))throw new OperationError('El servicio devolvió una configuración incompleta. Conservamos tus cambios.',502);
 const tag=response.headers.get('ETag');
 return {hotel:value as Hotel,revision:tag&&/^"[a-f0-9]{64}"$/.test(tag)?tag:null};
}
export const readHotelConfiguration=(signal?:AbortSignal)=>request('GET',undefined,undefined,signal);
export const saveHotelConfiguration=(body:Input,revision?:string|null)=>request('PUT',body,revision);
