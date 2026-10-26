vi.mock('@/app/providers/AuthProvider',async()=>({AuthContext:(await import('react')).createContext({user:{id:'1',role:'admin',staff:{id:1}}})}));
import {render,screen,within,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,test,vi} from 'vitest';
import CatalogosAdmin from '@/features/admin/pages/CatalogosAdmin';
import {operacion,OperationError} from '@/lib/api/operaciones';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
const call=vi.mocked(operacion);
const employee={id:7,version:1,nombre:'Empleado de prueba',nombreCompleto:'Empleado de prueba',correo:'laboral@example.invalid',correoPersonal:'personal@example.invalid',telefono:'55551234',rol:'RECEPCION',area:null,estado:'ACTIVO',perfil:{turno:'Mañana',salarioBase:2500}};
beforeEach(()=>{call.mockReset().mockImplementation(async(path,method)=>method==='PATCH'?employee:[employee]);});
async function edit(){render(<CatalogosAdmin initial="personal" resources={['personal']}/>);await userEvent.click(await screen.findByRole('button',{name:'Editar empleado'}));}
test('tabs retain personal and employment values; cancellation discards edits without writes',async()=>{
 await edit();expect(screen.getByRole('dialog')).toHaveTextContent('Empleado de prueba');expect(screen.getByLabelText('Correo laboral')).toHaveAttribute('readonly');
 await userEvent.clear(screen.getByLabelText('Nombre completo'));await userEvent.type(screen.getByLabelText('Nombre completo'),'Cambio local');
 await userEvent.click(screen.getByRole('tab',{name:'Datos laborales'}));fireEvent.change(screen.getByLabelText('Bonos (Q)'),{target:{value:'50'}});
 await userEvent.click(screen.getByRole('tab',{name:'Seguridad'}));expect(screen.getByRole('tabpanel')).toHaveTextContent(employee.correo);
 await userEvent.click(screen.getByRole('tab',{name:'Datos personales'}));expect(screen.getByLabelText('Nombre completo')).toHaveValue('Cambio local');
 await userEvent.click(screen.getByRole('tab',{name:'Datos laborales'}));expect(screen.getByLabelText('Bonos (Q)')).toHaveValue(50);
 await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(call.mock.calls.every(([,method])=>method===undefined||method==='GET')).toBe(true);
 await userEvent.click(screen.getByRole('button',{name:'Editar empleado'}));expect(screen.getByLabelText('Nombre completo')).toHaveValue(employee.nombre);
});
test('validation reveals the tab containing invalid employment data',async()=>{
 await edit();await userEvent.click(screen.getByRole('tab',{name:'Datos laborales'}));fireEvent.change(screen.getByLabelText('Salario base (Q)'),{target:{value:'-1'}});
 await userEvent.click(screen.getByRole('tab',{name:'Seguridad'}));await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));
 expect(screen.getByRole('tab',{name:'Datos laborales'})).toHaveAttribute('aria-selected','true');expect(screen.getByLabelText('Salario base (Q)')).toHaveAttribute('aria-invalid','true');expect(call.mock.calls.some(([,method])=>method==='PATCH')).toBe(false);
});
test('save preserves login email and sends employment changes through the existing versioned service',async()=>{
 await edit();fireEvent.change(screen.getByLabelText('Correo personal'),{target:{value:'nuevo@example.invalid'}});await userEvent.click(screen.getByRole('tab',{name:'Datos laborales'}));fireEvent.change(screen.getByLabelText('Bonos (Q)'),{target:{value:'50'}});
 await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 const patch=call.mock.calls.find(([,method])=>method==='PATCH');expect(patch?.[0]).toBe('admin/empleados/7');expect(patch?.[2]).toMatchObject({correoPersonal:'nuevo@example.invalid'});expect(patch?.[2]).not.toHaveProperty('correo');
 expect(call.mock.calls.find(([path,method])=>path==='admin/catalogos/personal'&&method==='POST')?.[2]).toMatchObject({id:7,version:1,datos:{perfil:{turno:'Mañana',salarioBase:2500,bonosExtras:50}}});
});
test('reset confirmation locks duplicate requests and reports failure without discarding the form',async()=>{
 const native=vi.spyOn(window,'confirm');await edit();await userEvent.click(screen.getByRole('tab',{name:'Seguridad'}));await userEvent.click(screen.getByRole('button',{name:'Restablecer contraseña'}));
 let reject!:(reason:unknown)=>void;call.mockImplementation(async(path,method)=>method==='POST'?new Promise((_resolve,no)=>{reject=no;}):[employee]);
 const confirmation=screen.getByRole('dialog',{name:'Restablecer contraseña'});await userEvent.dblClick(within(confirmation).getByRole('button',{name:'Restablecer contraseña'}));expect(call.mock.calls.filter(([,method])=>method==='POST')).toHaveLength(1);expect(within(confirmation).getByRole('button',{name:'Restableciendo…'})).toBeDisabled();
 reject(new OperationError('Operación no disponible',503));expect(await within(confirmation).findByRole('alert')).toHaveTextContent('Operación no disponible');await userEvent.click(within(confirmation).getByRole('button',{name:'Cancelar'}));expect(screen.getByRole('dialog',{name:'Editar empleado'})).toBeVisible();expect(screen.getByRole('tab',{name:'Seguridad'})).toHaveAttribute('aria-selected','true');expect(native).not.toHaveBeenCalled();
});
