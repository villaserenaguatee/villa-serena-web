import {createServer} from 'node:http';
// Fixture aislado: las pruebas del API verifican estas reglas con PostgreSQL real.
const employee={id:9,nombre:'Recepción de prueba',correo:'recepcion@example.invalid',rol:'RECEPCION',area:null,debeCambiarContrasena:false};
const details=[['VS-CHAT01','EN_ESTADIA','Ana de prueba','101'],['VS-CHAT02','EN_ESTADIA','Beatriz de prueba','202'],['VS-CHAT03','FINALIZADA','Carlos de prueba','303'],['VS-CHAT04','FINALIZADA','Sin historial','304']].map(([codigo,estado,nombreCompleto,numero],i)=>({codigo,estado,historial:[{estadoNuevo:'EN_ESTADIA',fechaHora:'2026-10-21T15:00:00Z'},...estado==='FINALIZADA'?[{estadoNuevo:'FINALIZADA',fechaHora:'2026-10-24T15:00:00Z'}]:[]],habitacion:{id:i+1,numero},huesped:{id:i+1,nombreCompleto,correo:'guest'+i+'@example.invalid',telefono:'55551234',numeroDocumento:'1234567890123',tipoDocumento:'DPI'},tipoHabitacion:{nombre:'Categoría'},entrada:'2026-10-21',salida:'2026-10-24',numeroHuespedes:1,creadaEn:'2026-10-20T12:00:00Z'}));
let messages,preferences;
function reset(){preferences=Object.fromEntries(details.map(d=>[d.codigo,{codigo:d.codigo,favorita:false,archivada:false,eliminada:false,ultimoId:d.codigo==='VS-CHAT01'?3:d.codigo==='VS-CHAT03'?4:0,noLeidos:d.codigo==='VS-CHAT01'?1:0}]));messages={
 'VS-CHAT01':[{id:1,autor:'RECEPCION',texto:'Mensaje propio',creadoEn:'2026-10-22T12:00:00Z',version:0,puedeModificar:true,eliminado:false},{id:2,autor:'RECEPCION',texto:'Mensaje de otro empleado',creadoEn:'2026-10-22T12:01:00Z',version:0,puedeModificar:false,eliminado:false},{id:3,autor:'HUESPED',texto:'Consulta del huésped',creadoEn:'2026-10-22T12:02:00Z',version:0,puedeModificar:false,eliminado:false}],
 'VS-CHAT02':[], 'VS-CHAT03':[{id:4,autor:'RECEPCION',texto:'Historial cerrado',creadoEn:'2026-10-22T12:00:00Z',version:0,puedeModificar:false,eliminado:false}], 'VS-CHAT04':[]};}
reset();
const server=createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:3049'),path=url.pathname,send=(status,value)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(value));};
 if(path==='/health')return send(200,{ok:true});
 if(path==='/__test/reset'&&req.method==='POST'){reset();return send(200,{ok:true});}
 if(path==='/api/v1/auth/login'&&req.method==='POST')return send(200,{accessToken:'chat-staff-fixture',refreshToken:'chat-refresh-fixture',tipoToken:'Bearer',expiraEn:900,empleado:employee});
 if(req.headers.authorization!=='Bearer chat-staff-fixture')return send(401,{mensaje:'Sesión requerida'});
 if(path==='/api/v1/auth/yo')return send(200,employee);
 if(path==='/api/v1/estancias/chat-preferencias')return send(200,Object.values(preferences));
 const prefMatch=path.match(/^\/api\/v1\/estancias\/(VS-CHAT0[1-4])\/chat-preferencias$/);
 if(prefMatch&&req.method==='POST'){let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw),pref=preferences[prefMatch[1]];if(body.accion==='leido')pref.noLeidos=0;else if(body.accion==='eliminar')pref.eliminada=true;else pref[body.accion]=body.valor;return send(200,{codigo:pref.codigo});}
 if(path==='/api/v1/reservas'){const rows=details.filter(d=>d.estado===url.searchParams.get('estado'));const page=Number(url.searchParams.get('page')??0);return send(200,{contenido:rows.slice(page,page+1).map(d=>({codigo:d.codigo})),totalPaginas:rows.length});}
 const detail=details.find(d=>path==='/api/v1/reservas/'+d.codigo);if(detail)return send(200,detail);
 const match=path.match(/^\/api\/v1\/estancias\/(VS-CHAT0[1-4])\/chat(?:\/(\d+))?$/);
 if(match){const code=match[1],rows=messages[code];if(req.method==='GET')return send(200,rows);
  let raw='';for await(const chunk of req)raw+=chunk;const body=JSON.parse(raw||'{}'),row=rows.find(m=>m.id===Number(match[2]));if(!row)return send(404,{mensaje:'Mensaje no encontrado'});if(row.id!==1)return send(403,{mensaje:'Solo puede modificar sus propios mensajes.'});if(details.find(d=>d.codigo===code).estado!=='EN_ESTADIA')return send(409,{mensaje:'La estancia terminó.'});if(row.version!==body.version)return send(409,{mensaje:'El mensaje cambió.'});
  if(req.method==='PUT'){row.texto=body.texto;row.editadoEn=new Date().toISOString();row.version++;return send(200,row);}if(req.method==='DELETE'){row.texto='';row.eliminado=true;row.puedeModificar=false;row.version++;return send(200,row);}
 }
 return send(404,{mensaje:'Operación no disponible en este servicio aislado'});
});
server.listen(3049,'127.0.0.1');process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
