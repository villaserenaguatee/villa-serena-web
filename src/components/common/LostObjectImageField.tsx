'use client';
import {useEffect,useId,useState} from 'react';
import {validarFoto} from '@/lib/incidenciaValidation';
/** Image control extracted from Reception's lost-property form. Never uploads on selection. */
export default function LostObjectImageField({label,value,onChange,onError,disabled=false}:{label:string;value?:File;onChange:(file:File|undefined)=>void;onError:(message:string)=>void;disabled?:boolean}){
 const id=useId();const [preview,setPreview]=useState('');
 useEffect(()=>{if(!value){setPreview('');return;}const url=URL.createObjectURL(value);setPreview(url);return()=>URL.revokeObjectURL(url);},[value]);
 return <div className="text-sm"><label htmlFor={id} className="block">{label}</label><input id={id} type="file" disabled={disabled} accept="image/jpeg,image/png" className="w-full min-w-0 rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;const error=validarFoto(file);onError(error);if(!error)onChange(file);}}/>{preview&&<><img src={preview} alt="Fotografía seleccionada" className="max-h-44 w-full object-contain"/><button type="button" disabled={disabled} onClick={()=>{onChange(undefined);onError('');}} className="mt-2 rounded-md border border-[#E5E0D8] px-3 py-1.5 text-[#18345C]">Quitar imagen</button></>}</div>;
}
