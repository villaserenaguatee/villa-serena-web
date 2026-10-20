import {expect,test} from 'vitest';
import {officialEmployeeCreate,temporaryPasswordFromResponse} from '../../src/features/admin/pages/employeeContract';
test('official creation sends contract fields only, never a client supplied password',()=>{
 const draft={nombre:' Ana Pérez ',correo:'staff@example.test',telefono:'55555555',rol:'RECEPCION' as const,area:'LIMPIEZA' as const,accesoInicial:'fictional-test-only',perfil:{salarioBase:100}};
 expect(officialEmployeeCreate(draft)).toEqual({nombreCompleto:'Ana Pérez',correo:'staff@example.test',telefono:'55555555',rol:'RECEPCION',area:null});
});
test('maintenance and cleaning require a valid assigned area',()=>expect(()=>officialEmployeeCreate({nombre:'Employee',correo:'staff@example.test',telefono:'55555555',rol:'MANTENIMIENTO_LIMPIEZA'})).toThrow('área'));
test('a password must come from the response and is never changed or invented',()=>{expect(temporaryPasswordFromResponse({contrasenaTemporal:' original '})).toBe(' original ');expect(()=>temporaryPasswordFromResponse({id:1})).toThrow();});
