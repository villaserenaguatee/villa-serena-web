import type {components} from '@/lib/api/schema';
/** Temporary frontend adapter for API dev 8d6e7e8e8cea8847aa45601487bb73f9da6e88ac.
 * Docs 1fa07d4 lacks these fields and GET publico/reservas/intento.
 * Do not edit generated types. Replace this extension when docs is reconciled.
 */
export type CheckoutState='SIN_CHECKOUT'|'ABIERTO'|'PROCESANDO'|'PAGADO'|'VENCIDO'|'NO_VERIFICADO';
export type PaymentAction='INICIAR'|'CONTINUAR'|'ESPERAR'|'REINTENTAR'|'NINGUNA';
export type RecurrenteStatus=components['schemas']['EstadoReservaPublico'] & {mode?:string;estadoCheckout?:CheckoutState;accionPago?:PaymentAction;urlPago?:string|null;expiraEn?:string|null;pagoVenceEn?:string|null};
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
 // Compatibility with the pinned contract. Never infer a new charge from an unknown historical payment.
 return s.estadoReserva==='PENDIENTE_PAGO'&&s.puedeReintentar?(s.estadoPago==='FALLIDO'?'REINTENTAR':s.estadoPago===null&&currentRequest?'INICIAR':'ESPERAR'):'NINGUNA';
}
