import {OperationError} from '@/lib/api/operaciones';

export function adminServiceError(error:unknown):string {
  if(error instanceof OperationError){
    const code=(error.data as {codigo?:string}|null)?.codigo;
    if(error.status===401)return 'La sesión no es válida o venció. Inicia sesión nuevamente.';
    if(error.status===403)return 'Tu cuenta no tiene permiso para consultar o modificar esta configuración.';
    if(error.status===404&&(code==='HOTEL_NO_CONFIGURADO'||error.message==='HOTEL_NO_CONFIGURADO'))return 'El API informa HOTEL_NO_CONFIGURADO. El equipo responsable debe verificar la configuración inicial existente; este formulario no crea ni reemplaza esos datos.';
    if(error.status===404)return 'La operación o configuración solicitada no está disponible en el API. No se han creado datos.';
    if(error.status===502||error.status===504)return 'No se pudo contactar al servicio. Puedes volver a consultar sin modificar datos.';
    if(error.status>=500)return 'El servidor no pudo completar la operación. Conservamos los datos del formulario.';
  }
  return error instanceof Error?error.message:'No se pudo completar la operación.';
}

// Only use a URL actually returned by the public contract, never manufacture a storage URL.
export function photoUrlForKey(key:string,urls:string[]):string|undefined {
  return urls.find(url=>{try{const parsed=new URL(url);return ['http:','https:'].includes(parsed.protocol)&&decodeURIComponent(parsed.pathname).endsWith('/'+key.replace(/^\//,''));}catch{return false;}});
}
