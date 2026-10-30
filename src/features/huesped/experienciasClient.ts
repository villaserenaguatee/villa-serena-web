import type {components} from '@/lib/api/schema';
import {operacion,OperationError} from '@/lib/api/operaciones';
type S=components['schemas'];
export type Experience=S['Experiencia'];export type ExperienceSlot=S['HorarioExperiencia'];export type ExperienceBooking=S['ReservaExperiencia'];export type ExperienceInquiry=S['ConsultaExperiencia'];
export const experienceRoot=(code:string)=>`app/reservas/${encodeURIComponent(code)}/experiencias`;
export const experienceCall=operacion;
export const experienceDate=(value:string,en=false)=>new Date(value).toLocaleString(en?'en-US':'es-GT',{timeZone:'America/Guatemala',dateStyle:'medium',timeStyle:'short'});
export const experienceDay=(value:string)=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Guatemala',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
export const experienceMoney=(value:number)=>new Intl.NumberFormat('es-GT',{style:'currency',currency:'GTQ'}).format(value);
export function experienceTotal(e:Experience,people:number){return e.precio*(e.tarifa==='POR_PERSONA'?people:1);}
export function experienceLabel(state:string,en:boolean){return en?({PENDIENTE:'Pending',CONFIRMADA:'Confirmed',RECHAZADA:'Rejected',CANCELADA:'Cancelled',ABIERTA:'Open',RESPONDIDA:'Answered'} as Record<string,string>)[state]??state:({PENDIENTE:'Pendiente',CONFIRMADA:'Confirmada',RECHAZADA:'Rechazada',CANCELADA:'Cancelada',ABIERTA:'Abierta',RESPONDIDA:'Respondida'} as Record<string,string>)[state]??state;}
type Attempt={key:string;experienceId:number;horarioId:number;personas:number};
const attemptKey=(code:string)=>'vs-experience-attempt-'+code;
export function pendingExperience(code:string):Attempt|undefined{try{const value=JSON.parse(sessionStorage.getItem(attemptKey(code))??'null');return value&&typeof value.key==='string'&&Number.isSafeInteger(value.experienceId)&&Number.isSafeInteger(value.horarioId)&&Number.isSafeInteger(value.personas)?value:undefined;}catch{return undefined;}}
export async function reserveExperience(code:string,experienceId:number,horarioId:number,personas:number){
 const old=pendingExperience(code);if(old&&(old.horarioId!==horarioId||old.personas!==personas||old.experienceId!==experienceId))throw new Error('Primero consulte el resultado de su solicitud pendiente. / Please check your pending request first.');
 const attempt=old??{key:crypto.randomUUID(),experienceId,horarioId,personas};sessionStorage.setItem(attemptKey(code),JSON.stringify(attempt));
 try{const result=await operacion<ExperienceBooking>(experienceRoot(code)+'/reservas','POST',{clave:attempt.key,horarioId,personas});sessionStorage.removeItem(attemptKey(code));return result;}catch(error){if(error instanceof OperationError&&error.status<500)sessionStorage.removeItem(attemptKey(code));throw error;}
}
