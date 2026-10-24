import { useRef, useState } from 'react';
import AnchoredPopover from '@/components/common/AnchoredPopover';
import { CATEGORIAS_ACTIVO } from './mantUtils';
import type { CategoriaActivo } from '@/lib/pms/types';
export default function CategoriaActivoSelect({value,onChange,incluirTodas=false}:{value:CategoriaActivo|'todas';onChange:(v:CategoriaActivo|'todas')=>void;incluirTodas?:boolean}){
 const anchor=useRef<HTMLButtonElement>(null);const [open,setOpen]=useState(false);
 const options=incluirTodas?['todas',...CATEGORIAS_ACTIVO]:CATEGORIAS_ACTIVO;
 return <div className="relative min-w-0"><button ref={anchor} type="button" aria-label="Categoría" aria-haspopup="listbox" aria-expanded={open} onClick={()=>setOpen(!open)} className="mt-1 flex min-h-10 w-full items-center justify-between gap-2 rounded-lg border border-[#E5E0D8] bg-white px-3 py-2.5 text-left text-sm text-[#18345C]"><span>{value==='todas'?'Todas las categorías':value}</span><span aria-hidden="true">⌄</span></button>{open&&<AnchoredPopover anchor={anchor} width={anchor.current?.offsetWidth??220} onClose={()=>setOpen(false)} className="rounded-lg border border-[#E5E0D8] bg-white p-1 shadow-lg"><div role="listbox" aria-label="Categorías de equipo" className="max-h-[min(224px,45dvh)] overflow-y-auto">{options.map(o=><button key={o} type="button" role="option" aria-selected={value===o} onClick={()=>{onChange(o as CategoriaActivo|'todas');setOpen(false);anchor.current?.focus();}} className="block w-full rounded px-3 py-2 text-left text-sm text-[#18345C] hover:bg-[#F8F6F0] focus:bg-[#F8F6F0]">{o==='todas'?'Todas las categorías':o}</button>)}</div></AnchoredPopover>}</div>;
}
