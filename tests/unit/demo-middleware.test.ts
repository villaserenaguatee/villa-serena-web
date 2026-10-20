import {afterEach,describe,expect,it,vi} from 'vitest';
import {NextRequest} from 'next/server';
import {middleware} from '../../src/middleware';
afterEach(()=>vi.unstubAllEnvs());
function config(real=false){vi.stubEnv('NODE_ENV',real?'production':'development');vi.stubEnv('STAFF_AUTH_MODE',real?'spring':'demo');vi.stubEnv('GUEST_AUTH_MODE',real?'spring':'demo');vi.stubEnv('VILLA_SERENA_BFF_MODE',real?'api':'demo');vi.stubEnv('API_URL',real?'https://api.example':'');}
describe('runtime boundary',()=>{
 it('blocks published demonstration before returning any API data',async()=>{config();vi.stubEnv('NODE_ENV','production');const response=middleware(new NextRequest('https://hotel.example/api/publico/tipos-habitacion'));expect(response.status).toBe(503);expect((await response.json()).codigo).toBe('CONFIGURACION_INVALIDA');});
 it('blocks mixed demo and real configuration before a mutation',()=>{config();vi.stubEnv('API_URL','https://api.example');const response=middleware(new NextRequest('http://localhost/api/reservas',{method:'POST',headers:{origin:'http://localhost'}}));expect(response.status).toBe(503);});
 it('keeps local demonstration available',()=>{config();expect(middleware(new NextRequest('http://localhost/api/publico/tipos-habitacion')).headers.get('x-middleware-next')).toBe('1');});
 it('lets the configured real service handle errors without selecting demo',()=>{config(true);expect(middleware(new NextRequest('https://hotel.example/api/publico/tipos-habitacion')).headers.get('x-middleware-next')).toBe('1');});
});
