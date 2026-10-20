import {NextRequest,NextResponse} from 'next/server';
import {sameOrigin,readAuthJson,writeCookies,authError} from '@/lib/bff/auth/http';
import {serverTokens,publicEmployee} from '@/lib/bff/auth/response';
import {guestRoute,writeGuestCookies} from '@/lib/bff/guestAccess';
import {authProvider} from '@/lib/bff/auth/provider';
import {AuthError} from '@/lib/bff/auth/errors';
import {staffHome} from '@/lib/auth/staff-contract';
export const runtime='nodejs';
export async function POST(request:NextRequest){
 try{
  sameOrigin(request);const input=await readAuthJson(request,['correo','credencial']);const key=request.headers.get('Idempotency-Key');
  if(!key||!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key))throw new AuthError('DATOS_INVALIDOS',400,'Revisa los datos de acceso.');
  if(process.env.STAFF_AUTH_MODE==='demo' && process.env.GUEST_AUTH_MODE==='demo'){
   if(/^\d{6}$/.test(input.credencial)){
    const verified=await guestRoute(new NextRequest(new URL('/api/app/acceso/verificar-codigo',request.url),{method:'POST',headers:request.headers,body:JSON.stringify({correo:input.correo,codigo:input.credencial})}),['acceso','verificar-codigo']);
    if(!verified.ok)return verified;
    const response=writeCookies(NextResponse.json({destino:'/portal'}),request);
    for(const cookie of verified.cookies.getAll())response.cookies.set(cookie);
    return response;
   }
   const session=await authProvider().login({correo:input.correo,contrasena:input.credencial});
   return writeGuestCookies(writeCookies(NextResponse.json({destino:session.empleado.debeCambiarContrasena?'/panel/cambiar-contrasena':staffHome(session.empleado)}),request,session),request);
  }
  if(process.env.STAFF_AUTH_MODE!=='spring'||process.env.GUEST_AUTH_MODE!=='spring'||!process.env.API_URL)throw new AuthError('CONFIGURACION_INVALIDA',503,'El acceso conectado no está configurado.');
  let upstream:Response;try{upstream=await fetch(new URL('/api/v1/app/acceso/iniciar-sesion',process.env.API_URL),{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(input),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(30000)});}catch{throw new AuthError('API_NO_DISPONIBLE',502,'No se pudo confirmar el acceso. Reintenta.');}
  if(upstream.status===429)throw new AuthError('LIMITE_SOLICITUDES',429,'Demasiados intentos. Espera antes de volver a intentarlo.',upstream.headers.get('retry-after')??undefined);
  if(!upstream.ok)throw new AuthError('ACCESO_INVALIDO',upstream.status>=500?502:401,'No se pudo iniciar sesión. Revisa tus datos o solicita un nuevo código.');
  const value=await upstream.json(),tokens=serverTokens(value);
  if(value.empleado){const employee=publicEmployee(value.empleado);return writeGuestCookies(writeCookies(NextResponse.json({destino:employee.debeCambiarContrasena?'/panel/cambiar-contrasena':staffHome(employee)}),request,tokens),request);}
  return writeGuestCookies(writeCookies(NextResponse.json({destino:'/portal'}),request),request,{access:tokens.accessToken,refresh:tokens.refreshToken,expiresIn:tokens.expiraEn});
 }catch(error){return authError(error);}
}
