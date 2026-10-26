vi.mock('@/features/admin/pages/hotelConfigurationClient',async()=>{const {operacion}=await import('@/lib/api/operaciones');const revision='"'+'a'.repeat(64)+'"';return {readHotelConfiguration:async(signal?:AbortSignal)=>({hotel:await operacion('admin/hotel','GET',undefined,signal),revision}),saveHotelConfiguration:async(body:unknown)=>({hotel:await operacion('admin/hotel','PUT',body),revision})};});
import {fireEvent,render,screen,waitFor,within} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {afterEach,beforeEach,expect,test,vi} from 'vitest';
import {useState} from 'react';
import {operacion,OperationError} from '@/lib/api/operaciones';
import {getPublicHotel} from '@/lib/api/public';
import HotelAdmin from '@/features/admin/pages/HotelAdmin';
import CatalogosAdmin from '@/features/admin/pages/CatalogosAdmin';
import EmployeeInformationDialog from '@/features/admin/pages/EmployeeInformationDialog';
import AdminPhotoGallery from '@/features/admin/pages/AdminPhotoGallery';
import type {CatalogPhotoDraft} from '@/features/admin/pages/catalogPhotoClient';
import {loadEmployees,saveEmployee} from '@/features/admin/pages/employeeClient';
import {adminServiceError,photoUrlForKey} from '@/features/admin/pages/adminServiceError';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/lib/api/public',()=>({getPublicHotel:vi.fn()}));
vi.mock('@/components/common/PublicLanguageToggle',()=>({usePublicLanguage:()=>({en:false})}));
const call=vi.mocked(operacion),publicHotel=vi.mocked(getPublicHotel);
const account={id:51,nombreCompleto:'Empleado real de fixture',correo:'fixture@example.invalid',telefono:'55551234',rol:'RECEPCION',area:null,estado:'ACTIVO'};
const hotel={nombre:'Hotel de fixture',descripcion:'Descripción',direccion:'Dirección',telefono:'55551234',correo:'hotel@example.invalid',nombreComercial:'Comercial',razonSocial:'Fiscal',nit:'1234567-9',direccionFiscal:'Fiscal',fotos:[{clave:'hotel/uno.png',orden:0},{clave:'hotel/dos.png',orden:1}],horaCheckIn:'15:00',horaCheckOut:'12:00',politicaCancelacion:'Política'};
beforeEach(()=>{call.mockReset().mockResolvedValue(hotel);publicHotel.mockReset().mockResolvedValue({nombre:hotel.nombre,descripcion:hotel.descripcion,fotos:['https://images.example.invalid/hotel/uno.png','https://images.example.invalid/hotel/dos.png'],ubicacion:{direccion:hotel.direccion},contacto:{telefono:hotel.telefono,correo:hotel.correo},horaCheckIn:'15:00',horaCheckOut:'12:00'});vi.stubGlobal('URL',class extends URL{static createObjectURL=vi.fn(()=> 'blob:local-fixture');static revokeObjectURL=vi.fn();});});
afterEach(()=>vi.unstubAllGlobals());

test('a failed employment service does not hide the official employee identity',async()=>{
 call.mockImplementation(async path=>{if(path==='admin/empleados')return [account];throw new OperationError('No disponible',503);});
 const rows=await loadEmployees();expect(rows[0]).toMatchObject({...account,nombre:account.nombreCompleto,laborDisponible:false});expect(rows[0].perfil).toBeUndefined();expect(rows[0].avisoLaboral).toMatch(/No se pudieron consultar/);
 render(<EmployeeInformationDialog employee={rows[0]} canReadLabor onClose={()=>{}}/>);expect(screen.getByText(account.correo)).toBeVisible();await userEvent.click(screen.getByRole('button',{name:'Información laboral'}));expect(screen.getByText('Rol').nextElementSibling).toHaveTextContent('RECEPCION');expect(screen.getByRole('status')).toHaveTextContent('No se pudieron consultar');
});

test('employee creation uses only its official DTO and never attempts an implicit labor save',async()=>{
 call.mockResolvedValue({empleado:account,contrasenaTemporal:'fixture-only-temporary'});const created=vi.fn();
 await saveEmployee({nombre:account.nombreCompleto,correo:account.correo,telefono:account.telefono,rol:'RECEPCION',area:null,estado:'ACTIVO',perfil:{salarioBase:999}},created);
 expect(call).toHaveBeenCalledTimes(1);expect(call).toHaveBeenCalledWith('admin/empleados','POST',{nombreCompleto:account.nombreCompleto,correo:account.correo,telefono:account.telefono,rol:'RECEPCION',area:null});expect(created).toHaveBeenCalledWith(51,'fixture-only-temporary');
});

test('new employee separates identity and access without presenting payroll as initial registration',async()=>{
 call.mockResolvedValue([]);render(<CatalogosAdmin initial="personal" resources={['personal']}/>);await waitFor(()=>expect(screen.getByRole('button',{name:'+ Nuevo empleado'})).toBeEnabled());await userEvent.click(screen.getByRole('button',{name:'+ Nuevo empleado'}));const dialog=screen.getByRole('dialog',{name:'Nuevo empleado'});
 expect(within(dialog).getByRole('group',{name:'Datos personales'})).toBeVisible();expect(within(dialog).getByRole('group',{name:'Acceso al sistema'})).toBeVisible();expect(within(dialog).queryByLabelText('Salario base (Q)')).toBeNull();expect(within(dialog).queryByLabelText('Estado')).toBeNull();await userEvent.keyboard('{Escape}');expect(screen.queryByRole('dialog')).toBeNull();
});

for(const [status,code,message] of [[401,'NO_AUTENTICADO','sesión'],[403,'ACCESO_DENEGADO','permiso'],[404,'HOTEL_NO_CONFIGURADO','HOTEL_NO_CONFIGURADO'],[502,'API_NO_DISPONIBLE','contactar'],[500,'ERROR_INTERNO','servidor']] as const)test('hotel keeps writes disabled after '+code,async()=>{
 call.mockRejectedValue(new OperationError('Respuesta de fixture',status,{codigo:code}));render(<HotelAdmin/>);expect(await screen.findByRole('alert')).toHaveTextContent(message);expect(screen.getByRole('button',{name:'Guardar configuración'})).toBeDisabled();expect(call.mock.calls.every(([,method])=>method==='GET')).toBe(true);
});

test('an incomplete successful hotel response is not an invitation to initialize it',async()=>{
 call.mockResolvedValue(null);render(<HotelAdmin/>);expect(await screen.findByRole('alert')).toHaveTextContent('vacía o incompleta');expect(screen.getByRole('button',{name:'Guardar configuración'})).toBeDisabled();
});

test('hotel keeps entered fields after a rejected PUT and the registered keys on retry',async()=>{
 render(<HotelAdmin/>);await waitFor(()=>expect(screen.getByRole('textbox',{name:'Nombre del hotel'})).toBeEnabled());fireEvent.change(screen.getByRole('textbox',{name:'Nombre del hotel'}),{target:{value:'Nombre editado'}});call.mockResolvedValueOnce(hotel).mockRejectedValueOnce(new OperationError('Conflicto de fixture',409));await userEvent.click(screen.getByRole('button',{name:'Guardar configuración'}));expect(await screen.findByRole('alert')).toHaveTextContent('Conflicto');expect(screen.getByRole('textbox',{name:'Nombre del hotel'})).toHaveValue('Nombre editado');expect(call.mock.calls.find(([,method])=>method==='PUT')?.[2]).toMatchObject({nombre:'Nombre editado'});expect(call.mock.calls.find(([,method])=>method==='PUT')?.[2]).not.toHaveProperty('fotos');
});

test('hotel gallery resolves only returned matching URLs and persists order after reloading',async()=>{
 let saved=hotel;call.mockImplementation(async(_path,method,body)=>{if(method==='PUT')saved={...hotel,...body as typeof hotel};return saved;});const view=render(<HotelAdmin/>);await screen.findByRole('button',{name:'Ampliar fotografía 1'});await userEvent.click(screen.getByRole('button',{name:'Mover fotografía 1 después'}));await userEvent.click(screen.getByRole('button',{name:'Guardar configuración'}));await screen.findByText('Datos del hotel actualizados.');expect(saved.fotos).toEqual([{clave:'hotel/dos.png',orden:0},{clave:'hotel/uno.png',orden:1}]);view.unmount();render(<HotelAdmin/>);await screen.findByRole('button',{name:'Ampliar fotografía 1'});expect(screen.getByAltText('Fotografía 1')).toHaveAttribute('src','https://images.example.invalid/hotel/dos.png');
});

test('gallery removal requires confirmation, does not delete storage and retains valid principal',async()=>{
 function Gallery(){const [photos,setPhotos]=useState<CatalogPhotoDraft[]>([{url:'https://images.example.invalid/uno.png',clave:'uno',principal:true},{url:'https://images.example.invalid/dos.png',clave:'dos',principal:false}]);return <AdminPhotoGallery management principal value={photos} onChange={setPhotos}/>;}
 render(<Gallery/>);await userEvent.click(screen.getByRole('button',{name:'Eliminar fotografía 1'}));await userEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Cancelar'}));expect(screen.getAllByAltText(/Fotografía \d/)).toHaveLength(2);await userEvent.click(screen.getByRole('button',{name:'Eliminar fotografía 1'}));await userEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Quitar fotografía'}));expect(screen.getAllByAltText(/Fotografía \d/)).toHaveLength(1);expect(screen.getByRole('button',{name:'Establecer fotografía 1 como principal'})).toHaveAttribute('aria-pressed','true');expect(call).not.toHaveBeenCalled();
});

test('preview matching cannot invent a host or use an unrelated public photograph',()=>{
 expect(photoUrlForKey('hotel/uno.png',['https://images.example.invalid/hotel/uno.png?signature=fixture'])).toBe('https://images.example.invalid/hotel/uno.png?signature=fixture');expect(photoUrlForKey('hotel/uno.png',['https://images.example.invalid/hotel/otro.png'])).toBeUndefined();expect(photoUrlForKey('hotel/uno.png',['javascript:hotel/uno.png'])).toBeUndefined();expect(adminServiceError(new OperationError('fixture',403))).toMatch(/permiso/);
});
