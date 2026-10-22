import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {GET,POST} from '@/app/api/[...ruta]/route';
test('ADMIN supervision BFF forwards authenticated GET only; mutations and Reception reads are denied',async()=>{
 const saved={fetch:globalThis.fetch,mode:process.env.STAFF_AUTH_MODE,url:process.env.API_URL};process.env.STAFF_AUTH_MODE='spring';process.env.API_URL='https://backend.invalid';let role='ADMIN',reads=0;
 globalThis.fetch=async(input,init)=>{
  const path=new URL(String(input)).pathname;
  if(path.endsWith('/yo'))return Response.json({id:9,nombre:'Admin',correo:'admin@example.invalid',rol:role,area:null,debeCambiarContrasena:false});
  reads++;assert.equal(init?.method,'GET');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer isolated-session');
  assert.ok(path.startsWith('/api/v1/incidencias'));return Response.json(path.endsWith('/1')?{id:1}:[]);
 };
 const req=(path:string,method='GET')=>new NextRequest(`http://localhost:3000/api/${path}`,{method,headers:{Origin:'http://localhost:3000',Cookie:'vs_staff_access=isolated-session'}});
 try{
  for(const path of ['incidencias','incidencias/1'])assert.equal((await GET(req(path),{params:Promise.resolve({ruta:path.split('/')})})).status,200);
  for(const path of ['incidencias','incidencias/1/tomar','incidencias/1/resolver'])assert.equal((await POST(req(path,'POST'),{params:Promise.resolve({ruta:path.split('/')})})).status,403);
  role='RECEPCION';assert.equal((await GET(req('incidencias'),{params:Promise.resolve({ruta:['incidencias']})})).status,403);assert.equal(reads,2);
 }finally{globalThis.fetch=saved.fetch;if(saved.mode===undefined)delete process.env.STAFF_AUTH_MODE;else process.env.STAFF_AUTH_MODE=saved.mode;if(saved.url===undefined)delete process.env.API_URL;else process.env.API_URL=saved.url;}
});
