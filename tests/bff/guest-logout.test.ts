import test from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {guestRoute} from '@/lib/bff/guestAccess';

test('explicit guest logout clears local cookies even when remote revocation fails', async () => {
  const originalFetch=globalThis.fetch,mode=process.env.GUEST_AUTH_MODE,url=process.env.API_URL;
  process.env.GUEST_AUTH_MODE='spring';process.env.API_URL='https://logout.example.test';
  try {
    for(const status of [204,400,503]) {
      globalThis.fetch=async()=>status===204?new Response(null,{status}):Response.json({codigo:'ERROR',mensaje:'Revocation failed'},{status});
      const response=await guestRoute(new NextRequest('http://localhost:3054/api/app/cerrar-sesion',{method:'POST',headers:{Origin:'http://localhost:3054',Cookie:'vs_guest_access=access'}}),['cerrar-sesion']);
      assert.equal(response.status,status);
      for(const name of ['vs_guest_access','vs_guest_refresh']) {
        assert.equal(response.cookies.get(name)?.value,'');
      }
      assert.match(response.headers.get('set-cookie')!,/Max-Age=0/);
    }
    globalThis.fetch=async()=>{throw new Error('offline');};
    const response=await guestRoute(new NextRequest('http://localhost:3054/api/app/cerrar-sesion',{method:'POST',headers:{Origin:'http://localhost:3054',Cookie:'vs_guest_access=access; vs_guest_refresh=refresh'}}),['cerrar-sesion']);
    assert.equal(response.status,502);
    assert.equal(response.cookies.get('vs_guest_access')?.value,'');
    assert.equal(response.cookies.get('vs_guest_refresh')?.value,'');
  } finally {
    globalThis.fetch=originalFetch;
    if(mode===undefined)delete process.env.GUEST_AUTH_MODE;else process.env.GUEST_AUTH_MODE=mode;
    if(url===undefined)delete process.env.API_URL;else process.env.API_URL=url;
  }
});
