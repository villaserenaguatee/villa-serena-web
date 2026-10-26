import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {GET,PUT} from '@/app/api/[...ruta]/route';
test('hotel proxy preserves ETag, conditional gallery writes, errors and ADMIN/Origin protection',async()=>{
 const saved={fetch:globalThis.fetch,mode:process.env.STAFF_AUTH_MODE,url:process.env.API_URL};process.env.STAFF_AUTH_MODE='spring';process.env.API_URL='https://backend.invalid';
 const revision='"'+'a'.repeat(64)+'"';let role='ADMIN',status=200,writes=0;
 globalThis.fetch=async(url,init)=>{if(String(url).endsWith('/yo'))return Response.json({id:9,nombre:'Admin',correo:'admin@example.invalid',rol:role,area:null,debeCambiarContrasena:false});if(init?.method==='PUT'){writes++;assert.equal(new Headers(init.headers).get('If-Match'),revision);}return Response.json(status===409?{codigo:'GALERIA_CAMBIADA',mensaje:'Actualiza la galería'}:{nombre:'Hotel de prueba'},{status,headers:{ETag:revision}});};
 const context={params:Promise.resolve({ruta:['admin','hotel']})};const request=(method:string,origin='http://localhost:3000')=>new NextRequest('http://localhost:3000/api/admin/hotel',{method,headers:{Origin:origin,Cookie:'vs_staff_access=isolated-session',...(method==='PUT'?{'If-Match':revision,'Content-Type':'application/json'}:{})},...(method==='PUT'?{body:JSON.stringify({fotos:[]})}:{})});
 try{assert.equal((await GET(request('GET'),context)).headers.get('ETag'),revision);assert.equal((await PUT(request('PUT'),context)).status,200);status=409;const conflict=await PUT(request('PUT'),context);assert.equal(conflict.status,409);assert.equal((await conflict.json()).codigo,'GALERIA_CAMBIADA');assert.equal((await PUT(request('PUT','https://other.invalid'),context)).status,403);role='RECEPCION';assert.equal((await PUT(request('PUT'),context)).status,403);assert.equal(writes,2);}finally{globalThis.fetch=saved.fetch;for(const [key,value]of Object.entries({STAFF_AUTH_MODE:saved.mode,API_URL:saved.url})){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
