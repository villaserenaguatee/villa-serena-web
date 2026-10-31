import {render,screen,within,fireEvent,waitFor} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {beforeEach,expect,test,vi} from 'vitest';
import RoomCatalogContent from '@/features/admin/pages/RoomCatalogManager';
import {operacion,OperationError} from '@/lib/api/operaciones';
import type {Offer,OfferInput,FeaturesInput} from '@/features/admin/pages/roomOffersClient';
vi.mock('@/lib/api/operaciones',async original=>({...await original<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
const call=vi.mocked(operacion),photo={clave:'tipos/existente.png',url:'https://images.example.invalid/existente.png',orden:0,principal:true};
let offers:Offer[],features:Partial<FeaturesInput>;
const base:OfferInput={tipoHabitacionId:9,nombre:'Oferta existente',descripcion:'Descripción existente',piso:1,capacidad:2,superficieM2:24,camas:{Matrimonial:1},caracteristicas:['Wi-Fi'],preferencias:['descanso'],precioPorNoche:420,publicada:false,orden:0,habitacionIds:[11]};
beforeEach(()=>{
 offers=[{...base,slug:'existente',fotos:[photo],cantidadHabitaciones:1,cantidadHabitacionesTipo:1}];features={capacidad:2,superficieM2:24,camas:{Matrimonial:1},caracteristicas:['Wi-Fi']};call.mockReset();
 call.mockImplementation(async(path,method,body)=>{
  if(path==='admin/ofertas')return structuredClone(offers);
  if(path==='admin/catalogos/habitaciones')return [{id:11,numero:'101',piso:1,tipoHabitacionId:9,estado:'ACTIVO'},{id:12,numero:'102',piso:1,tipoHabitacionId:10,estado:'ACTIVO'}];
  if(path==='admin/tipos-habitacion')return [{id:9,fotos:[photo]}];
  if(path==='admin/habitaciones/11/caracteristicas'){if(method==='PUT')features=body as FeaturesInput;return structuredClone(features);}
  if(path.startsWith('admin/ofertas/')){const slug=path.split('/')[2],value=body as OfferInput;if(method==='PATCH'){offers=offers.map(offer=>offer.slug===slug?{...offer,publicada:(body as {publicada:boolean}).publicada}:offer);return offers.find(offer=>offer.slug===slug);}const saved={...value,slug,fotos:[photo],cantidadHabitaciones:value.habitacionIds.length,cantidadHabitacionesTipo:1};offers=offers.filter(offer=>offer.slug!==slug).concat(saved);return saved;}
  throw Error('Operación inesperada '+path);
 });
});
const writes=()=>call.mock.calls.filter(([,method])=>method&&method!=='GET');
async function open(){render(<RoomCatalogContent typeId={9} name="Estándar" maxCapacity={4} onClose={vi.fn()}/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Nueva oferta'})).toBeEnabled());}
test('carga fotografías y ofertas existentes sin guardados ni controles falsos',async()=>{
 await open();expect(await screen.findByRole('img',{name:'Fotografía 1'})).toHaveAttribute('src',photo.url);expect(screen.getByText('Oferta existente',{exact:true})).toBeVisible();expect(screen.queryByText(/Pendiente de conexión|API #83|77225a1/)).toBeNull();expect(writes()).toHaveLength(0);
});
test('cerrar la fotografía ampliada no cierra el catálogo ni cambia sus datos',async()=>{
 const close=vi.fn();render(<RoomCatalogContent typeId={9} name="Estándar" maxCapacity={4} onClose={close}/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Nueva oferta'})).toBeEnabled());await userEvent.click(screen.getByRole('button',{name:'Ampliar fotografía 1'}));expect(screen.getByRole('dialog',{name:'Vista de fotografía'})).toBeVisible();fireEvent.keyDown(document,{key:'Escape'});expect(screen.queryByRole('dialog',{name:'Vista de fotografía'})).toBeNull();expect(close).not.toHaveBeenCalled();const catalog=screen.getByRole('dialog',{name:'Ofertas y galería · Estándar'});await userEvent.click(within(catalog).getByRole('button',{name:'Cerrar'}));expect(close).toHaveBeenCalledTimes(1);expect(writes()).toHaveLength(0);
});
test('editar, recuperar y publicar una oferta usan operaciones distintas y conservan vínculos y fotografías',async()=>{
 await open();await userEvent.click(screen.getByRole('button',{name:'Editar oferta Oferta existente'}));const form=screen.getByRole('region',{name:'Editar oferta'});
 expect(within(form).getByLabelText('Superficie (m²)')).toHaveValue(24);expect(within(form).getByLabelText('Tipo de cama 1')).toHaveValue('Matrimonial');expect(within(form).queryByText(/Habitación 102/)).toBeNull();
 fireEvent.change(within(form).getByLabelText('Nombre de la oferta'),{target:{value:'Nombre actualizado'}});await userEvent.click(within(form).getByRole('button',{name:'Guardar oferta'}));await screen.findByText('Oferta guardada.');expect(writes()).toHaveLength(1);expect(writes()[0]).toEqual(['admin/ofertas/existente','PUT',{...base,nombre:'Nombre actualizado'}]);expect(offers[0].fotos).toEqual([photo]);expect(offers[0].publicada).toBe(false);
 await userEvent.click(screen.getByRole('button',{name:'Editar oferta Nombre actualizado'}));expect(screen.getByLabelText('Nombre de la oferta')).toHaveValue('Nombre actualizado');await userEvent.click(screen.getByRole('button',{name:'Cancelar edición'}));
 await userEvent.click(screen.getByRole('button',{name:'Publicar oferta Nombre actualizado'}));expect(writes()).toHaveLength(1);await userEvent.click(within(screen.getByRole('region',{name:'Confirmar publicación'})).getByRole('button',{name:'Cancelar'}));expect(writes()).toHaveLength(1);
 await userEvent.click(screen.getByRole('button',{name:'Publicar oferta Nombre actualizado'}));await userEvent.click(screen.getByRole('button',{name:'Confirmar'}));await screen.findByText('Publicación actualizada.');expect(writes()[1]).toEqual(['admin/ofertas/existente/publicacion','PATCH',{publicada:true}]);
 await userEvent.click(screen.getByRole('button',{name:'Despublicar oferta Nombre actualizado'}));await userEvent.click(screen.getByRole('button',{name:'Confirmar'}));await waitFor(()=>expect(writes()).toHaveLength(3));expect(writes()[2][2]).toEqual({publicada:false});
});
test('la creación de oferta exige datos completos y siempre comienza sin publicar',async()=>{
 await open();await userEvent.click(screen.getByRole('button',{name:'Nueva oferta'}));await userEvent.click(screen.getByRole('button',{name:'Guardar oferta'}));expect(await screen.findByRole('alert')).toBeVisible();expect(writes()).toHaveLength(0);
 for(const [label,value] of [['Identificador de la oferta','nueva'],['Nombre de la oferta','Oferta nueva'],['Descripción de la oferta','Descripción nueva'],['Piso de la oferta','1'],['Precio público por noche (Q)','450'],['Capacidad','2'],['Superficie (m²)','24']])fireEvent.change(screen.getByLabelText(label),{target:{value}});
 await userEvent.click(screen.getByRole('button',{name:'Agregar tipo de cama'}));fireEvent.change(screen.getByLabelText('Tipo de cama 1'),{target:{value:'Matrimonial'}});await userEvent.click(screen.getByRole('checkbox',{name:/Habitación 101/}));await userEvent.click(screen.getByRole('button',{name:'Guardar oferta'}));await screen.findByText('Oferta guardada.');expect(writes()[0][0]).toBe('admin/ofertas/nueva');expect(writes()[0][1]).toBe('POST');expect(writes()[0][2]).toMatchObject({publicada:false,habitacionIds:[11],camas:{Matrimonial:1}});expect(writes()).toHaveLength(1);
});
test('un error de escritura conserva la edición y no muestra éxito',async()=>{
 await open();await userEvent.click(screen.getByRole('button',{name:'Editar oferta Oferta existente'}));fireEvent.change(screen.getByLabelText('Nombre de la oferta'),{target:{value:'Cambio pendiente'}});call.mockRejectedValueOnce(new OperationError('No hay habitaciones compatibles',409));await userEvent.click(screen.getByRole('button',{name:'Guardar oferta'}));expect(await screen.findByRole('alert')).toHaveTextContent('No hay habitaciones compatibles');expect(screen.getByLabelText('Nombre de la oferta')).toHaveValue('Cambio pendiente');expect(screen.queryByText('Oferta guardada.')).toBeNull();expect(offers[0].nombre).toBe('Oferta existente');
});
test('una respuesta incompleta no se presenta como un guardado confirmado',async()=>{
 await open();await userEvent.click(screen.getByRole('button',{name:'Editar oferta Oferta existente'}));call.mockResolvedValueOnce({});await userEvent.click(screen.getByRole('button',{name:'Guardar oferta'}));expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo confirmar la oferta');expect(screen.getByLabelText('Nombre de la oferta')).toHaveValue('Oferta existente');expect(screen.queryByText('Oferta guardada.')).toBeNull();
});
test('las características guardan en la habitación y respetan el rechazo por reservas activas',async()=>{
 await open();await userEvent.selectOptions(screen.getByLabelText('Habitación',{exact:true}),'11');await waitFor(()=>expect(screen.getByRole('button',{name:'Guardar características'})).toBeEnabled());expect(screen.getByLabelText('Superficie (m²)')).toHaveValue(24);
 fireEvent.change(screen.getByLabelText('Superficie (m²)'),{target:{value:'26'}});call.mockRejectedValueOnce(new OperationError('No se pueden cambiar características comprometidas en reservas activas.',409));await userEvent.click(screen.getByRole('button',{name:'Guardar características'}));expect(await screen.findByRole('alert')).toHaveTextContent('reservas activas');expect(screen.getByLabelText('Superficie (m²)')).toHaveValue(26);expect(screen.queryByText('Características guardadas.')).toBeNull();
 await userEvent.click(screen.getByRole('button',{name:'Guardar características'}));await screen.findByText('Características guardadas.');expect(writes().at(-1)).toEqual(['admin/habitaciones/11/caracteristicas','PUT',{...features,superficieM2:26}]);expect(writes().some(([path])=>path.startsWith('admin/ofertas'))).toBe(false);
 await userEvent.click(screen.getByRole('button',{name:'Actualizar características'}));await waitFor(()=>expect(screen.getByLabelText('Superficie (m²)')).toHaveValue(26));
});
for(const status of [401,403,404,503])test('consulta rechazada '+status+' no habilita escrituras',async()=>{
 call.mockRejectedValue(new OperationError('Consulta no disponible',status));render(<RoomCatalogContent typeId={9} name="Estándar" maxCapacity={4} onClose={vi.fn()}/>);await screen.findAllByRole('alert');expect(screen.getByRole('button',{name:'Nueva oferta'})).toBeDisabled();await userEvent.click(screen.getByRole('button',{name:'Nueva oferta'}));expect(writes()).toHaveLength(0);
});
