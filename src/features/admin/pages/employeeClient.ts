import {operacion,OperationError} from '@/lib/api/operaciones';
import type {components} from '@/lib/api/schema';
import {officialEmployeeCreate, temporaryPasswordFromResponse, type EmployeeCreated} from './employeeContract';

type Employee = components['schemas']['EmpleadoAdmin'];
export type EmployeeRow = {id:number;version:number;[key:string]:unknown};
export async function loadEmployees(signal?:AbortSignal):Promise<EmployeeRow[]> {
 const [accounts,profiles]=await Promise.all([
  operacion<Employee[]>('admin/empleados','GET',undefined,signal),
  operacion<EmployeeRow[]>('admin/catalogos/personal','GET',undefined,signal),
 ]);
 // Identity always comes from the official endpoint; never create separate employees.
 return accounts.map(account=>({...profiles.find(profile=>profile.id===account.id),...account,nombre:account.nombreCompleto,version:profiles.find(profile=>profile.id===account.id)?.version??0}));
}
export async function saveEmployee(draft:EmployeeRow|Record<string,unknown>,onCreated:(id:number,password:string)=>void,originalProfile?:unknown) {
 const identity=officialEmployeeCreate({nombre:String(draft.nombre??''),correo:String(draft.correo??''),telefono:String(draft.telefono??''),rol:draft.rol as Employee['rol'],area:draft.area as Employee['area']});
 let id=Number(draft.id);
 if(!id){
  const result=await operacion<EmployeeCreated>('admin/empleados','POST',identity);
  id=result.empleado.id;
  onCreated(id,temporaryPasswordFromResponse(result));
 }else{
  const changes={nombreCompleto:identity.nombreCompleto,telefono:identity.telefono,rol:identity.rol,area:identity.area};
  await operacion<Employee>(`admin/empleados/${id}`,'PATCH',changes);
 }
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
