'use client';
import {useEffect,useRef,useState} from 'react';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';

/** The caller must discard the response when onDismiss runs; never put it in rows,
 * browser storage, URLs, notices or a query cache. */
export default function TemporaryEmployeeAccess({password,onDismiss}:{password:string;onDismiss:()=>void}){
 const {en}=usePublicLanguage();const [secret,setSecret]=useState(password),[closed,setClosed]=useState(false);
 const dialog=useRef<HTMLDivElement>(null),closeButton=useRef<HTMLButtonElement>(null),discarded=useRef(false);
 const dismiss=()=>{if(discarded.current)return;discarded.current=true;setSecret('');setClosed(true);onDismiss();};
 const dismissRef=useRef(dismiss);dismissRef.current=dismiss;
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;closeButton.current?.focus();
  const key=(event:KeyboardEvent)=>{if(event.key==='Escape'){event.preventDefault();dismissRef.current();}if(event.key==='Tab'&&dialog.current){const controls=dialog.current.querySelectorAll<HTMLElement>('input,button');const first=controls[0],last=controls[controls.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}};
  const hide=()=>{if(document.visibilityState==='hidden')dismissRef.current();};
  window.addEventListener('keydown',key);window.addEventListener('pagehide',dismissRef.current);document.addEventListener('visibilitychange',hide);
  const pageHide=dismissRef.current;
  return()=>{window.removeEventListener('keydown',key);window.removeEventListener('pagehide',pageHide);document.removeEventListener('visibilitychange',hide);previous?.focus();};
 },[]);
 if(closed||!secret)return null;
 return <div className="fixed inset-0 z-[110] grid place-items-center bg-[#071D34]/45 p-4"><div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="temporary-access-title" data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="standard" className="w-full max-w-md rounded-xl bg-white p-5 text-[#18345C] shadow-xl"><h2 id="temporary-access-title" className="text-xl font-semibold">{en?'Temporary password':'Contraseña temporal'}</h2><p className="my-3 text-sm">{en?'This password is shown only now. Share it securely with the employee, who must change it at first sign-in.':'Esta contraseña se muestra únicamente ahora. Comunícala de forma segura al empleado; deberá cambiarla al iniciar sesión.'}</p><label className="block text-sm">{en?'Temporary password':'Contraseña temporal'}<input readOnly type="text" autoComplete="off" spellCheck={false} value={secret} className="mt-1 w-full rounded-lg border p-3 font-mono"/></label><div data-vs-actions="compact" className="mt-4 flex justify-end"><button ref={closeButton} type="button" onClick={dismiss} className="rounded-lg bg-[#18345C] px-4 py-2 text-white">{en?'Close':'Cerrar'}</button></div></div></div>;
}
