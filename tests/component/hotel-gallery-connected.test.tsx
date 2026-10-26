import {renderHook,act,waitFor} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import {useHotelConfiguration} from '@/features/admin/pages/HotelAdmin';
import {readHotelConfiguration,saveHotelConfiguration} from '@/features/admin/pages/hotelConfigurationClient';
import {operacion,OperationError} from '@/lib/api/operaciones';
vi.mock('@/features/admin/pages/hotelConfigurationClient',()=>({readHotelConfiguration:vi.fn(),saveHotelConfiguration:vi.fn()}));
vi.mock('@/lib/api/operaciones',async importOriginal=>({...await importOriginal<typeof import('@/lib/api/operaciones')>(),operacion:vi.fn()}));
vi.mock('@/lib/api/public',()=>({getPublicHotel:vi.fn(async()=>({fotos:[]}))}));
const revision='"'+'a'.repeat(64)+'"';
const hotel={nombre:'Hotel de prueba',descripcion:'Descripción',direccion:'Dirección',telefono:'55551234',correo:'hotel@example.invalid',nombreComercial:'Comercial',razonSocial:'Fiscal',nit:'6-K',direccionFiscal:'Fiscal',fotos:[{clave:'hotel/previa.jpg',orden:0}],horaCheckIn:'15:00' as const,horaCheckOut:'12:00' as const,politicaCancelacion:'Política vigente'};
beforeEach(()=>{vi.mocked(readHotelConfiguration).mockReset().mockResolvedValue({hotel,revision});vi.mocked(saveHotelConfiguration).mockReset().mockImplementation(async body=>({hotel:{...hotel,...body,fotos:body.fotos??hotel.fotos},revision}));vi.mocked(operacion).mockReset().mockResolvedValue({clave:'hotel/00000000-0000-0000-0000-000000000011.png'});});
async function ready(){const hook=renderHook(()=>useHotelConfiguration());await waitFor(()=>expect(hook.result.current.ready).toBe(true));return hook;}
test('general save retains current fiscal values and omits gallery and revision',async()=>{
 const h=await ready();act(()=>h.result.current.setDraft(d=>({...d,nombre:'Nombre nuevo'})));
 vi.mocked(readHotelConfiguration).mockResolvedValueOnce({hotel:{...hotel,razonSocial:'Fiscal reciente'},revision});
 await act(()=>h.result.current.save());
 expect(saveHotelConfiguration).toHaveBeenCalledWith(expect.objectContaining({nombre:'Nombre nuevo',razonSocial:'Fiscal reciente'}),undefined);
 expect(vi.mocked(saveHotelConfiguration).mock.calls[0][0]).not.toHaveProperty('fotos');
});
test('upload, replacement, order and removal use official references and prevent duplicate sends',async()=>{
 const h=await ready(),file=new File(['imagen'],'nueva.png',{type:'image/png'});
 act(()=>h.result.current.setPhotos([{file,principal:false},{clave:'hotel/previa.jpg',principal:false}]));
 await act(async()=>{await Promise.all([h.result.current.save(),h.result.current.save()]);});
 expect(operacion).toHaveBeenCalledTimes(1);expect(operacion).toHaveBeenCalledWith('archivos/imagenes','POST',expect.any(FormData));
 expect(saveHotelConfiguration).toHaveBeenCalledTimes(1);expect(saveHotelConfiguration).toHaveBeenCalledWith(expect.objectContaining({fotos:[{clave:'hotel/00000000-0000-0000-0000-000000000011.png',orden:0},{clave:'hotel/previa.jpg',orden:1}]}),revision);
 act(()=>h.result.current.setPhotos([]));await act(()=>h.result.current.save());expect(vi.mocked(saveHotelConfiguration).mock.lastCall?.[0].fotos).toEqual([]);
});
test('conflict retains files and upload cache until explicit recovery, preserving personal edits',async()=>{
 const h=await ready(),file=new File(['imagen'],'nueva.png',{type:'image/png'});
 act(()=>{h.result.current.setPhotos([{file,principal:false}]);h.result.current.setDraft(d=>({...d,descripcion:'Sin guardar'}));});
 vi.mocked(saveHotelConfiguration).mockRejectedValue(new OperationError('Cambió',409,{codigo:'GALERIA_CAMBIADA'}));
 await act(()=>h.result.current.save());await act(()=>h.result.current.save());
 expect(operacion).toHaveBeenCalledTimes(1);expect(h.result.current.photos[0].file).toBe(file);expect(h.result.current.conflict).toBe(true);
 vi.mocked(readHotelConfiguration).mockResolvedValue({hotel:{...hotel,fotos:[{clave:'hotel/otro.jpg',orden:0}]},revision:'"'+'b'.repeat(64)+'"'});
 await act(()=>h.result.current.consultGallery());expect(h.result.current.photos[0].file).toBe(file);
 act(()=>h.result.current.useCurrentGallery());expect(h.result.current.photos[0].clave).toBe('hotel/otro.jpg');expect(h.result.current.draft.descripcion).toBe('Sin guardar');
});
test('missing revision disables photo writes and storage failures never report success',async()=>{
 vi.mocked(readHotelConfiguration).mockResolvedValue({hotel,revision:null});const h=await ready();
 act(()=>h.result.current.setPhotos([{file:new File(['x'],'foto.png',{type:'image/png'}),principal:false}]));await act(()=>h.result.current.save());expect(saveHotelConfiguration).not.toHaveBeenCalled();expect(h.result.current.gallerySupported).toBe(false);
});

test('fiscal save remains available after a rejected gallery file',async()=>{const h=await ready();act(()=>{h.result.current.setPhotoError('Formato inválido');h.result.current.setDraft(d=>({...d,razonSocial:'Fiscal modificada'}));});await act(()=>h.result.current.save({gallery:false}));expect(saveHotelConfiguration).toHaveBeenCalledWith(expect.objectContaining({razonSocial:'Fiscal modificada'}),undefined);expect(vi.mocked(saveHotelConfiguration).mock.calls[0][0]).not.toHaveProperty('fotos');});
