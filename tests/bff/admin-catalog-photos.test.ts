import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest} from 'next/server';
import {incidenciaFotoRoute} from '@/lib/bff/incidenciaFoto';
test('catalog uploads enforce official ADMIN uses and preserve content/Origin protections',async()=>{
 const saved={fetch:globalThis.fetch,mode:process.env.STAFF_AUTH_MODE,url:process.env.API_URL};process.env.STAFF_AUTH_MODE='spring';process.env.API_URL='https://backend.invalid';let role='ADMIN',uploads=0;
 globalThis.fetch=async(input,init)=>{if(String(input).endsWith('/yo'))return Response.json({id:9,nombre:'Admin',correo:'admin@example.invalid',rol:role,area:null,debeCambiarContrasena:false});uploads++;assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer isolated-session');assert.ok(init?.body instanceof FormData);return Response.json({clave:'catalogo/imagen.png'},{status:201});};
 async function request(uso:string,file=new File([new Uint8Array([137,80,78,71,13,10,26,10])],'image.png',{type:'image/png'})){
  const form=new FormData();form.set('archivo',file);form.set('uso',uso);const multipart=new Response(form);return new NextRequest('http://localhost:3000/api/archivos/imagenes',{method:'POST',headers:{Origin:'http://localhost:3000',Cookie:'vs_staff_access=isolated-session','Content-Type':multipart.headers.get('Content-Type')!},body:await multipart.arrayBuffer()});
 }
 try{
  for(const uso of ['HOTEL','TIPO_HABITACION','MENU'])assert.equal((await incidenciaFotoRoute(await request(uso))).status,201);
  for(const uso of ['INCIDENCIA','UNKNOWN',''])assert.equal((await incidenciaFotoRoute(await request(uso))).status,403);
  assert.equal((await incidenciaFotoRoute(await request('MENU',new File(['not a photograph'],'image.png',{type:'image/png'})))).status,400);
  role='RECEPCION';assert.equal((await incidenciaFotoRoute(await request('MENU'))).status,403);assert.equal(uploads,3);
 }finally{globalThis.fetch=saved.fetch;if(saved.mode===undefined)delete process.env.STAFF_AUTH_MODE;else process.env.STAFF_AUTH_MODE=saved.mode;if(saved.url===undefined)delete process.env.API_URL;else process.env.API_URL=saved.url;}
});


test('official catalog operations pass through the authenticated ADMIN proxy without changing methods or DTOs',async()=>{
 const {GET,POST,PUT,PATCH,DELETE}=await import('@/app/api/[...ruta]/route');const saved={fetch:globalThis.fetch,mode:process.env.STAFF_AUTH_MODE,url:process.env.API_URL};process.env.STAFF_AUTH_MODE='spring';process.env.API_URL='https://backend.invalid';let role='ADMIN',forwarded=0;
 globalThis.fetch=async(input,init)=>{if(String(input).endsWith('/yo'))return Response.json({id:9,nombre:'Admin',correo:'admin@example.invalid',rol:role,area:null,debeCambiarContrasena:false});forwarded++;assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer isolated-session');assert.ok(new URL(String(input)).pathname.startsWith('/api/v1/admin/'));return init?.method==='DELETE'?new Response(null,{status:204}):Response.json({ok:true});};
 const paths=[['GET','admin/menu/items'],['POST','admin/menu/items'],['PATCH','admin/menu/items/7'],['PATCH','admin/menu/items/7/estado'],['POST','admin/menu/items/7/reactivar'],['POST','admin/menu/categorias'],['PATCH','admin/menu/categorias/3'],['GET','admin/temporadas'],['POST','admin/temporadas'],['PUT','admin/temporadas/4'],['DELETE','admin/temporadas/4'],['GET','admin/hotel'],['PUT','admin/hotel'],['PUT','admin/tipos-habitacion/9/fotos']];
 const handlers={GET,POST,PUT,PATCH,DELETE};
 try{for(const [method,path] of paths){const req=new NextRequest('http://localhost:3000/api/'+path,{method,headers:{Origin:'http://localhost:3000',Cookie:'vs_staff_access=isolated-session','Content-Type':'application/json'},...(method==='GET'?{}:{body:'{}'})});assert.equal((await handlers[method as keyof typeof handlers](req,{params:Promise.resolve({ruta:path.split('/')})})).status,method==='DELETE'?204:200);}assert.equal(forwarded,paths.length);role='RECEPCION';const req=new NextRequest('http://localhost:3000/api/admin/menu/items',{headers:{Cookie:'vs_staff_access=isolated-session'}});assert.equal((await GET(req,{params:Promise.resolve({ruta:['admin','menu','items']})})).status,403);assert.equal(forwarded,paths.length);
 }finally{globalThis.fetch=saved.fetch;if(saved.mode===undefined)delete process.env.STAFF_AUTH_MODE;else process.env.STAFF_AUTH_MODE=saved.mode;if(saved.url===undefined)delete process.env.API_URL;else process.env.API_URL=saved.url;}
});
