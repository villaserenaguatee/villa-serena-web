import type {components} from '@/lib/api/schema';

export type EmployeeCreate = components['schemas']['CrearEmpleadoPeticion'];
export type EmployeeCreated = components['schemas']['EmpleadoCreado'];
export type EmployeePasswordReset = components['schemas']['ContrasenaRestablecida'];

// Official identity contract. Employment profiles keep their existing service.
export function officialEmployeeCreate(input:{nombre:string;correo:string;correoPersonal?:string|null;telefono:string;rol:EmployeeCreate['rol'];area?:EmployeeCreate['area']}):EmployeeCreate {
 if(!input.nombre.trim()||!input.correo.trim()||!input.telefono.trim())throw Error('Completa los datos del empleado.');
 if(!['ADMIN','RECEPCION','ROOM_SERVICE','MANTENIMIENTO_LIMPIEZA'].includes(input.rol))throw Error('Selecciona un rol válido.');
 if(input.rol==='MANTENIMIENTO_LIMPIEZA'&&!['LIMPIEZA','MANTENIMIENTO','AMBAS'].includes(input.area??''))throw Error('Selecciona el área del empleado.');
 const personal=input.correoPersonal?.trim();
 if(personal&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(personal)||personal.length>150))throw Error('Ingrese un correo personal válido');
 return {...(input.correoPersonal!==undefined?{correoPersonal:personal||null}:{}),nombreCompleto:input.nombre.trim(),correo:input.correo.trim(),telefono:input.telefono.trim(),rol:input.rol,area:input.rol==='MANTENIMIENTO_LIMPIEZA'?input.area:null};
}

export function temporaryPasswordFromResponse(value:unknown):string {
 if(!value||typeof value!=='object'||!('contrasenaTemporal' in value)||typeof value.contrasenaTemporal!=='string'||!value.contrasenaTemporal.trim())throw Error('El servidor no devolvió la contraseña temporal.');
 // Never trim, generate or derive a password from employee data.
 return value.contrasenaTemporal;
}
