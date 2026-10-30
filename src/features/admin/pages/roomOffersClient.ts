import {operacion,OperationError} from '@/lib/api/operaciones';
import type {components} from '@/lib/api/schema';
export type Offer=components['schemas']['OfertaAdmin'];
export type OfferInput=components['schemas']['GuardarOfertaAdminPeticion'];
export type RoomFeatures=components['schemas']['CaracteristicasHabitacionAdmin'];
export type FeaturesInput=components['schemas']['CaracteristicasHabitacionPeticion'];
export type CatalogRoom={id:number;numero:string;piso:number;tipoHabitacionId:number;estado:string};
export const readOffers=(signal?:AbortSignal)=>operacion<Offer[]>('admin/ofertas','GET',undefined,signal);
export const readCatalogRooms=(signal?:AbortSignal)=>operacion<CatalogRoom[]>('admin/catalogos/habitaciones','GET',undefined,signal);
export const readFeatures=(id:number,signal?:AbortSignal)=>operacion<RoomFeatures>(`admin/habitaciones/${id}/caracteristicas`,'GET',undefined,signal);
export async function saveFeatures(id:number,input:FeaturesInput){
 const value=await operacion<RoomFeatures>(`admin/habitaciones/${id}/caracteristicas`,'PUT',input);
 if(value?.superficieM2!==input.superficieM2||value.capacidad!==input.capacidad||!value.camas)throw new OperationError('No se pudo confirmar el guardado. Consulta nuevamente.',502);
 return value;
}
export async function saveOffer(slug:string,input:OfferInput,create:boolean){
 const value=await operacion<Offer>(`admin/ofertas/${slug}`,create?'POST':'PUT',input);
 if(value?.slug!==slug||value.tipoHabitacionId!==input.tipoHabitacionId||!Array.isArray(value.habitacionIds)||value.publicada!==input.publicada)throw new OperationError('No se pudo confirmar la oferta. Consulta nuevamente.',502);
 return value;
}
export async function publishOffer(slug:string,publicada:boolean){
 const value=await operacion<Offer>(`admin/ofertas/${slug}/publicacion`,'PATCH',{publicada} satisfies components['schemas']['PublicacionOfertaPeticion']);
 if(value?.slug!==slug||value.publicada!==publicada)throw new OperationError('No se pudo confirmar la publicación. Consulta nuevamente.',502);
 return value;
}
