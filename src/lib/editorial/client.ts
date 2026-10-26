import {operacion,OperationError} from '@/lib/api/operaciones';
import {EDITORIAL_IDS,type EditorialDocument,type EditorialElement,type EditorialLanguage} from './catalog';
function document(value:EditorialDocument,language:EditorialLanguage):EditorialDocument{
 if(!value||value.idioma!==language||!Number.isInteger(value.revision)||value.revision<0||!Number.isInteger(value.revisionPublicada)||!Array.isArray(value.elementos)||value.elementos.some(element=>!element||!EDITORIAL_IDS.includes(element.id)))throw new OperationError('El servicio devolvió contenido incompleto. Conservamos tus cambios.',502);
 return value;
}
export const readEditorialDraft=async(language:EditorialLanguage,signal?:AbortSignal)=>document(await operacion<EditorialDocument>(`admin/hotel/editorial/${language}`,'GET',undefined,signal),language);
export const saveEditorialDraft=async(language:EditorialLanguage,revision:number,elementos:EditorialElement[])=>document(await operacion<EditorialDocument>(`admin/hotel/editorial/${language}`,'PUT',{revision,elementos}),language);
export const publishEditorial=async(language:EditorialLanguage,revision:number)=>document(await operacion<EditorialDocument>(`admin/hotel/editorial/${language}/publicacion`,'POST',{revision}),language);
export async function readPublishedEditorial(language:EditorialLanguage,signal?:AbortSignal):Promise<EditorialDocument|null>{
 try{const value=document(await operacion<EditorialDocument>(`publico/hotel/editorial/${language}`,'GET',undefined,signal),language);if(value.revision<1||value.revisionPublicada!==value.revision)throw new OperationError('La respuesta no corresponde a una versión publicada.',502);return value;}
 catch(error){if(error instanceof OperationError&&error.status===404&&(error.data as {codigo?:string})?.codigo==='CONTENIDO_NO_PUBLICADO')return null;throw error;}
}
