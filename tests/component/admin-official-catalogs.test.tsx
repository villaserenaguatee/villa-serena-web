import {render,screen,within,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,afterEach,expect,test,vi} from 'vitest';
import {operacion,OperationError} from '@/lib/api/operaciones';
import MenuAdmin from '@/features/admin/pages/MenuAdmin';
import TemporadasAdmin from '@/features/admin/pages/TemporadasAdmin';
import HotelAdmin from '@/features/admin/pages/HotelAdmin';
import AdminRoomPhotos from '@/features/admin/pages/AdminRoomPhotos';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/components/common/PublicLanguageToggle',()=>({usePublicLanguage:()=>({en:false})}));
const call=vi.mocked(operacion),NativeURL=URL;
const photo={clave:'tipos/one.png',url:'https://static.example.invalid/one.png',principal:true,orden:0};
const type={id:9,nombre:'Categoría existente',descripcion:'Habitación',capacidad:2,precioBase:420,ajusteFinSemanaPct:0,estado:'ACTIVO',fotos:[photo]};
const category={id:3,nombre:'Bebidas'},item={id:7,nombre:'Café',descripcion:'Café del hotel',categoriaId:3,precio:25,fotoClave:null,disponibilidad:'AGOTADO',estado:'ACTIVO'};
const season={id:4,nombre:'Temporada existente',inicio:'2026-12-01',fin:'2026-12-15',ajustePct:20,tipoHabitacionIds:[9]};
const hotel={nombre:'Hotel existente',descripcion:'Descripción',direccion:'Dirección existente',telefono:'55551234',correo:'hotel@example.invalid',nombreComercial:'Hotel existente',razonSocial:'Razón social',nit:'1234567-9',direccionFiscal:'Dirección fiscal',fotos:[],horaCheckIn:'15:00',horaCheckOut:'12:00',politicaCancelacion:'Política del servicio'};
beforeEach(()=>{
 vi.stubGlobal('URL',class extends NativeURL{static createObjectURL=vi.fn(()=> 'blob:isolated-photo');static revokeObjectURL=vi.fn();});
 call.mockReset().mockImplementation(async(path,method)=>{
  if(path==='archivos/imagenes')return {clave:'uploaded/photo.png'};
  if(path==='admin/menu/categorias')return method==='POST'?category:[category];
  if(path==='admin/menu/items')return method==='POST'?item:[item];
  if(path.startsWith('admin/menu/'))return item;
  if(path==='admin/tipos-habitacion')return [type];
  if(path==='admin/temporadas')return method==='POST'?season:[season];
  if(path.startsWith('admin/temporadas/'))return method==='DELETE'?null:season;
  if(path.startsWith('admin/tipos-habitacion/'))return type;
  if(path==='admin/hotel')return hotel;
  throw Error('Unexpected request: '+path);
 });
});
afterEach(()=>vi.unstubAllGlobals());
const writes=()=>call.mock.calls.filter(([,method])=>method&&method!=='GET');
async function openNewItem(){render(<MenuAdmin/>);const button=await screen.findByRole('button',{name:'Nuevo producto'});await waitFor(()=>expect(button).toBeEnabled());await userEvent.click(button);return screen.getByRole('dialog');}
function fillItem(dialog:HTMLElement,price='42'){fireEvent.change(within(dialog).getByLabelText('Nombre'),{target:{value:' Té del hotel '}});fireEvent.change(within(dialog).getByLabelText('Descripción'),{target:{value:' Té natural '}});fireEvent.change(within(dialog).getByLabelText('Categoría'),{target:{value:'3'}});fireEvent.change(within(dialog).getByLabelText('Precio (Q)'),{target:{value:price}});}
test('menu rejects whitespace/missing fields/nonpositive price and preserves manual input',async()=>{
 const dialog=await openNewItem();fillItem(dialog,'0');fireEvent.change(within(dialog).getByLabelText('Nombre'),{target:{value:'   '}});await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));
 expect(within(dialog).getByLabelText('Nombre')).toHaveAttribute('aria-invalid','true');expect(within(dialog).getByLabelText('Precio (Q)')).toHaveAccessibleDescription('Ingrese un precio mayor a cero');expect(writes()).toHaveLength(0);
});
test('menu creates using official fields only and never uploads on file selection',async()=>{
 const dialog=await openNewItem();fillItem(dialog);const file=new File(['isolated image'],'image.png',{type:'image/png'});fireEvent.change(within(dialog).getByLabelText('Imagen (opcional)'),{target:{files:[file]}});expect(writes()).toHaveLength(0);
 await userEvent.dblClick(within(dialog).getByRole('button',{name:'Guardar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());
 expect(writes()).toHaveLength(2);expect(writes()[0][0]).toBe('archivos/imagenes');expect((writes()[0][2]as FormData).get('uso')).toBe('MENU');
 expect(writes()[1].slice(0,3)).toEqual(['admin/menu/items','POST',{nombre:'Té del hotel',descripcion:'Té natural',categoriaId:3,precio:42,fotoClave:'uploaded/photo.png'}]);
});
test('menu editing and category registration preserve their separate official contracts',async()=>{
 render(<MenuAdmin/>);await userEvent.click(await screen.findByRole('button',{name:'Editar producto'}));let dialog=screen.getByRole('dialog');fireEvent.change(within(dialog).getByLabelText('Precio (Q)'),{target:{value:'30'}});await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(writes()[0].slice(0,2)).toEqual(['admin/menu/items/7','PATCH']);
 await userEvent.click(screen.getByRole('tab',{name:'Categorías'}));await userEvent.click(screen.getByRole('button',{name:'Nueva categoría'}));dialog=screen.getByRole('dialog');fireEvent.change(within(dialog).getByLabelText('Nombre'),{target:{value:' Desayunos '}});await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(writes().at(-1)?.slice(0,3)).toEqual(['admin/menu/categorias','POST',{nombre:'Desayunos'}]);
});
test('availability reset and deactivation require confirmation; cancellation performs no write',async()=>{
 render(<MenuAdmin/>);await userEvent.click(await screen.findByRole('button',{name:'Reactivar disponibilidad'}));let dialog=screen.getByRole('dialog');await userEvent.click(within(dialog).getByRole('button',{name:'Cancelar'}));expect(writes()).toHaveLength(0);
 await userEvent.click(screen.getByRole('button',{name:'Reactivar disponibilidad'}));dialog=screen.getByRole('dialog');await userEvent.click(within(dialog).getByRole('button',{name:'Confirmar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(writes()[0].slice(0,3)).toEqual(['admin/menu/items/7/reactivar','POST',undefined]);
 await userEvent.click(screen.getByRole('button',{name:'Desactivar'}));await userEvent.click(within(screen.getByRole('dialog')).getByRole('button',{name:'Confirmar'}));await waitFor(()=>expect(writes()).toHaveLength(2));expect(writes()[1].slice(0,3)).toEqual(['admin/menu/items/7/estado','PATCH',{estado:'INACTIVO'}]);
});
test('menu read errors do not substitute demo records or permit pretend writes',async()=>{
 call.mockRejectedValue(new OperationError('Ruta no disponible',404));render(<MenuAdmin/>);expect(await screen.findByRole('alert')).toHaveTextContent('Ruta no disponible');expect(screen.queryByText('Café')).toBeNull();expect(screen.getByRole('button',{name:'Nuevo producto'})).toBeDisabled();expect(writes()).toHaveLength(0);
});
test('season editing supports category selection and validates date order/adjustment before PUT',async()=>{
 render(<TemporadasAdmin/>);await userEvent.click(await screen.findByRole('button',{name:'Editar'}));const dialog=screen.getByRole('dialog');expect(within(dialog).getByLabelText('Categoría existente')).toBeEnabled();
 fireEvent.change(within(dialog).getByLabelText('Fin'),{target:{value:'2026-11-30'}});fireEvent.change(within(dialog).getByLabelText('Ajuste (%)'),{target:{value:'-100'}});await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));expect(writes()).toHaveLength(0);expect(within(dialog).getByLabelText('Fin')).toHaveAttribute('aria-invalid','true');
 fireEvent.change(within(dialog).getByLabelText('Fin'),{target:{value:'2026-12-20'}});fireEvent.change(within(dialog).getByLabelText('Ajuste (%)'),{target:{value:'-10'}});await userEvent.click(within(dialog).getByLabelText('Aplicar a todas las categorías'));await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(writes()[0].slice(0,3)).toEqual(['admin/temporadas/4','PUT',{nombre:'Temporada existente',inicio:'2026-12-01',fin:'2026-12-20',ajustePct:-10,tipoHabitacionIds:[]}]);
});
test('season overlap rejection preserves the form and selected category; delete uses documented DELETE only',async()=>{
 render(<TemporadasAdmin/>);await userEvent.click(await screen.findByRole('button',{name:'Editar'}));let dialog=screen.getByRole('dialog');call.mockRejectedValueOnce(new OperationError('Conflicto con Temporada alta',409));await userEvent.click(within(dialog).getByRole('button',{name:'Guardar'}));expect(await within(dialog).findByRole('alert')).toHaveTextContent('Temporada alta');expect(within(dialog).getByLabelText('Categoría existente')).toBeChecked();await userEvent.click(within(dialog).getByRole('button',{name:'Cancelar'}));
 await userEvent.click(screen.getByRole('button',{name:'Actualizar'}));await waitFor(()=>expect(screen.queryByRole('alert')).toBeNull());await userEvent.click(screen.getByRole('button',{name:'Eliminar'}));dialog=screen.getByRole('dialog');await userEvent.click(within(dialog).getByRole('button',{name:'Eliminar'}));await waitFor(()=>expect(screen.queryByRole('dialog')).toBeNull());expect(writes().at(-1)?.slice(0,2)).toEqual(['admin/temporadas/4','DELETE']);
});
test('hotel rejects blank tax fields and invalid NIT without changing existing invoices or policy',async()=>{
 render(<HotelAdmin/>);await waitFor(()=>expect(screen.getByLabelText('Nombre del hotel')).toBeEnabled());fireEvent.change(screen.getByLabelText('Razón social'),{target:{value:'   '}});fireEvent.change(screen.getByLabelText('NIT del hotel'),{target:{value:'CF'}});await userEvent.click(screen.getByRole('button',{name:'Guardar configuración'}));expect(screen.getByLabelText('Razón social')).toHaveAttribute('aria-invalid','true');expect(screen.getByLabelText('NIT del hotel')).toHaveAttribute('aria-invalid','true');expect(writes()).toHaveLength(0);
 expect(screen.queryByLabelText('Política de cancelación')).toBeNull();expect(screen.queryByLabelText('Serie')).toBeNull();
});
test('hotel saves official fields only and displays confirmation solely after PUT succeeds',async()=>{
 render(<HotelAdmin/>);await waitFor(()=>expect(screen.getByLabelText('Nombre del hotel')).toBeEnabled());
 expect(screen.getByRole('button',{name:'Guardar configuración'})).toBeDisabled();
 fireEvent.change(screen.getByLabelText('Nombre del hotel'),{target:{value:' Nuevo nombre '}});
 await userEvent.dblClick(screen.getByRole('button',{name:'Guardar configuración'}));
 expect(await screen.findByText('Datos del hotel actualizados.')).toBeVisible();expect(writes()).toHaveLength(1);
 const [path,method,body]=writes()[0];expect([path,method]).toEqual(['admin/hotel','PUT']);expect(body).toMatchObject({nombre:'Nuevo nombre',fotos:[]});
 for(const key of ['horaCheckIn','horaCheckOut','politicaCancelacion','serie','correlativo'])expect(body).not.toHaveProperty(key);
});
test('missing hotel setup or unavailable API cannot trigger an invented initialization',async()=>{
 call.mockRejectedValue(new OperationError('HOTEL_NO_CONFIGURADO',404));render(<HotelAdmin/>);expect(await screen.findByRole('alert')).toHaveTextContent('HOTEL_NO_CONFIGURADO');expect(screen.getByRole('button',{name:'Guardar configuración'})).toBeDisabled();expect(writes()).toHaveLength(0);
});
test('room photos cannot save an empty gallery; principal change uses the complete official list',async()=>{
 render(<AdminRoomPhotos typeId={9}/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Guardar fotografías'})).toBeEnabled());await userEvent.click(screen.getByRole('button',{name:'Quitar imagen'}));await userEvent.click(screen.getByRole('button',{name:'Guardar fotografías'}));expect(screen.getByRole('alert')).toHaveTextContent('al menos una fotografía');expect(writes()).toHaveLength(0);
 const file=new File(['isolated image'],'image.png',{type:'image/png'});fireEvent.change(screen.getByLabelText('Agregar fotografía'),{target:{files:[file]}});expect(writes()).toHaveLength(0);await userEvent.click(screen.getByRole('button',{name:'Guardar fotografías'}));expect(await screen.findByText('Fotografías actualizadas.')).toBeVisible();expect(writes()[0][0]).toBe('archivos/imagenes');expect((writes()[0][2]as FormData).get('uso')).toBe('TIPO_HABITACION');expect(writes()[1].slice(0,3)).toEqual(['admin/tipos-habitacion/9/fotos','PUT',{fotos:[{clave:'uploaded/photo.png',orden:0,principal:true}]}]);
});
test('room photo failure is not success and retry reuses the already uploaded image',async()=>{
 render(<AdminRoomPhotos typeId={9}/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Guardar fotografías'})).toBeEnabled());const file=new File(['isolated image'],'image.png',{type:'image/png'});fireEvent.change(screen.getByLabelText('Fotografía 1'),{target:{files:[file]}});call.mockResolvedValueOnce({clave:'uploaded/photo.png'}).mockRejectedValueOnce(new OperationError('No se confirmó la asociación',409));await userEvent.click(screen.getByRole('button',{name:'Guardar fotografías'}));expect(await screen.findByRole('alert')).toHaveTextContent('No se confirmó');expect(screen.queryByText('Fotografías actualizadas.')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Guardar fotografías'}));expect(await screen.findByText('Fotografías actualizadas.')).toBeVisible();expect(writes().filter(([path])=>path==='archivos/imagenes')).toHaveLength(1);
});
test('gallery preserves several photographs and associates exactly one main photograph',async()=>{
 render(<AdminRoomPhotos typeId={9}/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Guardar fotografías'})).toBeEnabled());
 const file=new File(['isolated image'],'additional.png',{type:'image/png'});fireEvent.change(screen.getByLabelText('Agregar fotografía'),{target:{files:[file]}});
 const main=screen.getAllByRole('radio',{name:'Principal'});expect(main).toHaveLength(2);expect(main[0]).toBeChecked();expect(main[1]).not.toBeChecked();expect(writes()).toHaveLength(0);
 await userEvent.click(main[1]);expect(main[0]).not.toBeChecked();expect(main[1]).toBeChecked();await userEvent.click(screen.getByRole('button',{name:'Guardar fotografías'}));
 await screen.findByText('Fotografías actualizadas.');expect(writes().at(-1)?.[2]).toEqual({fotos:[{clave:'tipos/one.png',orden:0,principal:false},{clave:'uploaded/photo.png',orden:1,principal:true}]});
});
