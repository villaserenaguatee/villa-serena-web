import {afterEach,expect,test,vi} from 'vitest';
import {readEditorialDraft,readPublishedEditorial,saveEditorialDraft,publishEditorial} from '@/lib/editorial/client';
const document={idioma:'es',revision:2,revisionPublicada:1,elementos:[{id:'inicio.titulo',texto:'Prueba'}]};
afterEach(()=>vi.unstubAllGlobals());
test('uses official BFF paths and expected revisions without auto-publication',async()=>{
 const fetch=vi.fn<typeof globalThis.fetch>(async()=>Response.json(document));vi.stubGlobal('fetch',fetch);
 await readEditorialDraft('es');await saveEditorialDraft('es',2,[{id:'inicio.titulo',texto:'Borrador'}]);
 expect(fetch.mock.calls.map(call=>String(call[0]))).toEqual(['/api/admin/hotel/editorial/es','/api/admin/hotel/editorial/es']);
 expect(JSON.parse(String(fetch.mock.calls[1][1]?.body))).toEqual({revision:2,elementos:[{id:'inicio.titulo',texto:'Borrador'}]});
 await publishEditorial('es',2);expect(fetch.mock.lastCall?.[0]).toBe('/api/admin/hotel/editorial/es/publicacion');expect(fetch.mock.lastCall?.[1]?.method).toBe('POST');
});
test('only explicit absence of publication falls back; errors, wrong language and draft-like public results reject',async()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
 fetch.mockResolvedValueOnce(Response.json({codigo:'CONTENIDO_NO_PUBLICADO'},{status:404}));expect(await readPublishedEditorial('es')).toBeNull();
 fetch.mockResolvedValueOnce(Response.json({codigo:'OTRO_ERROR'},{status:404}));await expect(readPublishedEditorial('es')).rejects.toMatchObject({status:404});
 fetch.mockResolvedValueOnce(Response.json(document));await expect(readPublishedEditorial('es')).rejects.toMatchObject({status:502});
 fetch.mockResolvedValueOnce(Response.json({...document,idioma:'en'}));await expect(readEditorialDraft('es')).rejects.toMatchObject({status:502});
});
