"use client";
import {useEffect,useRef,useState,type FormEvent} from 'react';
import Link from 'next/link';
import {ArrowLeft,Eye,EyeOff,LockKeyhole} from 'lucide-react';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
export default function PasswordRecovery(){
 const {en}=usePublicLanguage();const [token,setToken]=useState(''),[ready,setReady]=useState(false),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState(''),[show,setShow]=useState(false),[busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState('');const lock=useRef(false);
 const initialized=useRef(false);
 useEffect(()=>{if(initialized.current)return;initialized.current=true;setToken(new URLSearchParams(location.hash.slice(1)).get('token')??'');setReady(true);history.replaceState(null,'',location.pathname+location.search);},[]);
 async function submit(e:FormEvent){e.preventDefault();if(lock.current)return;setError('');
  if(password!==confirmation||password.length<8||new TextEncoder().encode(password).length>72||!/[\p{L}]/u.test(password)||!/[0-9]/.test(password)){setError(en?'Use at least 8 characters, including a letter and a number (maximum 72 bytes). Both passwords must match.':'Usa al menos 8 caracteres, una letra y un número (máximo 72 bytes). Ambas contraseñas deben coincidir.');return;}
  lock.current=true;setBusy(true);try{
   const r=await fetch('/api/auth/recuperacion/confirmar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token,contrasenaNueva:password,confirmacion:confirmation})});
   if(!r.ok)throw Error(r.status===429?(en?'Wait before trying again.':'Espera antes de volver a intentarlo.'):(en?'The link is invalid or expired, or the password does not meet the requirements.':'El enlace no es válido, ha vencido o la contraseña no cumple los requisitos.'));
   setPassword('');setConfirmation('');setToken('');setDone(true);
  }catch(e){setError(e instanceof Error?e.message:(en?'Could not save your password. Try again.':'No se pudo guardar la contraseña. Intenta nuevamente.'));}finally{lock.current=false;setBusy(false);}
 }
 return <main className="login-overlay-page guest-code-login"><div className="login-overlay-bg"/><Link href="/login" className="floating-back icon-back" aria-label={en?'Back':'Volver'}><ArrowLeft size={20}/></Link><section className="floating-login-card"><VillaSerenaLogo href="/"/><form onSubmit={submit}><h1>{en?'New password':'Nueva contraseña'}</h1>
 {done?<><p role="status">{en?'Your password was updated. Sign in with the email that received the link and your new password.':'Tu contraseña se actualizó. Inicia sesión con el correo que recibió el enlace y tu nueva contraseña.'}</p><Link href="/login" className="login-submit">{en?'Sign in':'Iniciar sesión'}</Link></>:<>
 {ready&&!token?<p role="alert">{en?'Open the complete link from your email. If it has expired, request a new one from Sign in.':'Abre el enlace completo de tu correo. Si ha vencido, solicita otro desde Iniciar sesión.'}</p>:<>
 <label>{en?'New password':'Nueva contraseña'}<div className="input-icon"><LockKeyhole size={17}/><input type={show?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><button type="button" onClick={()=>setShow(!show)} aria-label={show?(en?'Hide password':'Ocultar contraseña'):(en?'Show password':'Mostrar contraseña')}>{show?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
 <label>{en?'Confirm password':'Confirmar contraseña'}<div className="input-icon"><LockKeyhole size={17}/><input type={show?'text':'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></div></label>
 {error&&<p className="login-error" role="alert">{error}</p>}<button className="login-submit" disabled={busy||!token}>{busy?(en?'Saving…':'Guardando…'):(en?'Save password':'Guardar contraseña')}</button>
 </> }</> }
 </form></section></main>;
}
