import type {components} from '@/lib/api/schema';
import {OperationError} from '@/lib/api/operaciones';
type Hotel=components['schemas']['HotelAdmin'];
type Input=components['schemas']['HotelAdminPeticion'];
export type HotelSnapshot={hotel:Hotel;revision:string|null;diagnosticoRevision?:string};
async function request(method:'GET'|'PUT',body?:Input,revision?:string|null,signal?:AbortSignal):Promise<HotelSnapshot>{
 let response:Response;
 try{response=await fetch('/api/admin/hotel',{method,cache:'no-store',signal,headers:{...(body?{'Content-Type':'application/json'}:{}),...(revision?{'If-Match':revision}:{})},...(body?{body:JSON.stringify(body)}:{})});}
 catch(error){if(signal?.aborted)throw error;throw new OperationError('No se pudo contactar al servicio. Conservamos tus cambios para reintentar.',502);}
 const value=await response.json().catch(()=>null);
 if(!response.ok)throw new OperationError(value?.mensaje??'No se pudo consultar o guardar la configuración.',response.status,value);
 if(!value||['nombre','descripcion','direccion','telefono','correo','nombreComercial','razonSocial','nit','direccionFiscal'].some(key=>typeof value[key]!=='string')||!Array.isArray(value.fotos)||value.fotos.some((foto:{clave?:unknown;orden?:unknown}|null)=>!foto||typeof foto.clave!=='string'||!Number.isInteger(foto.orden)))throw new OperationError('El servicio devolvió una configuración incompleta. Conservamos tus cambios.',502);
 const tag=response.headers.get('ETag');
 const strong=(value:unknown):value is string=>typeof value==='string'&&/^"[a-f0-9]{64}"$/.test(value);
 const bodyTag=value.revisionGaleria;
 if(strong(tag)&&strong(bodyTag)&&tag!==bodyTag)throw new OperationError('La revision del cuerpo no coincide con ETag. No se habilitaron cambios de galeria.',502);
 const effectiveRevision=strong(tag)?tag:strong(bodyTag)?bodyTag:null;
 const diagnosticoRevision=strong(tag)?'ETAG_VALIDO':strong(bodyTag)?tag?'ETAG_NO_ADMITIDO_REVISION_DEL_API':'ETAG_AUSENTE_REVISION_DEL_API':tag?'ETAG_NO_ADMITIDO':'REVISION_AUSENTE';
 return {hotel:value as Hotel,revision:effectiveRevision,diagnosticoRevision};
}
export const readHotelConfiguration=(signal?:AbortSignal)=>request('GET',undefined,undefined,signal);
export const saveHotelConfiguration=(body:Input,revision?:string|null)=>request('PUT',body,revision);
