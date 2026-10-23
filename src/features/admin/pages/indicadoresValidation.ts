import type {components} from '@/lib/api/schema';
export type Indicadores=components['schemas']['Indicadores'];
export function occupancyPercentage(value:Indicadores):number{
 if(!value||typeof value!=='object')throw Error('No se pudieron comprobar los indicadores.');
 const occupied=value.ocupacionHoy?.habitacionesOcupadas,active=value.ocupacionHoy?.habitacionesActivas;
 if(!Number.isInteger(occupied)||!Number.isInteger(active)||occupied<0||active<0||occupied>active)throw Error('No se pudo comprobar la ocupación con las habitaciones activas.');
 return active===0?0:occupied/active*100;
}
export function reportRangeValid(start:string,end:string):boolean{
 const valid=(v:string)=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v+'T12:00:00Z').toISOString().slice(0,10)===v;
 return valid(start)&&valid(end)&&start<=end;
}
