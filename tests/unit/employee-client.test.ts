import {beforeEach,expect,test,vi} from 'vitest';
import {operacion} from '@/lib/api/operaciones';
import {loadEmployees,resetEmployeePassword,saveEmployee} from '@/features/admin/pages/employeeClient';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
const call=vi.mocked(operacion);
const account={id:7,nombreCompleto:'Empleado aislado',correo:'isolated@example.test',telefono:'55550000',rol:'RECEPCION',area:null,estado:'ACTIVO'};
const profile={id:7,version:4,nombre:account.nombreCompleto,correo:account.correo,telefono:account.telefono,rol:account.rol,area:null,estado:'ACTIVO',perfil:{historico:'conservar',salarioBase:3000}};
beforeEach(()=>{call.mockReset();});
test('official identity wins while existing unknown employment fields are preserved',async()=>{
 call.mockImplementation(async path=>path==='admin/empleados'?[account]:[{...profile,nombre:'Old name'}]);
 expect(await loadEmployees()).toEqual([{...profile,...account,nombre:account.nombreCompleto}]);
});
test('creation never sends client passwords or labor data in the official payload',async()=>{
 call.mockImplementation(async(path,method)=>method==='POST'&&path==='admin/empleados'?{empleado:account,contrasenaTemporal:'isolated-server-response'}:[{...profile,perfil:{}}]);
 const show=vi.fn();await saveEmployee({...profile,id:undefined,perfil:{},accesoInicial:'must-not-send'},show);
 expect(call.mock.calls[0]).toEqual(['admin/empleados','POST',{nombreCompleto:account.nombreCompleto,correo:account.correo,telefono:account.telefono,rol:account.rol,area:null}]);
 expect(show).toHaveBeenCalledExactlyOnceWith(7,'isolated-server-response');expect(call.mock.calls.filter(([,method])=>method==='POST')).toHaveLength(1);
});
test('profile updates preserve current identity/version and unknown employment history',async()=>{
 const current={...profile,nombre:'Changed concurrently',version:9};call.mockImplementation(async(path,method)=>method==='GET'||method===undefined?[current]:account);
 await saveEmployee({...profile,perfil:{...profile.perfil,salarioBase:3500}},vi.fn(),profile.perfil);
 const request=call.mock.calls.find(([path,method])=>path==='admin/catalogos/personal'&&method==='POST')!;
 expect(request[2]).toMatchObject({id:7,version:9,datos:{nombre:'Changed concurrently',perfil:{historico:'conservar',salarioBase:3500}}});
 expect(call.mock.calls[0][2]).not.toHaveProperty('correo');
});
test('reset uses only the official endpoint and no browser-generated secret',async()=>{
 call.mockResolvedValue({contrasenaTemporal:'isolated-new-response'});expect(await resetEmployeePassword(7)).toBe('isolated-new-response');expect(call).toHaveBeenCalledExactlyOnceWith('admin/empleados/7/restablecer-contrasena','POST');
});
test('failed creation is never repeated or followed by profile writes',async()=>{
 call.mockRejectedValue(new Error('Connection interrupted'));const show=vi.fn();await expect(saveEmployee({...profile,id:undefined},show)).rejects.toThrow('Connection interrupted');expect(call).toHaveBeenCalledTimes(1);expect(show).not.toHaveBeenCalled();
});
test('concurrent labor edits are never overwritten by a stale form',async()=>{
 call.mockImplementation(async(path,method)=>method==='GET'||method===undefined?[{...profile,perfil:{...profile.perfil,salarioBase:4000}}]:account);
 await expect(saveEmployee({...profile,perfil:{...profile.perfil,salarioBase:3500}},vi.fn(),profile.perfil)).rejects.toThrow('otra sesión');
 expect(call.mock.calls.some(([path,method])=>path==='admin/catalogos/personal'&&method==='POST')).toBe(false);
});
