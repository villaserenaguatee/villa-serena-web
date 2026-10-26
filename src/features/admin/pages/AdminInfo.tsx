'use client';
import {useId,useState} from 'react';
import {Info} from 'lucide-react';
export default function AdminInfo({label,children}:{label:string;children:string}){
 const [open,setOpen]=useState(false),id=useId();
 return <span className="inline-flex align-middle"><button type="button" aria-label={'Información: '+label} title={children} aria-expanded={open} aria-describedby={open?id:undefined} onClick={()=>setOpen(value=>!value)} onBlur={()=>setOpen(false)} onKeyDown={event=>{if(event.key==='Escape')setOpen(false);}} className="ml-1 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[#64748B] hover:bg-[#F4F1EA] focus-visible:outline-2 focus-visible:outline-[#18345C]"><Info size={15} aria-hidden="true"/></button>{open&&<span id={id} role="tooltip" className="absolute left-3 right-3 top-full z-20 mt-1 max-w-sm rounded-lg border border-[#D8DFE5] bg-white p-3 text-left text-xs font-normal leading-relaxed text-[#536579] shadow-md">{children}</span>}</span>;
}
