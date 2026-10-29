import {afterEach,expect,test,vi} from 'vitest';
import {readHotelConfiguration,saveHotelConfiguration} from '@/features/admin/pages/hotelConfigurationClient';
const tag='"'+'a'.repeat(64)+'"';
const hotel={nombre:'Prueba',descripcion:'Prueba',direccion:'Prueba',telefono:'55551234',correo:'prueba@example.invalid',nombreComercial:'Prueba',razonSocial:'Prueba',nit:'1234567-9',direccionFiscal:'Prueba',fotos:[]};
afterEach(()=>vi.unstubAllGlobals());
test('la revision del cuerpo conserva If-Match cuando el intermediario pierde ETag',async()=>{
 const fetch=vi.fn<typeof globalThis.fetch>(async()=>Response.json({...hotel,revisionGaleria:tag}));vi.stubGlobal('fetch',fetch);
 const snapshot=await readHotelConfiguration();expect(snapshot.revision).toBe(tag);expect(snapshot.diagnosticoRevision).toBe('ETAG_AUSENTE_REVISION_DEL_API');
 await saveHotelConfiguration(hotel,snapshot.revision);
 expect(fetch.mock.calls[1][1]?.headers).toMatchObject({'If-Match':tag});
});
test('no inventa revisiones ni acepta discrepancias entre cuerpo y encabezado',async()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
 fetch.mockResolvedValueOnce(Response.json(hotel,{headers:{ETag:'W/'+tag}}));
 expect((await readHotelConfiguration()).revision).toBeNull();
 fetch.mockResolvedValueOnce(Response.json({...hotel,revisionGaleria:tag},{headers:{ETag:'"'+'b'.repeat(64)+'"'}}));
 await expect(readHotelConfiguration()).rejects.toMatchObject({status:502});
 fetch.mockResolvedValueOnce(Response.json(hotel,{headers:{ETag:tag}}));expect((await readHotelConfiguration()).revision).toBe(tag);
});
