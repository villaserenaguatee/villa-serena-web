'use client';
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
type Attempt={id:string;fingerprint:string};
const storage='villa-serena-contact-attempt';
export default function ContactForm(){
 const {en}=usePublicLanguage();const [name,setName]=useState(''),[email,setEmail]=useState(''),[text,setText]=useState(''),[busy,setBusy]=useState(false),[status,setStatus]=useState(''),[error,setError]=useState('');const locked=useRef(false),attempt=useRef<Attempt|null>(null);
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem(storage)??'null');if(saved&&/^[0-9a-f-]{36}$/i.test(saved.id)&&typeof saved.fingerprint==='string'){attempt.current=saved;void fetch('/api/contacto/'+saved.id,{cache:'no-store'}).then(r=>r.ok?r.json():null).then(v=>{if(v)setStatus(v.estado);}).catch(()=>{});}}catch{}},[]);
 async function check(){if(!attempt.current)return;const r=await fetch('/api/contacto/'+attempt.current.id,{cache:'no-store',signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error();const value=await r.json();setStatus(value.estado);return value.estado as string;}
 async function submit(event:FormEvent){event.preventDefault();if(locked.current||status==='INCIERTO'||status==='ENVIANDO')return;locked.current=true;setBusy(true);setError('');
  try{const input={nombre:name.trim(),correo:email.trim(),mensaje:text.trim()};if(!input.nombre||!input.correo||!input.mensaje){setError(en?'Complete your name, email and message.':'Completa tu nombre, correo y mensaje.');return;}
   const hash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(input))),fingerprint=Array.from(new Uint8Array(hash),b=>b.toString(16).padStart(2,'0')).join('');if(!attempt.current||attempt.current.fingerprint!==fingerprint)attempt.current={id:crypto.randomUUID(),fingerprint};sessionStorage.setItem(storage,JSON.stringify(attempt.current));setStatus('ENVIANDO');
   const r=await fetch('/api/contacto',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':attempt.current.id},body:JSON.stringify(input),signal:AbortSignal.timeout(45000)});const value=await r.json().catch(()=>null);if(!r.ok){if(r.status<500){setStatus('');setError(en?'Check your details and try again.':'Revisa tus datos e intenta nuevamente.');return;}throw Error();}
   setStatus(value.estado);
   if(value.estado==='ENVIANDO'){for(let n=0;n<5;n++){await new Promise(resolve=>setTimeout(resolve,1500));if(await check()!=='ENVIANDO')return;}setStatus('INCIERTO');}
  }catch{try{await check();}catch{setStatus('INCIERTO');}}finally{locked.current=false;setBusy(false);}
 }
 const notice=status==='ENVIADO'?(en?'Your message was sent to the hotel email. Thank you for contacting us.':'Tu mensaje se envió al correo del hotel. Gracias por contactarnos.'):status==='FALLIDO'?(en?'The message could not be sent. Check your connection and try again.':'No se pudo enviar el mensaje. Comprueba la conexión e intenta nuevamente.'):status==='INCIERTO'?(en?'We could not confirm delivery. Do not send the same message again; check its status below.':'No pudimos confirmar el envío. Evita enviar otra vez el mismo mensaje; consulta su estado debajo.'):status==='ENVIANDO'?(en?'Sending your message…':'Enviando tu mensaje…'):'';
 return <form data-vs-ui="compact" className="contact-compact" onSubmit={submit}><h3>{en?'Suggestions & inquiries':'Sugerencias y consultas'}</h3><label>{en?'Name':'Nombre'}<input required maxLength={150} autoComplete="name" value={name} disabled={busy} onChange={e=>setName(e.target.value)}/></label><label>{en?'Email':'Correo'}<input required type="email" maxLength={150} autoComplete="email" value={email} disabled={busy} onChange={e=>setEmail(e.target.value)}/></label><label>{en?'Message':'Mensaje'}<textarea required maxLength={5000} value={text} disabled={busy} onChange={e=>setText(e.target.value)}/></label>
 <button className="gold-button" disabled={busy||status==='ENVIANDO'||status==='INCIERTO'}>{busy?(en?'Sending…':'Enviando…'):(en?'Send message':'Enviar mensaje')}</button>
 {error&&<p role="alert">{error}</p>}{notice&&<p role={status==='FALLIDO'||status==='INCIERTO'?'alert':'status'} className="break-words text-sm">{notice}</p>}
 {(status==='INCIERTO'||status==='ENVIANDO')&&<button type="button" disabled={busy} className="forgot-link" onClick={()=>{setBusy(true);void check().catch(()=>setStatus('INCIERTO')).finally(()=>setBusy(false));}}>{en?'Check delivery status':'Consultar estado del envío'}</button>}
 </form>;
}
