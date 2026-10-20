import {OperationError} from '@/lib/api/operaciones';
export const ADMIN_DEMO_UNAVAILABLE='Modo demostración: esta operación no está disponible. Para consultar o guardar estos datos se necesita conexión al servicio real.';
export function isAdminDemoUnavailable(error:unknown){
 return error instanceof OperationError && error.status===501 && (error.data as {codigo?:string}|undefined)?.codigo==='SIMULACION_NO_DISPONIBLE';
}
