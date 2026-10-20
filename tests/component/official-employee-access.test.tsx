import {render,screen,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,test,expect,vi} from 'vitest';
import CatalogosAdmin from '@/features/admin/pages/CatalogosAdmin';
import {operacion,OperationError} from '@/lib/api/operaciones';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
const call=vi.mocked(operacion);
const employee={id:7,version:1,nombre:'Empleado aislado',nombreCompleto:'Empleado aislado',correo:'isolated@example.test',telefono:'55550000',rol:'RECEPCION',area:null,estado:'ACTIVO',perfil:{}};
beforeEach(()=>{call.mockReset();call.mockImplementation(async(path,method)=>method==='POST'?{contrasenaTemporal:'isolated-server-response'}:[employee]);});
test('administrative reset requires confirmation, calls server once and discards its one-time password',async()=>{
 vi.spyOn(window,'confirm').mockReturnValue(true);render(<CatalogosAdmin initial="personal" resources={['personal']}/>);
 await userEvent.click(await screen.findByRole('button',{name:/Empleado aislado/}));
 await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));
 expect(await screen.findByLabelText('Contraseña temporal',{selector:'input'})).toHaveValue('isolated-server-response');
 expect(call.mock.calls.filter(([,method])=>method==='POST')).toEqual([['admin/empleados/7/restablecer-contrasena','POST']]);
 await userEvent.click(screen.getByRole('button',{name:/^Cerrar$/}));expect(screen.queryByLabelText('Contraseña temporal',{selector:'input'})).toBeNull();
 expect(localStorage.length).toBe(0);expect(sessionStorage.length).toBe(0);
});
test('cancelled reset never calls server',async()=>{
 vi.spyOn(window,'confirm').mockReturnValue(false);render(<CatalogosAdmin initial="personal" resources={['personal']}/>);await userEvent.click(await screen.findByRole('button',{name:/Empleado aislado/}));await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));expect(call.mock.calls.some(([,method])=>method==='POST')).toBe(false);
});
test('uncertain account creation requires list review instead of repeating a POST',async()=>{
 render(<CatalogosAdmin initial="personal" resources={['personal']}/>);const add=await screen.findByRole('button',{name:'Nuevo registro'});await waitFor(()=>expect(add).toBeEnabled());await userEvent.click(add);const dialog=screen.getByRole('dialog');
 for(const [key,value] of Object.entries({nombre:'Empleado aislado',correo:'isolated@example.test',telefono:'55550000'}))fireEvent.change(dialog.querySelector(`[name=${key}]`)!,{target:{value}});
 call.mockRejectedValueOnce(new OperationError('No se pudo contactar al servidor.',502));fireEvent.submit(dialog);fireEvent.submit(dialog);await screen.findByRole('alert');expect(add).toBeDisabled();expect(call.mock.calls.filter(([,method])=>method==='POST')).toHaveLength(1);
});
