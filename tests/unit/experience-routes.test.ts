import {expect,test,vi,afterEach} from 'vitest';
import {isExperienceGuestRoute} from '@/lib/bff/experienceRoutes';
import {experienceTotal,experienceDay,reserveExperience,type Experience} from '@/features/huesped/experienciasClient';
test('solo habilita métodos y rutas oficiales, nunca administración ni decisiones de Recepción',()=>{
 const root=['reservas','VS-ABC123','experiencias'];
 for(const tail of [[],['reservas'],['consultas'],['1','disponibilidad']])expect(isExperienceGuestRoute('GET',[...root,...tail])).toBe(true);
 for(const tail of [['reservas'],['1','consultas'],['reservas','1','cancelar']])expect(isExperienceGuestRoute('POST',[...root,...tail])).toBe(true);
 for(const method of ['PUT','DELETE','PATCH'])expect(isExperienceGuestRoute(method,[...root,'reservas'])).toBe(false);
 expect(isExperienceGuestRoute('POST',[...root,'reservas','1','decision'])).toBe(false);expect(isExperienceGuestRoute('GET',['reservas','otro','experiencias'])).toBe(false);expect(isExperienceGuestRoute('POST',[...root,'0','consultas'])).toBe(false);
});
test('precio por persona o reserva y fechas usan el catálogo y Guatemala',()=>{
 expect(experienceTotal({precio:25,tarifa:'POR_PERSONA'} as Experience,3)).toBe(75);expect(experienceTotal({precio:25,tarifa:'POR_RESERVA'} as Experience,3)).toBe(25);expect(experienceDay('2026-11-04T02:00:00Z')).toBe('2026-11-03');
});
afterEach(()=>vi.unstubAllGlobals());
test('reintentar una respuesta perdida conserva clave, impide otro cuerpo y limpia solo al confirmar',async()=>{
 const values=new Map<string,string>();vi.stubGlobal('sessionStorage',{getItem:(key:string)=>values.get(key)??null,setItem:(key:string,value:string)=>values.set(key,value),removeItem:(key:string)=>values.delete(key)});
 const fetch=vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(Response.json({id:7}));vi.stubGlobal('fetch',fetch);
 await expect(reserveExperience('VS-ABC123',2,9,2)).rejects.toThrow();await expect(reserveExperience('VS-ABC123',2,9,3)).rejects.toThrow('pendiente');expect(fetch).toHaveBeenCalledTimes(1);
 await expect(reserveExperience('VS-ABC123',2,9,2)).resolves.toEqual({id:7});expect(JSON.parse(fetch.mock.calls[0][1].body).clave).toBe(JSON.parse(fetch.mock.calls[1][1].body).clave);expect(values.size).toBe(0);
});
