'use client';
import {useEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {LockKeyhole,X} from 'lucide-react';
import StaffPasswordForm from './StaffPasswordForm';

export default function StaffPasswordModal({onClose}:{onClose:()=>void}){
 const panel=useRef<HTMLElement>(null),busy=useRef(false),close=useRef(onClose);close.current=onClose;
 const [success,setSuccess]=useState(false);
 useEffect(()=>{
  const previous=document.activeElement as HTMLElement|null,overflow=document.body.style.overflow;document.body.style.overflow='hidden';panel.current?.querySelector<HTMLElement>('input,button')?.focus();
  function keyboard(e:KeyboardEvent){if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(!busy.current)close.current();}if(e.key==='Tab'){const items=Array.from(panel.current?.querySelectorAll<HTMLElement>('input:not(:disabled),button:not(:disabled)')??[]),first=items[0],last=items.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}}}
  document.addEventListener('keydown',keyboard,true);return()=>{document.body.style.overflow=overflow;document.removeEventListener('keydown',keyboard,true);if(previous?.isConnected)previous.focus();};
 },[]);
 return createPortal(<div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#071D34]/45 p-3"><section ref={panel} role="dialog" aria-modal="true" aria-labelledby="staff-password-title" className="max-h-[calc(100dvh-24px)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 text-[#18345C] shadow-xl"><header className="mb-4 flex items-start gap-3"><LockKeyhole size={23} className="mt-1 shrink-0"/><div className="flex-1"><h2 id="staff-password-title" className="text-xl font-semibold">Cambiar contraseña</h2><p className="mt-1 text-sm text-[#536579]">Actualiza tu contraseña para mantener tu cuenta segura</p></div><button type="button" aria-label="Cerrar cambio de contraseña" onClick={()=>{if(!busy.current)onClose();}} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border"><X size={18}/></button></header>{success?<div><p role="status" className="mb-4 text-sm">Tu contraseña se cambió correctamente.</p><button autoFocus type="button" onClick={onClose} className="rounded-lg bg-[#18345C] px-4 py-2 text-white">Aceptar</button></div>:<StaffPasswordForm onBusy={value=>{busy.current=value;}} onCancel={onClose} onSuccess={employee=>{if(employee.debeCambiarContrasena){window.location.assign('/panel/cambiar-contrasena');return;}setSuccess(true);}}/>}</section></div>,document.body);
}
