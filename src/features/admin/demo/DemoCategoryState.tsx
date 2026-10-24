'use client';
import {useEffect,useRef,useState} from 'react';
import {X} from 'lucide-react';
import c from './AdminVisualDemo.module.css';

// Local demo only: no API request or persisted state.
export default function DemoCategoryState({name,state,onChange}:{name:string;state:unknown;onChange:(state:'ACTIVO'|'INACTIVO')=>void|Promise<void>}){
 const [open,setOpen]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const lock=useRef(false),dialog=useRef<HTMLElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const active=state==='ACTIVO',valid=active||state==='INACTIVO';
 useEffect(()=>{
  if(!open)return;
  const previousOverflow=document.body.style.overflow,button=trigger.current;document.body.style.overflow='hidden';dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();
  function keyboard(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();if(!lock.current)setOpen(false);}if(event.key==='Tab'){const buttons=Array.from(dialog.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')??[]),first=buttons[0],last=buttons.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}}
  document.addEventListener('keydown',keyboard);return()=>{document.body.style.overflow=previousOverflow;document.removeEventListener('keydown',keyboard);button?.focus();};
 },[open]);
 async function confirm(){if(lock.current)return;lock.current=true;setBusy(true);setError('');try{await onChange(active?'INACTIVO':'ACTIVO');setOpen(false);}catch(e){setError(e instanceof Error?e.message:'No se pudo cambiar el estado.');}finally{lock.current=false;setBusy(false);}}
 return <><button ref={trigger} type="button" className={c.badge} data-tone={active?'green':'gray'} disabled={!valid||busy} aria-label={`${active?'Desactivar':'Activar'} categoría ${name}`} onClick={()=>{setError('');setOpen(true);}}>{active?'ACTIVO':state==='INACTIVO'?'DESACTIVADO':String(state??'—')}</button>{open&&<div className={c.dialogOverlay}><section ref={dialog} className={c.dialog} style={{maxWidth:420,minWidth:0,whiteSpace:'normal',overflowWrap:'anywhere'}} role="dialog" aria-modal="true" aria-label="Confirmar estado de categoría"><header className={c.dialogHead}><h2 style={{minWidth:0}}>Estado de categoría</h2><button type="button" className={c.iconButton} aria-label="Cerrar confirmación" style={{flexShrink:0}} disabled={busy} onClick={()=>setOpen(false)}><X size={19}/></button></header><div className={c.dialogBody} style={{minWidth:0}}><p>¿Deseas {active?'desactivar':'activar'} esta categoría de habitación?</p><p className={c.subtext} style={{marginTop:8,marginBottom:8}}>{name}</p><p className={c.subtext}>Demostración: el cambio solo se aplicará en memoria</p>{error&&<p role="alert" className={c.error}>{error}</p>}</div><footer className={c.dialogFoot}><button type="button" className={c.secondary} disabled={busy} onClick={()=>setOpen(false)}>Cancelar</button><button type="button" className={c.primary} disabled={busy} onClick={()=>void confirm()}>{busy?'Aplicando…':'Confirmar'}</button></footer></section></div>}</>;
}
