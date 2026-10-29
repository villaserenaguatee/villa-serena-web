import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {POST} from '@/app/api/[...ruta]/route';

test('hotel initialization preserves API statuses, DTO, session and Origin protections',async()=>{
 const saved={fetch:globalThis.fetch,mode:process.env.STAFF_AUTH_MODE,url:process.env.API_URL};process.env.STAFF_AUTH_MODE='spring';process.env.API_URL='https://backend.invalid';let role='ADMIN',status=201,forwarded=0;
 const input={nombre:'Hotel de prueba',descripcion:'Descripción',direccion:'Dirección',telefono:'55551234',correo:'hotel@example.invalid',nombreComercial:'Comercial',razonSocial:'Fiscal',nit:'6-K',direccionFiscal:'Fiscal'};
 globalThis.fetch=async(url,init)=>{if(String(url).endsWith('/yo'))return Response.json({id:9,nombre:'Admin',correo:'admin@example.invalid',rol:role,area:null,debeCambiarContrasena:false});forwarded++;assert.equal(String(url),'https://backend.invalid/api/v1/admin/hotel/inicializacion');assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer isolated-session');assert.equal(init?.method,'POST');assert.deepEqual(JSON.parse(String(init?.body)),input);return Response.json(status===409?{codigo:'HOTEL_YA_CONFIGURADO',mensaje:'No sobrescrito'}:input,{status});};
 const request=(origin='http://localhost:3000',cookie='vs_staff_access=isolated-session')=>new NextRequest('http://localhost:3000/api/admin/hotel/inicializacion',{method:'POST',headers:{Origin:origin,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(input)});
 const context={params:Promise.resolve({ruta:['admin','hotel','inicializacion']})};
 try{for(const code of [201,200,409]){status=code;const response=await POST(request(),context);assert.equal(response.status,code);assert.ok(!JSON.stringify(await response.json()).includes('isolated-session'));}assert.equal(forwarded,3);assert.equal((await POST(request('https://other.invalid'),context)).status,403);assert.equal((await POST(request('http://localhost:3000',''),context)).status,401);role='RECEPCION';assert.equal((await POST(request(),context)).status,403);assert.equal(forwarded,3);}finally{globalThis.fetch=saved.fetch;if(saved.mode===undefined)delete process.env.STAFF_AUTH_MODE;else process.env.STAFF_AUTH_MODE=saved.mode;if(saved.url===undefined)delete process.env.API_URL;else process.env.API_URL=saved.url;}
});
