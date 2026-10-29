import {saveEditorialDraft} from '@/lib/editorial/client';
vi.mock('@/lib/editorial/client',()=>({readEditorialDraft:vi.fn(async(idioma:string)=>({idioma,revision:0,revisionPublicada:0,elementos:[]})),saveEditorialDraft:vi.fn(),publishEditorial:vi.fn()}));
vi.mock('@/features/admin/pages/hotelConfigurationClient',async()=>{const {operacion}=await import('@/lib/api/operaciones');const revision='"'+'a'.repeat(64)+'"';return {readHotelConfiguration:async(signal?:AbortSignal)=>({hotel:await operacion('admin/hotel','GET',undefined,signal),revision}),saveHotelConfiguration:async(body:unknown)=>({hotel:await operacion('admin/hotel','PUT',body),revision})};});
﻿import {cleanup,render,screen,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,afterEach,expect,test,vi} from 'vitest';
import HotelConfigurationPage from '@/features/admin/pages/HotelWebsiteEditor';
import {operacion,OperationError} from '@/lib/api/operaciones';
import {getPublicHotel} from '@/lib/api/public';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/lib/api/public',()=>({getPublicHotel:vi.fn()}));
vi.mock('@/lib/usePublicCatalog',()=>({usePublicCatalog:()=>({rooms:[],loading:false,error:'',connected:true}),usePublicHotel:()=>null}));
vi.mock('@/features/admin/pages/PublicWebsitePreview',()=>({default:({route,preview,onSelect}:import('react').ComponentProps<typeof import('@/features/admin/pages/PublicWebsitePreview').default>)=><div data-testid="preview"><span>{route}</span><span data-testid="preview-name">{preview.hotel?.nombre}</span><span data-testid="preview-description">{preview.hotel?.descripcion}</span><span data-testid="preview-photos">{preview.hotel?.fotos.join(',')}</span><button onClick={()=>onSelect('contacto',{field:'correo',label:'Correo de contacto',value:''})}>Seleccionar contacto en vista previa</button><button onClick={()=>onSelect('historia',{key:'12',label:'Contenido',value:'Historia seleccionada'})}>Seleccionar texto fijo</button></div>}));
const hotel={editorFotografico:true,nombre:'Hotel aislado',descripcion:'Descripción existente',direccion:'Dirección existente',telefono:'55551234',correo:'hotel@example.invalid',nombreComercial:'Comercial',razonSocial:'Fiscal',nit:'1234567-9',direccionFiscal:'Fiscal',fotos:[{clave:'hotel/uno.png',orden:0},{clave:'hotel/dos.png',orden:1}],horaCheckIn:'15:00',horaCheckOut:'12:00',politicaCancelacion:'Política vigente'};
const call=vi.mocked(operacion),nativeURL=URL;
beforeEach(()=>{window.history.replaceState({},'','/admin/hotel');vi.stubGlobal('URL',class extends nativeURL{static createObjectURL=vi.fn(()=> 'blob:editor-only');static revokeObjectURL=vi.fn();});call.mockReset().mockImplementation(async(_path,method,body)=>method==='PUT'?{...hotel,...body as object}:hotel);vi.mocked(getPublicHotel).mockResolvedValue({nombre:hotel.nombre,descripcion:hotel.descripcion,fotos:['https://assets.example.invalid/hotel/uno.png','https://assets.example.invalid/hotel/dos.png'],ubicacion:{direccion:hotel.direccion},contacto:{telefono:hotel.telefono,correo:hotel.correo},horaCheckIn:'15:00',horaCheckOut:'12:00'});});
afterEach(()=>vi.unstubAllGlobals());
const writes=()=>call.mock.calls.filter(([,method])=>method&&method!=='GET');
async function openEditor(){render(<HotelConfigurationPage/>);await userEvent.click(screen.getByRole('button',{name:'Editor de la página web'}));await userEvent.click(screen.getByRole('button',{name:'Nombre del hotel'}));await waitFor(()=>expect(screen.getByLabelText('Nombre del hotel *')).toBeEnabled());}
test('two entries preserve the editor and expose five read-only policy sections',async()=>{
 render(<HotelConfigurationPage/>);expect(screen.queryByRole('button',{name:'Formulario completo'})).toBeNull();await userEvent.click(screen.getByRole('button',{name:'Datos y políticas del hotel'}));await screen.findByText(hotel.nombreComercial);for(const name of ['Identificación y datos fiscales','Facturación','Horarios y estancia','Reservas y cancelaciones','Privacidad y términos'])expect(screen.getByRole('heading',{name})).toBeVisible();expect(screen.getByText(hotel.politicaCancelacion)).toBeVisible();expect(screen.getByText('15:00')).toBeVisible();expect(screen.getByRole('link',{name:'Política de privacidad'})).toHaveAttribute('href','/privacidad');expect(screen.getByRole('link',{name:'Términos y condiciones'})).toHaveAttribute('href','/terminos');expect(screen.queryByRole('textbox')).toBeNull();expect(writes()).toHaveLength(0);
});
test('fiscal save validates NIT and retains all unrelated fields and photos in the official PUT',async()=>{
 render(<HotelConfigurationPage/>);await userEvent.click(screen.getByRole('button',{name:'Datos y políticas del hotel'}));await waitFor(()=>expect(screen.getByRole('button',{name:'Editar'})).toBeEnabled());await userEvent.click(screen.getByRole('button',{name:'Editar'}));fireEvent.change(screen.getByLabelText('NIT del hotel *'),{target:{value:'invalido'}});await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));expect(await screen.findByText('Ingrese un NIT válido con dígito verificador')).toBeVisible();expect(writes()).toHaveLength(0);fireEvent.change(screen.getByLabelText('NIT del hotel *'),{target:{value:hotel.nit}});fireEvent.change(screen.getByLabelText('Razón social *'),{target:{value:'Fiscal actualizada'}});await userEvent.click(screen.getByRole('button',{name:'Guardar cambios'}));await screen.findByText('Datos del hotel actualizados.');expect(screen.queryByRole('textbox')).toBeNull();expect(writes()).toEqual([['admin/hotel','PUT',{...Object.fromEntries(Object.entries(hotel).filter(([key])=>!['horaCheckIn','horaCheckOut','politicaCancelacion','fotos','editorFotografico'].includes(key))),razonSocial:'Fiscal actualizada'}]]);
});
test('cancelling fiscal edits preserves unsaved public changes between the two areas',async()=>{
 await openEditor();fireEvent.change(screen.getByLabelText('Nombre del hotel *'),{target:{value:'Nombre sin guardar'}});await userEvent.click(screen.getByRole('button',{name:'Volver'}));await userEvent.click(screen.getByRole('button',{name:'Datos y políticas del hotel'}));await userEvent.click(screen.getByRole('button',{name:'Editar'}));fireEvent.change(screen.getByLabelText('Razón social *'),{target:{value:'Descartar'}});await userEvent.click(screen.getByRole('button',{name:'Cancelar'}));expect(screen.getAllByText(hotel.razonSocial)).toHaveLength(2);await userEvent.click(screen.getByRole('button',{name:'Editor de la página web'}));await userEvent.click(screen.getByRole('button',{name:'Nombre del hotel'}));expect(screen.getByLabelText('Nombre del hotel *')).toHaveValue('Nombre sin guardar');expect(writes()).toHaveLength(0);
});
test('legacy full link redirects to policies and missing configuration keeps fiscal editing blocked',async()=>{
 window.history.replaceState({},'','/admin/hotel?vista=full');call.mockRejectedValue(new OperationError('HOTEL_NO_CONFIGURADO',404,{codigo:'HOTEL_NO_CONFIGURADO'}));render(<HotelConfigurationPage/>);expect(await screen.findByRole('alert')).toHaveTextContent('HOTEL_NO_CONFIGURADO');expect(screen.getByRole('heading',{name:'Datos y políticas del hotel'})).toBeVisible();expect(screen.getByRole('button',{name:'Editar'})).toBeDisabled();expect(screen.queryByRole('button',{name:'Formulario completo'})).toBeNull();expect(writes()).toHaveLength(0);
});
test('supported edits update preview before saving and PUT retains fiscal data and ordered references',async()=>{
 await openEditor();const save=screen.getByRole('button',{name:'Guardar datos del hotel'});expect(save).toBeDisabled();await userEvent.click(screen.getAllByRole('button',{name:'Descripción'}).at(-1)!);fireEvent.change(screen.getByLabelText('Descripción *'),{target:{value:'Descripción editada'}});expect(screen.getByTestId('preview-description')).toHaveTextContent('Descripción editada');expect(writes()).toHaveLength(0);
 await userEvent.click(save);await screen.findByText('Datos del hotel actualizados.');expect(writes()).toHaveLength(1);expect(writes()[0]).toEqual(['admin/hotel','PUT',{...Object.fromEntries(Object.entries(hotel).filter(([key])=>!['horaCheckIn','horaCheckOut','politicaCancelacion','fotos','editorFotografico'].includes(key))),descripcion:'Descripción editada'}]);
});
test('public section selection changes contextual controls and unsupported content never exposes a save',async()=>{
 await openEditor();await userEvent.click(screen.getByRole('button',{name:'Seleccionar contacto en vista previa'}));expect(screen.getByLabelText('Correo de contacto *')).toHaveValue(hotel.correo);await userEvent.click(screen.getByRole('button',{name:'Nosotros'}));await userEvent.click(screen.getByRole('button',{name:'Nuestra historia'}));expect(screen.getByTestId('preview')).toHaveTextContent('/nosotros');expect(screen.getByText('Selecciona un texto o una fotografía en la vista previa.')).toBeVisible();expect(screen.getByRole('button',{name:'Guardar datos del hotel'})).toBeDisabled();expect(writes()).toHaveLength(0);
});
test('invalid contact blocks saving; server rejections retain the draft and never report success',async()=>{
 await openEditor();await userEvent.click(screen.getByRole('button',{name:'Contacto y ayuda'}));await userEvent.click(screen.getByRole('button',{name:'Correo de contacto'}));fireEvent.change(screen.getByLabelText('Correo de contacto *'),{target:{value:'invalido'}});expect(screen.getByRole('button',{name:'Guardar datos del hotel'})).toBeDisabled();fireEvent.blur(screen.getByLabelText('Correo de contacto *'));expect(await screen.findByRole('alert')).toHaveTextContent('correo electrónico válido');fireEvent.change(screen.getByLabelText('Correo de contacto *'),{target:{value:'nuevo@example.invalid'}});call.mockRejectedValueOnce(new OperationError('Conflicto de actualización',409));await userEvent.click(screen.getByRole('button',{name:'Guardar datos del hotel'}));expect(await screen.findByRole('alert')).toHaveTextContent('No se pudieron guardar los cambios');expect(screen.getByLabelText('Correo de contacto *')).toHaveValue('nuevo@example.invalid');expect(screen.queryByText('Datos del hotel actualizados.')).toBeNull();
});
test('new HOTEL images preview without automatically writing and release temporary URLs',async()=>{
 await openEditor();await userEvent.click(screen.getByRole('button',{name:'Fotografías del hotel'}));fireEvent.change(screen.getByLabelText('Agregar fotografías'),{target:{files:[new File(['png'],'nueva.png',{type:'image/png'})]}});await waitFor(()=>expect(screen.getByRole('button',{name:'Guardar borrador'})).toBeEnabled());expect(screen.getByRole('button',{name:'Guardar datos del hotel'})).toBeDisabled();expect(screen.getByRole('img',{name:'Fotograf'+String.fromCharCode(237)+'a 3'})).toHaveAttribute('src','blob:editor-only');expect(writes()).toHaveLength(0);await userEvent.click(screen.getByRole('button',{name:'Volver'}));cleanup();expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:editor-only');
});
for(const status of [401,403,404])test('configuration error '+status+' keeps all writes disabled',async()=>{
 call.mockRejectedValue(new OperationError('HOTEL_NO_CONFIGURADO',status,{codigo:'HOTEL_NO_CONFIGURADO'}));render(<HotelConfigurationPage/>);await userEvent.click(screen.getByRole('button',{name:'Editor de la página web'}));await screen.findByRole('alert');await userEvent.click(screen.getByRole('button',{name:'Nombre del hotel'}));expect(screen.getByLabelText('Nombre del hotel *')).toBeDisabled();expect(screen.getByRole('button',{name:'Guardar datos del hotel'})).toBeDisabled();expect(writes()).toHaveLength(0);
});

test('fixed element inspection retains selected text without technical controls',async()=>{await openEditor();await userEvent.click(screen.getByRole('button',{name:'Seleccionar texto fijo'}));expect(screen.getByText('Historia seleccionada')).toBeVisible();expect(screen.getByText('Este contenido todavía no admite cambios guardados.')).toBeVisible();expect(screen.queryByText(/Persistencia disponible:/)).toBeNull();expect(screen.getByRole('button',{name:'Guardar datos del hotel'})).toBeDisabled();expect(screen.queryByRole('button',{name:'Diagn\u00f3stico t\u00e9cnico'})).toBeNull();expect(writes()).toHaveLength(0);});

test('photo draft conflict preserves changes and offers explicit recovery',async()=>{await openEditor();await userEvent.click(screen.getByRole('button',{name:'Fotografías del hotel'}));await userEvent.click(screen.getByRole('button',{name:'Mover fotografía 2 antes'}));vi.mocked(saveEditorialDraft).mockRejectedValueOnce(new OperationError('Conflicto',409,{codigo:'CONTENIDO_CAMBIADO'}));await userEvent.click(screen.getByRole('button',{name:'Guardar borrador'}));expect(await screen.findByRole('alert')).toHaveTextContent('Conflicto');expect(screen.getByRole('button',{name:'Consultar borrador actual'})).toBeEnabled();expect(writes()).toHaveLength(0);});

test('el editor no muestra controles de idioma ni campos en ingles',async()=>{
 await openEditor();
 expect(screen.queryByLabelText(/Idioma/)).toBeNull();
 expect(screen.queryByText('English')).toBeNull();
 expect(screen.queryByRole('tab',{name:/English/})).toBeNull();
});

test('el panel de fotografías no muestra explicaciones permanentes ni accesos a otros módulos',async()=>{
 await openEditor();await userEvent.click(screen.getByRole('button',{name:'Servicios'}));
 expect(screen.queryByRole('link',{name:'Gestionar amenidades y Wi-Fi'})).toBeNull();
 expect(screen.queryByRole('link',{name:'Gestionar menú de Room Service'})).toBeNull();
 expect(screen.queryByRole('button',{name:'Diagnóstico técnico'})).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Galería'}));await userEvent.click(screen.getByRole('button',{name:'Fotografías del hotel'}));
 expect(screen.getByRole('region',{name:'Fotografías de esta sección'})).toBeVisible();
 expect(screen.queryByText(/Los cambios se muestran en la vista previa/)).toBeNull();
 expect(screen.getByRole('button',{name:'Ampliar fotografía 1'})).toBeEnabled();
 expect(screen.getByLabelText('Reemplazar fotografía 1')).toBeEnabled();
 expect(screen.getByRole('button',{name:'Eliminar fotografía 1'})).toBeEnabled();
 expect(screen.getByRole('button',{name:'Mover fotografía 2 antes'})).toBeEnabled();
 expect(screen.getByRole('button',{name:'Agregar más fotografías'})).toBeEnabled();
 expect(writes()).toHaveLength(0);
});
