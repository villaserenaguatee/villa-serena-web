'use client';
import {useEffect,useRef,useState} from 'react';
import {BedDouble,Users,X} from 'lucide-react';

type Props={numero:string;tipo:string;estado:string;piso:number;capacidad?:number;precio?:number;descripcion?:string;camas?:string;fotos?:string[];servicios?:string[];onClose:()=>void;onEdit?:()=>void};
/** Reuses the public room detail metadata styling and thumbnail presentation. */
export default function RoomInformationDialog({numero,tipo,estado,piso,capacidad,precio,descripcion,camas,fotos=[],servicios=[],onClose,onEdit}:Props){
 const statusKey=estado.toLocaleLowerCase('es').replaceAll('_',' ');
 const statusColor=statusKey==='disponible'||statusKey==='libre'?'bg-green-50 text-green-800':statusKey.includes('limpieza')?'bg-amber-50 text-amber-900':statusKey.includes('mantenimiento')||statusKey==='fuera de servicio'?'bg-red-50 text-red-800':'bg-[#18345C] text-white';
 const dialog=useRef<HTMLElement>(null),close=useRef<HTMLButtonElement>(null),[photo,setPhoto]=useState(0);
 useEffect(()=>{const previous=document.activeElement as HTMLElement|null;close.current?.focus();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=overflow;if(previous?.isConnected)previous.focus();};},[]);
 return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#071D34]/50 p-3" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}} onKeyDown={e=>{if(e.key==='Escape'){e.stopPropagation();onClose();}if(e.key==='Tab'){const items=dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled),[href],input,select,textarea,[tabindex="0"]');if(!items?.length)return;const first=items[0],last=items[items.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}}}>
  <section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="admin-room-information" className="flex max-h-[88dvh] w-full max-w-[440px] flex-col overflow-hidden rounded-2xl bg-white text-[#18345C] shadow-2xl">
   <header className="flex shrink-0 items-start justify-between gap-3 px-4 pb-3 pt-4"><div className="min-w-0"><h2 id="admin-room-information" className="text-2xl font-semibold">Habitación {numero}</h2><p className="break-words text-lg">{tipo}</p></div><button ref={close} type="button" aria-label="Cerrar ficha" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[#E5E0D8] hover:bg-[#F8F6F0] focus-visible:outline-2 focus-visible:outline-[#18345C]"><X size={20}/></button></header>
   <div className="min-h-0 space-y-3 overflow-y-auto px-4 pb-4">
    <div><div className="relative overflow-hidden rounded-lg">
     {fotos.length>0?<img src={fotos[photo]} alt={`Habitación ${numero}, fotografía ${photo+1}`} className="h-36 w-full rounded-lg object-cover"/>:<div className="flex h-36 w-full flex-col items-center justify-center gap-2 bg-[#F8F6F0] text-sm text-[#536579]"><BedDouble size={28}/><span>Sin fotografía disponible</span></div>}
     <span className={`absolute right-2 top-2 max-w-[calc(100%-1rem)] rounded-full px-3 py-1 text-center text-xs font-semibold shadow-sm ring-1 ring-black/10 ${statusColor}`}>{estado}</span>
    </div>{fotos.length>1&&<div className="mt-2 flex gap-2 overflow-x-auto pb-1">{fotos.map((src,i)=><button key={`${src}-${i}`} type="button" aria-label={`Ver fotografía ${i+1}`} aria-pressed={photo===i} onClick={()=>setPhoto(i)} className={`shrink-0 rounded-md border-2 ${photo===i?'border-[#18345C]':'border-transparent'}`}><img src={src} alt="" className="h-10 w-14 rounded object-cover"/></button>)}</div>}</div>
    <div className="text-sm"><span>Piso {piso}</span></div>
    {descripcion&&<p className="text-sm leading-snug text-[#536579]">{descripcion}</p>}
    <div className="room-detail-meta !m-0 !grid !grid-cols-2 !gap-3 !text-sm">{capacidad!=null&&<span><Users size={18}/>{capacidad} huéspedes</span>}{camas&&<span><BedDouble size={18}/>{camas}</span>}{precio!=null&&<span className="col-span-2 font-semibold">Q {precio.toLocaleString('es-GT',{minimumFractionDigits:2,maximumFractionDigits:2})} / noche</span>}</div>
    {servicios.length>0&&<ul className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#536579]">{servicios.map(service=><li key={service}>{service}</li>)}</ul>}
   </div>
   <footer className="flex shrink-0 justify-end gap-2 border-t border-[#E5E0D8] p-3"><button type="button" onClick={onClose} className="rounded-lg border border-[#E5E0D8] px-3 py-2 text-sm">Cerrar</button>{onEdit&&<button type="button" onClick={onEdit} className="rounded-lg bg-[#18345C] px-3 py-2 text-sm text-white">Editar habitación</button>}</footer>
  </section>
 </div>;
}
