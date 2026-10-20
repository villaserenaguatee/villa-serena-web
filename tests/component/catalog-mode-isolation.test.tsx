import {renderHook,waitFor} from '@testing-library/react';
import {beforeEach,expect,test,vi} from 'vitest';
import {usePublicCatalog} from '@/lib/usePublicCatalog';
const call=vi.hoisted(()=>vi.fn());
vi.mock('@/lib/api/public',()=>({getPublicCatalogWithMode:call}));
beforeEach(()=>{call.mockReset();});
test('connection failure produces an error and no sample inventory',async()=>{
 call.mockRejectedValue(new Error('No se pudo conectar con el servicio.'));
 const {result}=renderHook(usePublicCatalog);await waitFor(()=>expect(result.current.loading).toBe(false));expect(result.current.rooms).toEqual([]);expect(result.current.error).toContain('conectar');
});
test('a real empty inventory stays empty instead of becoming sample rooms',async()=>{
 call.mockResolvedValue({connected:true,data:[]});const {result}=renderHook(usePublicCatalog);await waitFor(()=>expect(result.current.loading).toBe(false));expect(result.current.connected).toBe(true);expect(result.current.rooms).toEqual([]);expect(result.current.error).toBe('');
});
