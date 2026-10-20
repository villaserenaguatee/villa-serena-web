import { createPublicReservation, startPublicPayment, getPublicStatus, recoverPublicAttempt, PublicApiError } from '@/lib/api/public';
import { bookingAttempt, finishBookingAttempt, readBookingDraft, activeBookingDraft, bookingReceipt, BookingAttemptPendingError } from '@/lib/bookingDraft';
import { publicSearchError } from '@/lib/publicStayValidation';
import type { CreatePublicDto } from '@/lib/bff/contracts/public';
import { checkoutUrl } from '@/lib/checkoutUrl';
import { paymentView } from '@/lib/paymentResult';

async function preparePayment(params: URLSearchParams, draftId: string, recover = false): Promise<string> {
  const previous = readBookingDraft(draftId)?.attempt;
  if(recover||previous)return recoverPublicBookingAttempt(draftId);
  let input: CreatePublicDto & {ofertaSlug?:string};
  /* Recovery uses the same active form; SHA-256 below rejects any changed payload. */
  {
    const reason = publicSearchError(params.get('llegada') || '', params.get('salida') || '', Number(params.get('adultos')), Number(params.get('ninos')), 5);
    if (reason) throw new Error(reason);
    input = { ofertaSlug: params.get('slug') || undefined, tipoHabitacionId: Number(params.get('tipoHabitacionId')), entrada: params.get('llegada') || '', salida: params.get('salida') || '',
      numeroHuespedes: Number(params.get('adultos')) + Number(params.get('ninos')), huesped: {
        nombreCompleto: `${params.get('nombre') || ''} ${params.get('apellidos') || ''}`.trim(), correo: params.get('correo') || '',
        telefono: params.get('telefono') || '', tipoDocumento: 'DPI',
        numeroDocumento: params.get('documento') || '',
      } };
  }
  const attempt = await bookingAttempt(draftId, JSON.stringify({ flow: 'recurrente', input }));
  const action = recover ? 'recover-payment' : 'continue-payment';
  // Reintento manual con la misma identidad. Un regreso al resumen nunca crea otra reserva por sí solo.
  let code: string | undefined;
  if (!code) {
    try {
      const created = await createPublicReservation(input, attempt, draftId, action);
      if (created.estado !== 'PENDIENTE_PAGO' || !Number.isFinite(created.total) || created.total <= 0) throw new Error('La reserva recibida no es válida.');
      code = created.codigo;
    } catch (error) {
      if (error instanceof PublicApiError && error.status && error.status < 500 && ['DATOS_INVALIDOS', 'SIN_DISPONIBILIDAD', 'ORIGIN_FORBIDDEN', 'CORREO_NO_VERIFICADO'].includes(error.code || ''))
        finishBookingAttempt(draftId, attempt);
      throw error;
    }
  }
  if (!/^VS-[A-Z0-9]{6}$/.test(code)) throw new Error('La respuesta de reserva no es válida.');
  finishBookingAttempt(draftId, attempt, code);
  if(readBookingDraft(draftId)?.attempt?.id!==attempt) throw new BookingAttemptPendingError('The draft was discarded; consult the existing request');
  const payment = await startPublicPayment(code, action);
  if(readBookingDraft(draftId)?.attempt?.id!==attempt) throw new BookingAttemptPendingError('The draft was discarded; consult the existing request');
  return checkoutUrl(payment.urlPago, payment.mode, window.location.origin, code);
}

const inFlight=new Map<string,{parameters:string;promise:Promise<string>}>();
export function preparePublicBookingPayment(params:URLSearchParams,draftId:string,recover=false):Promise<string>{
 const parameters=params.toString(),pending=inFlight.get(draftId);
 if(pending){if(pending.parameters!==parameters)return Promise.reject(new BookingAttemptPendingError('Hay una solicitud en curso. Espera antes de cambiar los datos.'));return pending.promise;}
 const promise=preparePayment(params,draftId,recover).finally(()=>inFlight.delete(draftId));
 inFlight.set(draftId,{parameters,promise});return promise;
}

const recovering=new Map<string,Promise<string>>();
/** Only GETs: a lost creation response must never be recovered by creating again. */
export function recoverPublicBookingAttempt(draftId?:string):Promise<string>{
 const draft=activeBookingDraft(),receipt=bookingReceipt();
 const source=draft?.attempt&&(!draftId||draft.id===draftId)?{draftId:draft.id,attemptId:draft.attempt.id,code:draft.attempt.code,flow:draft.attempt.flow,origin:draft.attempt.origin??(new URLSearchParams(draft.params).get('slug')?'OFERTA':'RESERVA')}:receipt;
 if(!source||draftId&&source.draftId!==draftId)return Promise.reject(new BookingAttemptPendingError('No encontramos la solicitud anterior en este navegador. Contacta a Recepción antes de reservar otra vez.'));
 if(source.flow==='stripe'&&source.code&&/^VS-[A-Z0-9]{6}$/.test(source.code))return Promise.resolve('/reserva/resultado?codigo='+encodeURIComponent(source.code));
 const key=source.draftId+':'+source.attemptId;
 const existing=recovering.get(key);if(existing)return existing;
 const task=(async()=>{
  try{
   if(!source.code&&(source.flow!=='recurrente'||!['RESERVA','OFERTA'].includes(source.origin??'')))throw new BookingAttemptPendingError('No podemos recuperar automáticamente esta solicitud anterior. Contacta a Recepción.');
   const state=source.code?await getPublicStatus(source.code):await recoverPublicAttempt(source.attemptId,source.draftId,source.origin as 'RESERVA'|'OFERTA');
   if(!/^VS-[A-Z0-9]{6}$/.test(state.codigo))throw Error('La respuesta de reserva no es válida.');
   paymentView(state,source.code??state.codigo);
   finishBookingAttempt(source.draftId,source.attemptId,state.codigo);
   return '/reserva/resultado?codigo='+encodeURIComponent(state.codigo);
  }catch(e){
   if(e instanceof PublicApiError)throw new BookingAttemptPendingError(e.code==='SOLICITUD_EN_PROCESO'?'Tu solicitud sigue en proceso. Espera y vuelve a consultar.':e.status===403||e.status===404?'No pudimos recuperar tu solicitud. Verifica de nuevo el mismo correo o contacta a Recepción antes de reservar otra vez.':'No pudimos consultar tu solicitud. Conservamos sus datos; vuelve a consultar antes de reservar o pagar.');
   throw e;
  }
 })().finally(()=>recovering.delete(key));recovering.set(key,task);return task;
}
