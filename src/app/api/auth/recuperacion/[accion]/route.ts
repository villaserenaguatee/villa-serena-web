import {NextRequest,NextResponse} from 'next/server';
import {sameOrigin,readAuthJson,authError} from '@/lib/bff/auth/http';
import {AuthError} from '@/lib/bff/auth/errors';
export const runtime='nodejs';
export async function POST(request:NextRequest,{params}:{params:Promise<{accion:string}>}){
 try{
  sameOrigin(request);const {accion}=await params;
  if(!['solicitar','confirmar'].includes(accion))throw new AuthError('RUTA_INVALIDA',404,'Ruta no disponible.');
  const input=await readAuthJson(request,accion==='solicitar'?['correo','solicitud']:['token','contrasenaNueva','confirmacion']);
  if(accion==='solicitar')input.correo=input.correo.trim();
  if(!process.env.API_URL||process.env.STAFF_AUTH_MODE!=='spring')throw new AuthError('CONFIGURACION_INVALIDA',503,'El servicio no está disponible.');
  let upstream:Response;try{upstream=await fetch(new URL(`/api/v1/app/acceso/recuperacion/${accion}`,process.env.API_URL),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),cache:'no-store',redirect:'error',signal:AbortSignal.timeout(20000)});}catch{throw new AuthError('API_NO_DISPONIBLE',502,'No se pudo completar la solicitud. Intenta nuevamente.');}
  if(!upstream.ok){
   if(upstream.status===429)throw new AuthError('RECUPERACION_LIMITE',429,'Espera antes de volver a intentarlo.');
   throw new AuthError('RECUPERACION_INVALIDA',upstream.status>=500?502:400,accion==='solicitar'?'Revisa el correo e intenta nuevamente.':'El enlace no es válido, ha vencido o la nueva contraseña no cumple los requisitos.');
  }
  return new NextResponse(null,{status:accion==='solicitar'?202:204,headers:{'Cache-Control':'no-store'}});
 }catch(error){return authError(error);}
}
