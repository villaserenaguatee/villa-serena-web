vi.mock('@/app/providers/AuthProvider',async()=>({AuthContext:(await import('react')).createContext({user:{id:'1',role:'admin',staff:{id:1}}})}));
import {render, screen, fireEvent, waitFor, within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach, expect, test, vi} from 'vitest';
import CatalogosAdmin from '@/features/admin/pages/CatalogosAdmin';
import {operacion, OperationError} from '@/lib/api/operaciones';
import {validatePersonal} from '@/features/admin/pages/personalValidation';
vi.mock('@/lib/api/operaciones', async original => ({...await original<typeof import('@/lib/api/operaciones')>(), operacion:vi.fn()}));
const call=vi.mocked(operacion);
const employee={id:51,version:3,nombre:'María O’Neill',correo:'staff@example.test',telefono:'+502 55555555',rol:'RECEPCION',area:null,estado:'ACTIVO',perfil:{salarioBase:3000,turno:'Mañana',historico:'conservar'}};
beforeEach(()=>{call.mockReset();call.mockImplementation(async(path,method)=>{if(path==='admin/empleados'&&method==='POST')return {empleado:{...employee,id:52},contrasenaTemporal:'isolated-response-only'};if(path==='admin/empleados')return [{...employee,nombreCompleto:employee.nombre}];if(['admin/empleados','admin/catalogos/personal'].includes(path))return [employee,{...employee,id:52,perfil:{}}];throw Error('Unexpected request: '+path);});});
async function openNew(){render(<CatalogosAdmin initial="personal"/>);const button=await screen.findByRole('button',{name:'+ Nuevo empleado'});await waitFor(()=>expect(button).toBeEnabled());await userEvent.click(button);return screen.getByRole('dialog');}
function field(dialog:HTMLElement,name:string){return dialog.querySelector<HTMLInputElement|HTMLSelectElement>(`[name="${name}"]`)!;}
function fill(dialog:HTMLElement){for(const [name,value] of Object.entries({nombre:'Ana Pérez',correo:'new@example.test',telefono:'55555555'}))fireEvent.change(field(dialog,name),{target:{value}});}
const posts=()=>call.mock.calls.filter(([,method])=>method==='POST');

test('Personal loads independently of room types; cancel never posts',async()=>{
 const dialog=await openNew();expect(call.mock.calls.every(([path])=>['admin/empleados','admin/catalogos/personal'].includes(path))).toBe(true);
 fill(dialog);await userEvent.click(within(dialog).getByRole('button',{name:'Cancelar'}));expect(screen.queryByRole('dialog')).toBeNull();expect(posts()).toHaveLength(0);
});
test('empty and whitespace fields show inline errors, retain input and focus the first invalid field',async()=>{
 const dialog=await openNew();fireEvent.change(field(dialog,'nombre'),{target:{value:'   '}});fireEvent.change(field(dialog,'correo'),{target:{value:'wrong@'}});fireEvent.change(field(dialog,'rol'),{target:{value:''}});
 await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));
 expect(field(dialog,'nombre')).toHaveValue('   ');expect(field(dialog,'nombre')).toHaveAttribute('aria-invalid','true');
 expect(field(dialog,'correo')).toHaveAccessibleDescription('Ingrese un correo electrónico válido');expect(field(dialog,'rol')).toHaveAttribute('aria-invalid','true');
 await waitFor(()=>expect(field(dialog,'nombre')).toHaveFocus());expect(posts()).toHaveLength(0);
});
test('area is conditional and required; switching away clears it in the current endpoint payload',async()=>{
 const dialog=await openNew();fill(dialog);expect(field(dialog,'area')).toBeNull();fireEvent.change(field(dialog,'rol'),{target:{value:'MANTENIMIENTO_LIMPIEZA'}});
 expect(field(dialog,'area')).toBeRequired();await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));expect(field(dialog,'area')).toHaveAttribute('aria-invalid','true');expect(posts()).toHaveLength(0);
 fireEvent.change(field(dialog,'area'),{target:{value:'LIMPIEZA'}});fireEvent.change(field(dialog,'rol'),{target:{value:'RECEPCION'}});expect(field(dialog,'area')).toBeNull();
 await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));await waitFor(()=>expect(posts()).toHaveLength(1));
 expect(posts()[0][0]).toBe('admin/empleados');expect(posts()[0][2]).toMatchObject({area:null,rol:'RECEPCION',correo:'new@example.test'});expect(posts()[0][2]).not.toHaveProperty('accesoInicial');
});
test('editing locks the email, preserves id/version and unknown labor data, and prevents duplicate submits',async()=>{
 render(<CatalogosAdmin initial="personal"/>);await userEvent.click(within((await screen.findByRole('button',{name:/^María O’Neill/})).parentElement!).getByRole('button',{name:'Editar empleado'}));const dialog=screen.getByRole('dialog');
 expect(field(dialog,'correo')).toHaveAttribute('readonly');fireEvent.change(field(dialog,'correo'),{target:{value:'altered@example.test'}});expect(field(dialog,'correo')).toHaveValue(employee.correo);
 expect(dialog.querySelector('[name="accesoInicial"]')).toBeNull();fireEvent.change(field(dialog,'nombre'),{target:{value:'María Pérez'}});
 let release!:(value:unknown)=>void;call.mockImplementation(async(path,method)=>method==='PATCH'?await new Promise(resolve=>{release=resolve;}):[employee]);
 fireEvent.submit(field(dialog,'nombre').closest('form')!);fireEvent.submit(field(dialog,'nombre').closest('form')!);await waitFor(()=>expect(call.mock.calls.filter(([,method])=>method==='PATCH')).toHaveLength(1));
 expect(call.mock.calls.find(([,method])=>method==='PATCH')?.[2]).toEqual({nombreCompleto:'María Pérez',telefono:employee.telefono,rol:employee.rol,area:employee.area});release({...employee,nombreCompleto:'María Pérez'});await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
});
test('backend field errors stay beside their fields without losing the form',async()=>{
 const dialog=await openNew();fill(dialog);call.mockRejectedValueOnce(new OperationError('Correo duplicado',409,{codigo:'CORREO_EXISTENTE'}));
 await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));await waitFor(()=>expect(field(dialog,'correo')).toHaveAccessibleDescription('El correo ya está asociado a otra cuenta.'));
 expect(field(dialog,'nombre')).toHaveValue('Ana Pérez');expect(screen.getByRole('dialog')).toBeVisible();
});
test('demo explicitly disables unavailable employee writes instead of pretending to save',async()=>{
 call.mockRejectedValue(new OperationError('Demo',501,{codigo:'SIMULACION_NO_DISPONIBLE'}));render(<CatalogosAdmin initial="personal"/>);
 expect(await screen.findByText(/Modo demostración/)).toBeVisible();expect(screen.getByRole('button',{name:'+ Nuevo empleado'})).toBeDisabled();expect(screen.queryByRole('dialog')).toBeNull();expect(posts()).toHaveLength(0);
});
test('validation preserves valid Unicode names and checks phone, enums, optional labor amounts and dates',()=>{
 const valid={...employee,id:undefined,accesoInicial:'fixture-password-123'};expect(validatePersonal(valid)).toEqual({});
 expect(validatePersonal({...valid,telefono:'letters',estado:'OTHER',perfil:{salarioBase:-1,fechaContratacion:'2026-02-30',turno:'   '}})).toMatchObject({telefono:expect.any(String),estado:expect.any(String),'perfil.salarioBase':expect.any(String),'perfil.fechaContratacion':expect.any(String),'perfil.turno':expect.any(String)});
});
