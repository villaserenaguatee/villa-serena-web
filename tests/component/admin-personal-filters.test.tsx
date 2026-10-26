import {render,screen,fireEvent,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import CatalogosAdmin from '@/features/admin/pages/CatalogosAdmin';
import {AuthContext} from '@/app/providers/AuthProvider';
import {sessionUser,type Employee} from '@/lib/auth/staff-contract';
import type {components} from '@/lib/api/schema';

type Account=components['schemas']['EmpleadoAdmin'];
const admin:Employee={id:41,nombre:'Administradora actual',correo:'sesion@example.invalid',rol:'ADMIN',area:null,debeCambiarContrasena:false};
const account=(id:number,nombreCompleto:string,rol:Account['rol'],estado:Account['estado']='ACTIVO',area:Account['area']=null):Account=>({id,nombreCompleto,correo:`empleado${id}@example.invalid`,telefono:'55551234',rol,estado,area});
const fetcher=vi.fn<typeof fetch>();
let records:Account[];
beforeEach(()=>{
  records=[account(41,'Administradora actual','ADMIN'),account(42,'Otra administradora','ADMIN'),account(51,'Ana Recepción','RECEPCION'),account(52,'Bruno Recepción','RECEPCION','INACTIVO'),account(61,'Carla Limpieza','MANTENIMIENTO_LIMPIEZA','ACTIVO','LIMPIEZA'),account(71,'Diego Room Service','ROOM_SERVICE')];
  fetcher.mockReset().mockImplementation(async(input,init)=>{
    const path=String(input),method=init?.method??'GET';
    if(method==='GET'&&path==='/api/admin/empleados')return Response.json(records);
    if(method==='GET'&&path==='/api/admin/catalogos/personal')return Response.json(records.map(r=>({...r,nombre:'Nombre anterior',version:3,perfil:{historico:'conservar'}})));
    if(method==='PATCH'){const record=records.find(r=>path.includes('/'+r.id));Object.assign(record!,JSON.parse(String(init?.body)));return Response.json(record);}
    throw Error('Unexpected request: '+method+' '+path);
  });
  vi.stubGlobal('fetch',fetcher);
});
afterEach(()=>vi.unstubAllGlobals());
function show(employee:Employee|null=admin){
  const user=employee?sessionUser(employee):null;
  return render(<AuthContext.Provider value={{user,loading:false,login:vi.fn(),logout:vi.fn()}}><CatalogosAdmin initial="personal" resources={['personal']}/></AuthContext.Provider>);
}
const filters=()=>({search:screen.getByRole('searchbox',{name:'Buscar por nombre o correo'}),role:screen.getByRole('combobox',{name:'Filtrar por Área'}),state:screen.getByRole('combobox',{name:'Filtrar por estado'})});

test('connected employees use a semantic table and indicators derive from the complete API list',async()=>{
 show();await screen.findByText('6 de 6 empleados');
 const table=screen.getByRole('table',{name:'Empleados registrados'});
 expect(within(table).getAllByRole('columnheader').map(cell=>cell.textContent)).toEqual(['Nombre','Correo','Área','Especialidad','Estado','Acciones']);
 expect(within(table).getAllByRole('row')).toHaveLength(7);
 const metrics=screen.getByRole('region',{name:'Indicadores de personal'});
 for(const [name,count] of [['Empleados','6'],['Activos','5'],['Inactivos','1'],['Áreas de acceso','4']])expect(within(metrics).getByRole('heading',{name}).nextElementSibling).toHaveTextContent(count);
 fireEvent.change(filters().search,{target:{value:'Ana'}});
 expect(within(table).getAllByRole('row')).toHaveLength(2);
 expect(within(metrics).getByRole('heading',{name:'Empleados'}).nextElementSibling).toHaveTextContent('6');
});

test('state control uses only the official endpoint, preserves filters and protects own account',async()=>{
 show();await screen.findByText('6 de 6 empleados');expect(screen.getByRole('button',{name:'Desactivar empleado: Administradora actual'})).toBeDisabled();
 fireEvent.change(filters().search,{target:{value:'Ana'}});fireEvent.change(filters().role,{target:{value:'RECEPCION'}});await userEvent.click(screen.getByRole('button',{name:'Desactivar empleado: Ana Recepción'}));
 expect(screen.getByRole('dialog',{name:'Desactivar empleado'})).toBeVisible();await userEvent.click(screen.getByRole('button',{name:'Desactivar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(screen.getByRole('button',{name:'Activar empleado: Ana Recepción'})).toHaveTextContent('INACTIVO');expect(filters().search).toHaveValue('Ana');expect(filters().role).toHaveValue('RECEPCION');
 const writes=fetcher.mock.calls.filter(([,init])=>init?.method!=='GET');expect(writes.map(([path,init])=>[path,init?.method,JSON.parse(String(init?.body))])).toEqual([['/api/admin/empleados/51/estado','PATCH',{estado:'INACTIVO'}]]);
 await userEvent.click(screen.getByRole('button',{name:/^Ana Recepción/}));await userEvent.click(screen.getByRole('button',{name:'Información laboral'}));expect(within(screen.getByRole('dialog')).getByText('Estado').nextElementSibling).toHaveTextContent('INACTIVO');expect(within(screen.getByRole('dialog')).queryByRole('button',{name:'Editar'})).toBeNull();expect(screen.queryByRole('combobox',{name:'Estado'})).toBeNull();
});

test('selecting an API employee opens readonly information and preserves filters on close',async()=>{
 show();await screen.findByText('6 de 6 empleados');fireEvent.change(filters().search,{target:{value:'Ana'}});fireEvent.change(filters().role,{target:{value:'RECEPCION'}});
 await userEvent.click(screen.getByRole('button',{name:/^Ana Recepción/}));const dialog=screen.getByRole('dialog',{name:'Información del empleado'});
 expect(within(dialog).getByText('Nombre completo').nextElementSibling).toHaveTextContent('Ana Recepción');expect(within(dialog).getByText('empleado51@example.invalid')).toBeVisible();expect(within(dialog).queryByRole('textbox')).toBeNull();expect(within(dialog).queryByRole('button',{name:/Guardar/})).toBeNull();
 await userEvent.click(within(dialog).getByRole('button',{name:'Cerrar información del empleado'}));expect(filters().search).toHaveValue('Ana');expect(filters().role).toHaveValue('RECEPCION');expect(fetcher).toHaveBeenCalledTimes(2);expect(fetcher.mock.calls.every(([,init])=>init?.method==='GET')).toBe(true);
});
test('connected list combines name/email search, role and state using API identity, without writes or extra queries',async()=>{
  show();await screen.findByText('6 de 6 empleados');const f=filters();
  expect(screen.queryByRole('button',{name:/^Nombre anterior/})).toBeNull();
  fireEvent.change(f.search,{target:{value:'  ANA RECEPCIÓN  '}});expect(screen.getByText('1 de 6 empleados')).toBeVisible();
  expect(screen.getByRole('button',{name:/^Ana Recepción/})).toBeVisible();
  fireEvent.change(f.search,{target:{value:'EMPLEADO52@EXAMPLE.INVALID'}});expect(screen.getByRole('button',{name:/^Bruno Recepción/})).toBeVisible();
  fireEvent.change(f.role,{target:{value:'RECEPCION'}});fireEvent.change(f.state,{target:{value:'ACTIVO'}});
  expect(screen.getByText('No hay empleados que coincidan con los filtros.')).toBeVisible();
  fireEvent.change(f.search,{target:{value:''}});expect(screen.getByRole('button',{name:/^Ana Recepción/})).toBeVisible();expect(screen.queryByRole('button',{name:/^Bruno Recepción/})).toBeNull();
  fireEvent.change(f.state,{target:{value:'INACTIVO'}});expect(screen.getByRole('button',{name:/^Bruno Recepción/})).toBeVisible();
  fireEvent.change(f.role,{target:{value:''}});fireEvent.change(f.state,{target:{value:''}});expect(screen.getByText('6 de 6 empleados')).toBeVisible();
  expect(fetcher).toHaveBeenCalledTimes(2);expect(fetcher.mock.calls.every(([,init])=>init?.method==='GET')).toBe(true);
});
test.each(['ADMIN','RECEPCION','MANTENIMIENTO_LIMPIEZA','ROOM_SERVICE'])('role %s filters returned accounts and refresh retains the filter',async rol=>{
  show();await screen.findByText('6 de 6 empleados');fireEvent.change(filters().role,{target:{value:rol}});
  for(const record of records)expect(Boolean(screen.queryByRole('button',{name:new RegExp('^'+record.nombreCompleto)}))).toBe(record.rol===rol);
  records=records.filter(r=>r.rol!==rol);await userEvent.click(screen.getByRole('button',{name:'Actualizar'}));
  expect(await screen.findByText('No hay empleados que coincidan con los filtros.')).toBeVisible();expect(filters().role).toHaveValue(rol);
});
test('own identity is matched by session ID; role/state remain unchanged while personal data is editable',async()=>{
 show();await userEvent.click(within((await screen.findByRole('button',{name:/^Administradora actual/})).closest('tr')!).getByRole('button',{name:'Editar empleado'}));const dialog=screen.getByRole('dialog');

 const role=within(dialog).getByRole('combobox',{name:'Área'});expect(role).toBeDisabled();expect(within(dialog).queryByRole('combobox',{name:'Estado'})).toBeNull();fireEvent.change(role,{target:{value:'RECEPCION'}});expect(role).toHaveValue('ADMIN');
 fireEvent.change(within(dialog).getByLabelText('Nombre completo'),{target:{value:'Nombre actualizado'}});await userEvent.click(within(dialog).getByRole('button',{name:'Guardar cambios'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 const writes=fetcher.mock.calls.filter(([,init])=>init?.method!=='GET');expect(writes).toHaveLength(1);expect(writes[0][0]).toBe('/api/admin/empleados/41');expect(JSON.parse(String(writes[0][1]?.body))).toEqual({nombreCompleto:'Nombre actualizado',telefono:'55551234',rol:'ADMIN',area:null});expect(writes.some(([path])=>String(path).endsWith('/estado'))).toBe(false);
});
test('another administrator can be edited and backend rejection remains visible without losing input',async()=>{
 show();await userEvent.click(within((await screen.findByRole('button',{name:/^Otra administradora/})).closest('tr')!).getByRole('button',{name:'Editar empleado'}));const dialog=screen.getByRole('dialog');const role=within(dialog).getByRole('combobox',{name:'Área'});expect(role).toBeEnabled();expect(within(dialog).queryByRole('combobox',{name:'Estado'})).toBeNull();fireEvent.change(role,{target:{value:'RECEPCION'}});fetcher.mockResolvedValueOnce(Response.json({mensaje:'Operación no autorizada'},{status:403}));await userEvent.click(within(dialog).getByRole('button',{name:'Guardar cambios'}));expect(await within(dialog).findByRole('alert')).toHaveTextContent('Operación no autorizada');expect(role).toHaveValue('RECEPCION');
});
test('editing another employee retains official role/area/state endpoints and labor history',async()=>{
 show();await userEvent.click(within((await screen.findByRole('button',{name:/^Ana Recepción/})).closest('tr')!).getByRole('button',{name:'Editar empleado'}));const dialog=screen.getByRole('dialog');fireEvent.change(within(dialog).getByRole('combobox',{name:'Área'}),{target:{value:'MANTENIMIENTO_LIMPIEZA'}});fireEvent.change(within(dialog).getByRole('combobox',{name:'Especialidad'}),{target:{value:'AMBAS'}});await userEvent.click(within(dialog).getByRole('button',{name:'Guardar cambios'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());const writes=fetcher.mock.calls.filter(([,init])=>init?.method!=='GET');expect(writes.map(([path,init])=>[path,init?.method,JSON.parse(String(init?.body))])).toEqual([['/api/admin/empleados/51','PATCH',{nombreCompleto:'Ana Recepción',telefono:'55551234',rol:'MANTENIMIENTO_LIMPIEZA',area:'AMBAS'}]]);expect(screen.queryByRole('dialog')).toBeNull();expect(screen.getByRole('button',{name:/^Ana Recepci\u00f3n/})).toBeVisible();
});
test('missing session identity does not enable editing or disclose payroll',async()=>{
 show(null);await userEvent.click(await screen.findByRole('button',{name:/^Ana Recepción/}));const dialog=screen.getByRole('dialog');await userEvent.click(within(dialog).getByRole('button',{name:'Información laboral'}));expect(within(dialog).queryByRole('button',{name:'Editar'})).toBeNull();expect(within(dialog).queryByText('Salario base (Q)')).toBeNull();expect(within(dialog).queryByRole('combobox')).toBeNull();expect(fetcher.mock.calls.every(([,init])=>init?.method==='GET')).toBe(true);
});

test('loading, true empty, server error and recovery remain distinct; no fictitious fallback',async()=>{
  let release!:(r:Response)=>void;fetcher.mockImplementationOnce(()=>new Promise(resolve=>{release=resolve;}));show();
  expect(screen.getByText('Consultando…')).toBeVisible();expect(filters().search).toBeDisabled();
  records=[];release(Response.json([]));expect(await screen.findByText('No hay empleados registrados.')).toBeVisible();
  fetcher.mockResolvedValueOnce(Response.json({mensaje:'Servicio no disponible'},{status:503}));await userEvent.click(screen.getByRole('button',{name:'Actualizar'}));
  expect(await screen.findByRole('alert')).toHaveTextContent('Servicio no disponible');expect(screen.queryByText('No hay empleados registrados.')).toBeNull();expect(filters().role).toBeDisabled();
  records=[account(51,'Ana Recepción','RECEPCION')];await userEvent.click(screen.getByRole('button',{name:'Actualizar'}));expect(await screen.findByText('1 de 1 empleados')).toBeVisible();expect(filters().search).toBeEnabled();
});
