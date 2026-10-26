import {operacion,OperationError} from '@/lib/api/operaciones';
import type {components} from '@/lib/api/schema';
import {officialEmployeeCreate, temporaryPasswordFromResponse, type EmployeeCreated} from './employeeContract';

type Employee = components['schemas']['EmpleadoAdmin'];
export type EmployeeRow = {id:number;version:number;[key:string]:unknown};
export async function loadEmployees(signal?:AbortSignal):Promise<EmployeeRow[]> {
 const [accountsResult,profilesResult]=await Promise.allSettled([
  operacion<Employee[]>('admin/empleados','GET',undefined,signal),
  operacion<EmployeeRow[]>('admin/catalogos/personal','GET',undefined,signal),
 ]);
 if(accountsResult.status==='rejected')throw accountsResult.reason;
 const accounts=accountsResult.value;
 if(!Array.isArray(accounts)||accounts.some(account=>!Number.isSafeInteger(account.id)||typeof account.nombreCompleto!=='string'))throw Error('El servicio devolvió una lista de empleados incompleta.');
 const profiles=profilesResult.status==='fulfilled'&&Array.isArray(profilesResult.value)?profilesResult.value:[];
 // A failed labor lookup must not hide the official identity or imply missing data.
 return accounts.map(account=>{const profile=profiles.find(profile=>Number(profile.id)===account.id);return {...profile,...account,nombre:account.nombreCompleto,version:profile?.version??0,laborDisponible:Boolean(profile),...(!profile?{avisoLaboral:'No se pudieron consultar los datos laborales de este empleado. Actualiza la lista para reintentar.'}:{})};});
}
export async function saveEmployee(draft:EmployeeRow|Record<string,unknown>,onCreated:(id:number,password:string)=>void,originalProfile?:unknown) {
 const identity=officialEmployeeCreate({nombre:String(draft.nombre??''),correo:String(draft.correo??''),correoPersonal:draft.correoPersonal==null?draft.correoPersonal as null|undefined:String(draft.correoPersonal),telefono:String(draft.telefono??''),rol:draft.rol as Employee['rol'],area:draft.area as Employee['area']});
 let id=Number(draft.id);
 if(!id){
  const result=await operacion<EmployeeCreated>('admin/empleados','POST',identity);
  id=result.empleado.id;
  onCreated(id,temporaryPasswordFromResponse(result));
  return;
 }else{
  const changes={...(identity.correoPersonal!==undefined?{correoPersonal:identity.correoPersonal}:{}),nombreCompleto:identity.nombreCompleto,telefono:identity.telefono,rol:identity.rol,area:identity.area};
  await operacion<Employee>(`admin/empleados/${id}`,'PATCH',changes);
 }
 if(draft.laborDisponible===false)return;
 // Keep employment data through the existing versioned service. Read the latest
 // identity after the official mutation, so a profile save cannot overwrite it.
 const profiles=await operacion<EmployeeRow[]>('admin/catalogos/personal');
 const latest=profiles.find(row=>row.id===id);
 if(!latest)throw Error('La cuenta se guardó, pero no pudimos consultar sus datos laborales. Actualiza la lista antes de continuar.');
 const profile=draft.perfil??{};
 if(JSON.stringify(profile)!==JSON.stringify(latest.perfil??{})){
  if(draft.id&&JSON.stringify(originalProfile??{})!==JSON.stringify(latest.perfil??{}))throw new OperationError('La cuenta se actualizó, pero los datos laborales cambiaron en otra sesión. Actualiza la lista antes de guardar esos datos.',409);
  await operacion('admin/catalogos/personal','POST',{clave:crypto.randomUUID(),id,version:latest.version,datos:{...latest,perfil:profile}});
 }
 if(draft.estado!==latest.estado && draft.id){
  await operacion<Employee>(`admin/empleados/${id}/estado`,'PATCH',{estado:draft.estado});
 }
}
export async function resetEmployeePassword(id:number) {
 return temporaryPasswordFromResponse(await operacion(`admin/empleados/${id}/restablecer-contrasena`,'POST'));
}

export async function changeEmployeeState(id:number,estado:'ACTIVO'|'INACTIVO'):Promise<Employee>{
 if(!Number.isSafeInteger(id)||id<=0||!['ACTIVO','INACTIVO'].includes(estado))throw Error('No se pudo identificar al empleado o su estado.');
 const saved=await operacion<Employee>(`admin/empleados/${id}/estado`,'PATCH',{estado});
 if(saved?.id!==id||saved.estado!==estado||typeof saved.nombreCompleto!=='string')throw Error('No se pudo confirmar el estado. Actualiza la lista antes de volver a intentarlo.');
 return saved;
}

// Inline editing uses only the fields and mutations in the official contract.
export async function updateEmployeeSection(original:Record<string,unknown>,draft:Record<string,unknown>,section:'personal'|'laboral',lockIdentity:boolean):Promise<EmployeeRow>{
 const id=Number(original.id);if(!Number.isSafeInteger(id)||id<=0)throw Error('No se pudo identificar al empleado.');
 const changes:components['schemas']['EditarEmpleadoPeticion']=section==='personal'?{...(draft.correoPersonal!==undefined?{correoPersonal:String(draft.correoPersonal??'').trim()||null}:{}),nombreCompleto:String(draft.nombre).trim(),telefono:String(draft.telefono).trim()}:lockIdentity?{}:{rol:draft.rol as Employee['rol'],area:draft.rol==='MANTENIMIENTO_LIMPIEZA'?draft.area as Employee['area']:null};
 let result={...original} as EmployeeRow;
 if(Object.keys(changes).length){const saved=await operacion<Employee>(`admin/empleados/${id}`,'PATCH',changes);if(saved?.id!==id||typeof saved.nombreCompleto!=='string')throw Error('El servicio no confirmó los datos guardados. Consulta nuevamente el empleado.');result={...result,...saved,nombre:saved.nombreCompleto};}
 return result;
}
