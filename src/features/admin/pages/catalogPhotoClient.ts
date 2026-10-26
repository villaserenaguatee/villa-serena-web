import {operacion} from '@/lib/api/operaciones';
import {validarFoto} from '@/lib/incidenciaValidation';
import type {components} from '@/lib/api/schema';
export type PhotoUse='HOTEL'|'TIPO_HABITACION'|'MENU';
export type CatalogPhotoDraft={clave?:string;url?:string;file?:File;principal:boolean};
export async function uploadCatalogPhoto(file:File,uso:PhotoUse):Promise<string>{
 const error=validarFoto(file);if(error)throw Error(error);
 const body=new FormData();body.set('archivo',file);body.set('uso',uso);
 const response=await operacion<components['schemas']['ImagenSubida']>('archivos/imagenes','POST',body);
 if(typeof response?.clave!=='string'||!response.clave.trim())throw Error('El servicio no devolvió la referencia de la fotografía.');
 return response.clave;
}
export async function resolveCatalogPhotos(photos:CatalogPhotoDraft[],uso:PhotoUse,uploaded:Map<File,string>,onProgress?:(completed:number,total:number)=>void):Promise<{clave:string;orden:number;principal:boolean}[]>{
 const result:{clave:string;orden:number;principal:boolean}[]=[];
 for(const [orden,photo]of photos.entries()){
  let clave=photo.clave;
  if(photo.file){clave=uploaded.get(photo.file);if(!clave){clave=await uploadCatalogPhoto(photo.file,uso);uploaded.set(photo.file,clave);}}
  if(!clave)throw Error('Hay una fotografía sin cargar.');result.push({clave,orden,principal:photo.principal});onProgress?.(orden+1,photos.length);
 }
 return result;
}
