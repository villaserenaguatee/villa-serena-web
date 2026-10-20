'use client';
import { useEffect, useState } from 'react';
import { getReservation } from '@/lib/api/reception';
type Snapshot={revision:string;codigoReserva:string;huespedId:number;nombreHuesped:string;correo:string;html:string;asunto:string;fotoUrl:string|null};
const input='w-full rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]';
export default function ReintentoObjetoIncierto({id,intentos,onResult}:{id:number;intentos:number;onResult:()=>Promise<void>}){
 const [saved,setSaved]=useState<Snapshot|null>(null),[selected,setSelected]=useState(false),[correo,setCorreo]=useState('');
 const [recipient,setRecipient]=useState(false),[reviewed,setReviewed]=useState(false),[risk,setRisk]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{let alive=true;void fetch(`/api/objetos/${id}/aviso`,{cache:'no-store'}).then(async response=>{const body=await response.json();if(!response.ok)throw Error(body.mensaje);if(alive)setSaved(body);}).catch(e=>{if(alive)setError(e.message);});return()=>{alive=false;};},[id]);
 async function choose(value:string){setSelected(false);setRecipient(false);setReviewed(false);setRisk(false);setError('');if(!value||!saved)return;setBusy(true);try{const real=await getReservation(value);if(real.huesped.id!==saved.huespedId||real.huesped.correo.toLowerCase()!==saved.correo.toLowerCase())throw Error('Los datos actuales no coinciden con el aviso. No se enviará.');setCorreo(real.huesped.correo);setSelected(true);}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar la reserva.');}finally{setBusy(false);}}
 async function send(){if(!saved)return;setBusy(true);setError('');try{
  const response=await fetch(`/api/objetos/${id}/reintentar-incierto`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:saved.revision,intentos,codigoReserva:saved.codigoReserva,huespedId:saved.huespedId,correo,destinatarioConfirmado:recipient,mensajeConfirmado:reviewed,aceptoPosibleDuplicado:risk})});
  const body=await response.json();if(!response.ok)throw Error(body.mensaje);await onResult();
 }catch(e){setError(e instanceof Error?e.message:'No se pudo solicitar el reintento.');}finally{setBusy(false);}}
 return <section className="mt-5 space-y-4 border-t border-[#E5E0D8] pt-4">
  <h3 className="text-lg font-semibold">Revisar un único reintento</h3>
  <p className="rounded-lg border border-[#F3D98B] bg-[#FFFBEF] p-3 text-sm">El resultado anterior es incierto. El mensaje podría llegar duplicado si el servidor aceptó el primer intento. No se enviará nada sin tu confirmación explícita.</p>
  {saved&&<><label className="block text-sm">Reserva y huésped del aviso guardado<select aria-label="Reserva y huésped del aviso guardado" className={input} defaultValue="" disabled={busy} onChange={e=>void choose(e.target.value)}><option value="">Selecciona y comprueba el destinatario</option><option value={saved.codigoReserva}>{saved.nombreHuesped} · {saved.codigoReserva}</option></select></label>
  {selected&&<><p className="text-sm">Huésped: <strong>{saved.nombreHuesped}</strong></p><label className="block text-sm">Correo confirmado<input type="email" readOnly value={correo} className={input}/></label><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={recipient} onChange={e=>setRecipient(e.target.checked)}/>He confirmado el huésped, su reserva y este correo.</label>
  <p className="text-sm"><strong>Asunto:</strong> {saved.asunto}</p><iframe title="Aviso guardado que se reenviará" sandbox="allow-same-origin" srcDoc={saved.html} className="h-[800px] w-full rounded-lg border border-[#E5E0D8]"/>
  {!saved.fotoUrl&&<p className="text-sm text-[#52677F]">Este aviso no incluye fotografía. Se conserva el contenido original.</p>}
  <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={reviewed} onChange={e=>setReviewed(e.target.checked)}/>He revisado el mensaje y la fotografía, si la incluye.</label>
  <label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={risk} onChange={e=>setRisk(e.target.checked)}/>Acepto que podría llegar duplicado y autorizo un único reintento de este aviso.</label>
  <button className="rounded-lg bg-[#18345C] px-4 py-2.5 font-semibold text-white disabled:opacity-40" disabled={busy||!recipient||!reviewed||!risk} onClick={()=>void send()}>Confirmar un único reintento</button></>}</>}
  {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
 </section>;
}
