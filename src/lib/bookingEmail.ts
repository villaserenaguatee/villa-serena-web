export async function bookingEmail(action: 'solicitar' | 'verificar' | 'estado' | 'actualizar', input: { correo: string; borrador: string; nombre?: string; codigo?: string; anterior?:string }, en = false) {
  let response: Response;
  try { response = await fetch('/api/publico/correo/' + action, { method: 'POST', cache: 'no-store', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(input) }); }
  catch { throw new Error(en ? 'The connection was interrupted. Your details are preserved. Check the send status before requesting another code.' : 'Se interrumpió la conexión. Conservamos tus datos. Comprueba el estado del envío antes de solicitar otro código.'); }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const code = data?.codigo;
    throw new Error(code === 'VERIFICACION_LIMITE' || response.status === 429 ? (en ? 'Wait before requesting or trying another code. Requests are limited to one per minute and three every fifteen minutes; up to five attempts.' : 'Espera antes de solicitar o probar otro código. Máximo uno por minuto y tres cada quince minutos; hasta cinco intentos.') : code === 'VERIFICACION_INVALIDA' ? (en ? 'The code is incorrect, expired or already used.' : 'El código no es correcto, venció o ya se utilizó.') : (en ? 'Verification could not be completed. Your details are preserved; try again.' : 'No se pudo completar la verificación. Conservamos tus datos; vuelve a intentarlo.'));
  }
  if (!data || typeof data !== 'object') throw new Error(en ? 'Could not confirm the server response. Your details are preserved.' : 'No se pudo confirmar la respuesta del servidor. Conservamos tus datos.');
  return data as { verificado?: boolean; estado?: string; solicitado?: boolean; reenviarEn?: number; envio?:string };
}

// Poll only the existing notification: never retry POST solicitar automatically.
export async function waitForBookingEmail(input: {correo:string;borrador:string}, en=false) {
  for(let attempt=0;attempt<20;attempt++) {
    const status=await bookingEmail('estado',input,en);
    if(status.solicitado && status.envio==='ENVIADO') return status;
    if(status.envio==='FALLIDO' || status.envio==='NINGUNO') throw new Error(en ? 'The email could not be sent. Your details are preserved.' : 'No se pudo enviar el correo. Conservamos tus datos.');
    await new Promise(resolve=>setTimeout(resolve,1500));
  }
  throw new Error(en ? 'Sending is still pending. Your details are preserved; check again without requesting another code.' : 'El envío sigue pendiente. Conservamos tus datos; comprueba de nuevo sin solicitar otro código.');
}
