vi.mock('@/app/providers/AuthProvider',async()=>({AuthContext:(await import('react')).createContext({user:{id:'1',role:'admin',staff:{id:1}}})}));
import {within} from '@testing-library/react';
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
render(<CatalogosAdmin initial="personal" resources={['personal']}/>);
 await userEvent.click(within((await screen.findByRole('button',{name:/^Empleado aislado/})).closest('tr')!).getByRole('button',{name:'Editar empleado'}));
 await userEvent.click(screen.getByRole('tab',{name:'Seguridad'}));
 await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));
 expect(screen.getByRole('dialog',{name:'Restablecer contraseña'})).toHaveTextContent('¿Deseas restablecer la contraseña de Empleado aislado?');
 await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));
 expect(await screen.findByLabelText('Contraseña temporal',{selector:'input'})).toHaveValue('isolated-server-response');
 expect(call.mock.calls.filter(([,method])=>method==='POST')).toEqual([['admin/empleados/7/restablecer-contrasena','POST']]);
 await userEvent.click(screen.getByRole('button',{name:/^Cerrar$/}));expect(screen.queryByLabelText('Contraseña temporal',{selector:'input'})).toBeNull();
 expect(localStorage.length).toBe(0);expect(sessionStorage.length).toBe(0);
});
test('cancelled reset never calls server',async()=>{
render(<CatalogosAdmin initial="personal" resources={['personal']}/>);await userEvent.click(within((await screen.findByRole('button',{name:/^Empleado aislado/})).closest('tr')!).getByRole('button',{name:'Editar empleado'}));await userEvent.click(screen.getByRole('tab',{name:'Seguridad'}));await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));await userEvent.click(within(screen.getByRole('dialog',{name:'Restablecer contraseña'})).getByRole('button',{name:'Cancelar'}));expect(call.mock.calls.some(([,method])=>method==='POST')).toBe(false);
});
test('uncertain account creation requires list review instead of repeating a POST',async()=>{
 render(<CatalogosAdmin initial="personal" resources={['personal']}/>);const add=await screen.findByRole('button',{name:'+ Nuevo empleado'});await waitFor(()=>expect(add).toBeEnabled());await userEvent.click(add);const dialog=screen.getByRole('dialog');
 for(const [key,value] of Object.entries({nombre:'Empleado aislado',correo:'isolated@example.test',telefono:'55550000'}))fireEvent.change(dialog.querySelector(`[name=${key}]`)!,{target:{value}});
 call.mockRejectedValueOnce(new OperationError('No se pudo contactar al servidor.',502));fireEvent.submit(dialog);fireEvent.submit(dialog);await within(dialog).findByRole('alert');expect(dialog).toBeVisible();expect(within(dialog).getByRole('button',{name:'Guardar'})).toBeDisabled();expect(add).toBeDisabled();expect(call.mock.calls.filter(([,method])=>method==='POST')).toHaveLength(1);
});

test('name opens readonly information while the table edit button opens the full existing form',async()=>{render(<CatalogosAdmin initial="personal" resources={['personal']}/>);await userEvent.click(await screen.findByRole('button',{name:/^Empleado aislado/}));expect(screen.getByRole('dialog')).toHaveTextContent('Información del empleado');expect(screen.queryByRole('textbox')).toBeNull();expect(screen.queryByRole('button',{name:'Editar'})).toBeNull();await userEvent.click(screen.getByRole('button',{name:'Cerrar información del empleado'}));await userEvent.click(screen.getByRole('button',{name:'Editar empleado'}));expect(screen.getByLabelText('Nombre completo')).toHaveValue(employee.nombre);expect(screen.getByLabelText('Correo laboral')).toHaveAttribute('readonly');await userEvent.click(screen.getByRole('tab',{name:'Datos laborales'}));expect(screen.getByLabelText('Salario base (Q)')).toBeVisible();expect(screen.getByLabelText('Fecha de contratación')).toBeVisible();expect(screen.getByRole('button',{name:'Guardar cambios'})).toBeVisible();await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(call.mock.calls.some(([,method])=>method==='POST'||method==='PATCH')).toBe(false);});
