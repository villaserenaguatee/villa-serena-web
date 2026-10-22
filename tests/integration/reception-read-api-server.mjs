import {createServer} from 'node:http';
// Isolated test identity, never an account in Spring or PostgreSQL.
const employee={id:9,nombre:'Administración de prueba',correo:'admin@villaserena.gt',rol:'RECEPCION',area:null,debeCambiarContrasena:false};
const server=createServer(async(request,response)=>{
 const send=(status,value)=>{response.writeHead(status,{'Content-Type':'application/json'});response.end(JSON.stringify(value));};
 const path=new URL(request.url,'http://127.0.0.1:3049').pathname;
 if(path==='/health')return send(200,{ok:true});
 if(path==='/api/v1/auth/login'&&request.method==='POST')return send(200,{accessToken:'isolated-admin-session',refreshToken:'isolated-admin-refresh',tipoToken:'Bearer',expiraEn:900,empleado:employee});
 if(request.headers.authorization!=='Bearer isolated-admin-session')return send(401,{codigo:'NO_AUTENTICADO',mensaje:'Acceso de prueba requerido'});
 if(path==='/api/v1/auth/yo')return send(200,employee);
 // Report requests are intercepted by Playwright; unexpected requests fail.
 return send(404,{codigo:'RUTA_NO_PREVISTA',mensaje:'Operación no prevista en esta prueba aislada'});
});
server.listen(3049,'127.0.0.1');
process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
