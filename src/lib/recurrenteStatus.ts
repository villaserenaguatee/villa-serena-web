import type {components} from '@/lib/api/schema';
export type CheckoutState=components['schemas']['EstadoCheckout'];
export type PaymentAction=components['schemas']['AccionPago'];
// Read older responses defensively; new API fields come exclusively from docs.
export type RecurrenteStatus=Pick<components['schemas']['EstadoReservaPublico'],'codigo'|'estadoReserva'|'estadoPago'|'puedeReintentar'> & Partial<components['schemas']['EstadoReservaPublico']> & {mode?:string};
export function paymentAction(s:RecurrenteStatus,currentRequest=false):PaymentAction{
 const extended=['estadoCheckout','accionPago','urlPago','expiraEn','pagoVenceEn'].some(k=>k in s);
 if(extended){
  if(!['SIN_CHECKOUT','ABIERTO','PROCESANDO','PAGADO','VENCIDO','NO_VERIFICADO'].includes(s.estadoCheckout??'')||!['INICIAR','CONTINUAR','ESPERAR','REINTENTAR','NINGUNA'].includes(s.accionPago??''))throw Error('No se pudo interpretar el estado del pago. Consulta nuevamente.');
  for(const key of ['expiraEn','pagoVenceEn'] as const)if(s[key]!==null&&(typeof s[key]!=='string'||!Number.isFinite(Date.parse(s[key]!))))throw Error('Respuesta de pago no válida.');
  if(s.urlPago!==null&&typeof s.urlPago!=='string')throw Error('Respuesta de pago no válida.');
  const action=s.accionPago!;
  if(s.estadoReserva!=='PENDIENTE_PAGO'&&action!=='NINGUNA')throw Error('El pago necesita verificarse. Consulta nuevamente.');
  if(action==='CONTINUAR'&&(s.estadoCheckout!=='ABIERTO'||!s.urlPago))throw Error('No se pudo recuperar el enlace de pago.');
  if(action==='INICIAR'&&(s.estadoCheckout!=='SIN_CHECKOUT'||s.estadoPago!==null))throw Error('El pago necesita verificarse.');
  if(action==='REINTENTAR'&&(s.estadoCheckout!=='VENCIDO'||!s.puedeReintentar))throw Error('No se autorizó otro intento de pago.');
  if(s.puedeReintentar!==(action==='REINTENTAR'))throw Error('El pago necesita verificarse.');
  return action;
 }
 // Older responses must never authorize a new charge from an unknown historical payment.
 return s.estadoReserva==='PENDIENTE_PAGO'&&s.puedeReintentar?(s.estadoPago==='FALLIDO'?'REINTENTAR':s.estadoPago===null&&currentRequest?'INICIAR':'ESPERAR'):'NINGUNA';
}
