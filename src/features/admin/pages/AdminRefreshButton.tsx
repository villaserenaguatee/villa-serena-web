'use client';
import {RefreshCw} from 'lucide-react';

type Props={loading:boolean;disabled?:boolean;onClick:()=>void;className?:string};
export default function AdminRefreshButton({loading,disabled=false,onClick,className=''}:Props){
 return <button type="button" title="Actualizar" aria-label="Actualizar" aria-busy={loading} disabled={loading||disabled} onClick={onClick} className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-[#D8DFE5] bg-white p-0 text-[#18345C] transition-colors hover:bg-[#F5F4EF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#426D98] disabled:cursor-not-allowed disabled:opacity-50 ${className}`}><RefreshCw aria-hidden="true" size={18} className={loading?'animate-spin motion-reduce:animate-none':undefined}/></button>;
}
