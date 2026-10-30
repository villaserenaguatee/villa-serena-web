import {render,screen,within,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,test,vi} from 'vitest';
import MenuAdmin from '@/features/admin/pages/MenuAdmin';
import {operacion,OperationError} from '@/lib/api/operaciones';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/components/common/PublicLanguageToggle',()=>({usePublicLanguage:()=>({en:false})}));
const call=vi.mocked(operacion);
const category={id:3,nombre:'Bebidas'};
const item={id:8,nombre:'Café existente',descripcion:'Café del catálogo',categoriaId:3,precio:20,fotoClave:null,estado:'ACTIVO',disponibilidad:'DISPONIBLE'};
beforeEach(()=>{call.mockReset();});
const writes=()=>call.mock.calls.filter(([,method])=>method&&method!=='GET');
test('empty official categories explain the disabled action and open the real category form; refreshed categories enable products',async()=>{
 let registered=false;call.mockImplementation(async(path,method,body)=>{
  if(path==='admin/menu/categorias'&&method==='POST'){expect(body).toEqual({nombre:'Bebidas'});registered=true;return category;}
  if(path==='admin/menu/categorias')return registered?[category]:[];
  if(path==='admin/menu/items')return [];
  throw Error('Unexpected request');
 });
 render(<MenuAdmin/>);const newProduct=screen.getByRole('button',{name:'Nuevo producto'});await screen.findByText('Para crear un producto, primero registra una categoría del menú.');
 expect(newProduct).toBeDisabled();expect(newProduct).toHaveAccessibleDescription(/primero registra una categoría/);expect(writes()).toHaveLength(0);
 await userEvent.click(screen.getByRole('button',{name:'Crear categoría'}));const form=screen.getByRole('dialog',{name:'Nueva categoría'});expect(within(form).getByLabelText('Nombre')).toHaveAttribute('placeholder','Ej. Bebidas');fireEvent.change(within(form).getByLabelText('Nombre'),{target:{value:'Bebidas'}});await userEvent.click(within(form).getByRole('button',{name:'Guardar'}));
 await waitFor(()=>expect(newProduct).toBeEnabled());expect(screen.queryByText(/primero registra una categoría/)).toBeNull();await userEvent.click(newProduct);
 expect(within(screen.getByRole('dialog')).getByRole('option',{name:'Bebidas'})).toHaveValue('3');expect(writes()).toHaveLength(1);
});
for(const status of [401,403,404,500])test('read failure '+status+' is not mistaken for an empty category list or permission to create',async()=>{
 call.mockRejectedValue(new OperationError('No se pudo consultar el menú',status));render(<MenuAdmin/>);await screen.findByRole('alert');
 expect(screen.getByRole('button',{name:'Nuevo producto'})).toBeDisabled();expect(screen.queryByRole('button',{name:'Crear categoría'})).toBeNull();await userEvent.click(screen.getByRole('tab',{name:'Categorías'}));expect(screen.getByRole('button',{name:'Nueva categoría'})).toBeDisabled();expect(writes()).toHaveLength(0);
});
test('pending reads retain loading protection even when category lookup has already completed',async()=>{
 call.mockImplementation(async path=>path==='admin/menu/categorias'?[category]:new Promise(()=>{}));render(<MenuAdmin/>);
 expect(screen.getByRole('button',{name:'Nuevo producto'})).toBeDisabled();expect(screen.queryByRole('button',{name:'Crear categoría'})).toBeNull();expect(writes()).toHaveLength(0);
});
test('a rejected save preserves entered fields without permanently blocking another attempt after cancel',async()=>{
 call.mockImplementation(async(path,method)=>method==='POST'?Promise.reject(new OperationError('Nombre duplicado',409)):path==='admin/menu/categorias'?[category]:[item]);render(<MenuAdmin/>);
 const newProduct=screen.getByRole('button',{name:'Nuevo producto'});await waitFor(()=>expect(newProduct).toBeEnabled());await userEvent.click(newProduct);const form=screen.getByRole('dialog');
 for(const [label,value] of [['Nombre','Otro café'],['Categoría','3'],['Precio (Q)','25'],['Descripción','Café preparado']])fireEvent.change(within(form).getByLabelText(label),{target:{value}});
 expect(within(form).queryByText(/El producto se crea activo y disponible/)).toBeNull();await userEvent.click(within(form).getByRole('button',{name:'Guardar'}));expect(await within(form).findByRole('alert')).toHaveTextContent('Nombre duplicado');expect(within(form).getByLabelText('Nombre')).toHaveValue('Otro café');
 await userEvent.click(within(form).getByRole('button',{name:'Cancelar'}));expect(newProduct).toBeEnabled();expect(screen.getByText(/Café existente ·/)).toBeVisible();expect(writes()).toHaveLength(1);
 await userEvent.click(newProduct);expect(screen.getByRole('dialog')).toBeVisible();expect(writes()[0][2]).not.toHaveProperty('disponibilidad');expect(writes()[0][2]).not.toHaveProperty('estado');
});
