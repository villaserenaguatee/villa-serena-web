// Adaptador HTTP controlado SOLO para Playwright; no es un backend del producto.
import {createServer} from 'node:http';
import {createHash,randomUUID} from 'node:crypto';
const host='http://127.0.0.1:3150';
const hotel={nombre:'Hotel de prueba aislado',descripcion:'Descripción de prueba',direccion:'Dirección de prueba',telefono:'55551234',correo:'hotel@example.invalid',nombreComercial:'Comercial',razonSocial:'Fiscal',nit:'6-K',direccionFiscal:'Fiscal',fotos:[],horaCheckIn:'15:00',horaCheckOut:'12:00',politicaCancelacion:'Condición del entorno de pruebas'};
const employee={id:9,nombre:'Administrador de pruebas',correo:'admin@example.invalid',rol:'ADMIN',area:null,debeCambiarContrasena:false};
const drafts={es:{idioma:'es',revision:0,revisionPublicada:0,elementos:[]},en:{idioma:'en',revision:0,revisionPublicada:0,elementos:[]}},published={es:null,en:null},objects=new Map();
const tag=()=>`"${createHash('sha256').update(JSON.stringify(hotel.fotos)).digest('hex')}"`;
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,host),path=url.pathname;
 const send=(value,status=200,headers={})=>{res.writeHead(status,{'Content-Type':'application/json',...headers});res.end(JSON.stringify(value));};
 try{
  if(path==='/health')return send({ready:true});
  if(path.startsWith('/hotel/')){const bytes=objects.get(path.slice(1));if(!bytes)return send({},404);res.writeHead(200,{'Content-Type':'image/png'});return res.end(bytes);}
  const data=Buffer.concat(await Array.fromAsync(req));
  if(path==='/api/v1/auth/login'||path==='/api/v1/app/acceso/iniciar-sesion'){const input=JSON.parse(data);if(input.correo!=='admin@example.invalid'||(input.contrasena??input.credencial)!=='Solo-Prueba-123')return send({codigo:'CREDENCIALES_INVALIDAS',mensaje:'Credenciales de prueba incorrectas'},401);return send({accessToken:'isolated-admin-access',refreshToken:'isolated-admin-refresh',tipoToken:'Bearer',expiraEn:3600,empleado:employee});}
  if(path==='/api/v1/auth/yo')return req.headers.authorization==='Bearer isolated-admin-access'?send(employee):send({codigo:'SESION_VENCIDA'},401);
  if(path.startsWith('/api/v1/admin/')||path==='/api/v1/archivos/imagenes'){if(req.headers.authorization!=='Bearer isolated-admin-access')return send({},401);}
  if(path==='/api/v1/admin/hotel'){
   if(req.method==='PUT'){const input=JSON.parse(data);if(input.fotos&&JSON.stringify(input.fotos)!==JSON.stringify(hotel.fotos)&&req.headers['if-match']!==tag())return send({codigo:'GALERIA_CAMBIADA',mensaje:'Actualiza la galería.'},409);Object.assign(hotel,input);}
   return send(hotel,200,{ETag:tag()});
  }
  if(path==='/api/v1/archivos/imagenes'){
   const form=await new Request(host,{method:'POST',body:data,headers:{'Content-Type':req.headers['content-type']}}).formData();if(form.get('uso')!=='HOTEL')return send({},400);const key='hotel/'+randomUUID()+'.png';objects.set(key,Buffer.from(await form.get('archivo').arrayBuffer()));return send({clave:key},201);
  }
  if(path==='/api/v1/publico/hotel')return send({nombre:hotel.nombre,descripcion:hotel.descripcion,fotos:hotel.fotos.map(f=>host+'/'+f.clave),ubicacion:{direccion:hotel.direccion},contacto:{telefono:hotel.telefono,correo:hotel.correo},horaCheckIn:'15:00',horaCheckOut:'12:00'});
  const match=path.match(/^\/api\/v1\/(admin|publico)\/hotel\/editorial\/(es|en)(\/publicacion)?$/);
  if(match){const [,scope,lang,publish]=match;
   if(scope==='publico')return published[lang]?send(published[lang]):send({codigo:'CONTENIDO_NO_PUBLICADO',mensaje:'Sin publicación'},404);
   if(req.method==='GET')return send(drafts[lang]);
   const body=JSON.parse(data);if(body.revision!==drafts[lang].revision)return send({codigo:'CONTENIDO_CAMBIADO',mensaje:'El borrador cambió.'},409);
   if(publish){drafts[lang].revisionPublicada=body.revision;published[lang]=structuredClone(drafts[lang]);}
   else drafts[lang]={...drafts[lang],revision:body.revision+1,elementos:body.elementos};
   return send(drafts[lang]);
  }
  if(path==='/api/v1/publico/tipos-habitacion'||path.includes('/ofertas'))return send([]);
  return send({codigo:'NO_ENCONTRADO',mensaje:'Fuera del alcance de esta prueba'},404);
 }catch{return send({mensaje:'Petición de prueba inválida'},400);}
});
server.listen(3150,'127.0.0.1');
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>{server.closeAllConnections();server.close();});
