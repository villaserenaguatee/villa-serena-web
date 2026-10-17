"use client";
import {useEffect,useRef,useState,type FormEvent} from 'react';
import {useSearchParams} from 'next/navigation';
import Link from 'next/link';
import {Eye,EyeOff,Mail,LockKeyhole,ArrowLeft} from 'lucide-react';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
export default function UnifiedLogin({initialStaff=false,reservationCode}:{initialStaff?:boolean;reservationCode?:string}){
 const {en}=usePublicLanguage(),params=useSearchParams();
 const [email,setEmail]=useState(''),[credential,setCredential]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const [codeNotice,setCodeNotice]=useState(''),[codeError,setCodeError]=useState(''),[recoveryNotice,setRecoveryNotice]=useState(''),[recoveryError,setRecoveryError]=useState(''),[recoveryWait,setRecoveryWait]=useState(0);
 const recoveryAttempt=useRef<{email:string;id:string}|null>(null);
 const [panel,setPanel]=useState<'login'|'code'|'recovery'>('login'),[codeWait,setCodeWait]=useState(0);
 const restored=useRef(false);
 useEffect(()=>{try{const saved=JSON.parse(sessionStorage.getItem('vs-login-request')??'null');if(saved&&saved.expires>Date.now()){setEmail(typeof saved.email==='string'?saved.email:'');if(['code','recovery'].includes(saved.panel))setPanel(saved.panel);setCodeWait(Math.max(0,Math.ceil((saved.codeUntil-Date.now())/1000)||0));setRecoveryWait(Math.max(0,Math.ceil((saved.recoveryUntil-Date.now())/1000)||0));if(saved.attempt?.email&&saved.attempt?.id)recoveryAttempt.current=saved.attempt;}else sessionStorage.removeItem('vs-login-request');}catch{}restored.current=true;},[]);
 useEffect(()=>{if(!restored.current)return;try{sessionStorage.setItem('vs-login-request',JSON.stringify({email,panel,expires:Date.now()+10*60*1000,codeUntil:Date.now()+codeWait*1000,recoveryUntil:Date.now()+recoveryWait*1000,attempt:recoveryAttempt.current}));}catch{}},[email,panel,codeWait,recoveryWait]);
 useEffect(()=>{if(!codeWait)return;const timer=setTimeout(()=>setCodeWait(v=>Math.max(0,v-1)),1000);return()=>clearTimeout(timer);},[codeWait]);
 useEffect(()=>{if(!recoveryWait)return;const timer=setTimeout(()=>setRecoveryWait(v=>Math.max(0,v-1)),1000);return()=>clearTimeout(timer);},[recoveryWait]);
 const lock=useRef(false),attempt=useRef<{email:string;credential:string;key:string}|null>(null);
 async function submit(event:FormEvent){event.preventDefault();if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');
  try{let current=attempt.current;if(!current||current.email!==email||current.credential!==credential)current={email,credential,key:crypto.randomUUID()};attempt.current=current;
   const r=await fetch('/api/auth/iniciar-sesion',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':current.key},body:JSON.stringify({correo:email,credencial:credential})});const value=await r.json().catch(()=>null);
   if(!r.ok){if(r.status<500)attempt.current=null;throw Error(en?'Could not sign in. Check your details or request a new code.':'No se pudo iniciar sesión. Revisa tus datos o solicita un nuevo código.');}
   const allowed=['/portal','/admin','/recepcion','/room-service','/mantenimiento','/limpieza','/panel/cambiar-contrasena'];if(!allowed.includes(value?.destino))throw Error(en?'Access could not be confirmed.':'No se pudo confirmar el acceso.');
   attempt.current=null;setCredential('');try{sessionStorage.removeItem('vs-login-request');}catch{}const code=reservationCode??params.get('codigo');window.location.assign(value.destino==='/portal'&&code?`/portal?codigo=${encodeURIComponent(code)}`:value.destino);
  }catch(e){setError(e instanceof TypeError?(en?'Could not connect. Try again.':'No se pudo conectar. Intenta nuevamente.'):e instanceof Error?e.message:(en?'Access could not be confirmed.':'No se pudo confirmar el acceso.'));}finally{lock.current=false;setBusy(false);}
 }
 async function requestCode(event:FormEvent){event.preventDefault();if(lock.current||codeWait)return;lock.current=true;setBusy(true);setCodeWait(60);setCodeError('');setCodeNotice('');
  try{const r=await fetch('/api/app/acceso/solicitar-codigo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo:email.trim()})});if(!r.ok)throw Error(en?'Could not request a code. Wait before trying again.':'No se pudo solicitar el código. Espera antes de volver a intentarlo.');setCodeNotice(en?'If the email has a reservation, you will receive an access code.':'Si el correo tiene una reserva, recibirás un código de acceso.');setCredential('');attempt.current=null;}catch{setCodeError(en?'Could not request a code. Wait before trying again.':'No se pudo solicitar el código. Espera antes de volver a intentarlo.');}finally{lock.current=false;setBusy(false);}
 }
 async function requestRecovery(event:FormEvent){event.preventDefault();if(lock.current||recoveryWait)return;lock.current=true;setBusy(true);setRecoveryWait(60);setRecoveryError('');setRecoveryNotice('');
  try{const normalized=email.trim().toLowerCase();if(recoveryAttempt.current?.email!==normalized)recoveryAttempt.current={email:normalized,id:crypto.randomUUID()};
   const r=await fetch('/api/auth/recuperacion/solicitar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({correo:normalized,solicitud:recoveryAttempt.current.id})});
   if(!r.ok)throw Error();setRecoveryNotice(en?'If the email belongs to an active staff account, you will receive a link to reset your password.':'Si el correo corresponde a una cuenta activa del personal, recibirás un enlace para restablecer tu contraseña.');setRecoveryWait(60);recoveryAttempt.current=null;
  }catch{setRecoveryError(en?'Could not request the link. Wait before trying again.':'No se pudo solicitar el enlace. Espera antes de volver a intentarlo.');}finally{lock.current=false;setBusy(false);}
 }
 return <main className="login-overlay-page guest-code-login"><div className="login-overlay-bg"/>{panel==='login'?<Link href="/" className="floating-back icon-back" aria-label={en?'Back':'Volver'}><ArrowLeft size={20}/></Link>:<button type="button" disabled={busy} className="floating-back icon-back" aria-label={en?'Back to sign in':'Volver a iniciar sesión'} onClick={()=>{setPanel('login');setCredential('');setError('');}}><ArrowLeft size={20}/></button>}<section className="floating-login-card"><VillaSerenaLogo href="/"/><form onSubmit={panel==='code'?requestCode:panel==='recovery'?requestRecovery:submit}>
  <h1>{panel==='code'?(en?'Access code':'Código de acceso'):panel==='recovery'?(en?'Reset your password':'Recuperar contraseña'):(en?'Sign in':'Iniciar sesión')}</h1>
  <label>{en?'Email':'Correo electrónico'}<div className="input-icon"><Mail size={17}/><input type="email" required autoComplete="username" value={email} onChange={e=>{setEmail(e.target.value);setCodeNotice('');setCodeError('');setRecoveryNotice('');setRecoveryError('');}} disabled={busy}/></div></label>
  {panel==='login'&&<label>{en?'Password or access code':'Contraseña o código de acceso'}<div className="input-icon"><LockKeyhole size={17}/><input type={show?'text':'password'} required autoComplete="current-password" maxLength={256} value={credential} onChange={e=>setCredential(e.target.value)} disabled={busy}/><button type="button" disabled={busy} aria-label={show?(en?'Hide credential':'Ocultar credencial'):(en?'Show credential':'Mostrar credencial')} onClick={()=>setShow(!show)}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>}
  {error&&<div className="login-error" role="alert">{error}</div>}{message&&<p role="status">{message}</p>}
  <button className="login-submit" disabled={busy||(panel==='code'&&codeWait>0)||(panel==='recovery'&&recoveryWait>0)}>{busy?(panel==='login'?(en?'Please wait…':'Espera…'):(en?'Sending…':'Enviando…')):panel==='code'?(en?'Send code':'Enviar código'):panel==='recovery'?(en?'Send link':'Enviar enlace'):(en?'Sign in':'Iniciar sesión')}</button>
  {panel==='code'&&<div className="unified-login-option">{codeNotice&&<p role="status">{codeNotice}</p>}{codeError&&<p role="alert">{codeError}</p>}{codeWait>0&&<p role="status">{en?'You can request another code in':'Puedes solicitar otro código en'} {codeWait}s.</p>}{codeNotice&&<button type="button" className="forgot-link" onClick={()=>setPanel('login')}>{en?'Back to sign in':'Volver a iniciar sesión'}</button>}</div>}
  {panel==='recovery'&&<div className="unified-login-option">{recoveryNotice&&<p role="status">{recoveryNotice}</p>}{recoveryError&&<p role="alert">{recoveryError}</p>}{recoveryWait>0&&<p role="status">{en?'You can request another link in':'Puedes solicitar otro enlace en'} {recoveryWait}s.</p>}</div>}
  {panel==='login'&&<div className="unified-login-options"><div className="unified-login-option"><button type="button" className="forgot-link" disabled={busy} onClick={()=>{setPanel('code');setError('');}}>{en?'Request an access code':'Solicitar código de acceso'}</button></div><div className="unified-login-option"><button type="button" className="forgot-link" disabled={busy} onClick={()=>{setPanel('recovery');setError('');}}>{en?'Forgot your password?':'¿Olvidaste tu contraseña?'}</button></div></div>}
 </form></section></main>;
}
