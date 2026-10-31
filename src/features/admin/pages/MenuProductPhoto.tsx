'use client';
import {useEffect,useRef,useState} from 'react';
import PhotoPicker from '@/components/common/PhotoPicker';
import {validarFoto} from '@/lib/incidenciaValidation';
export default function MenuProductPhoto({file,url,disabled,onChange,onRemove,onError}:{file?:File;url?:string|null;disabled:boolean;onChange:(file:File|undefined)=>void;onRemove:()=>void;onError:(error:string)=>void}){
 const [preview,setPreview]=useState(''),[invalid,setInvalid]=useState(false);const chooser=useRef<HTMLInputElement>(null);
 const select=(selected:File)=>{const error=validarFoto(selected);setInvalid(Boolean(error));onError(error);if(!error)onChange(selected);};
 useEffect(()=>{if(!file){setPreview('');return;}const object=URL.createObjectURL(file);setPreview(object);return()=>URL.revokeObjectURL(object);},[file]);
 return <div className="text-sm"><span className="mb-1 block">Fotografía</span><PhotoPicker label="Imagen (opcional)" accept="image/jpeg,image/png" disabled={disabled} preview={preview||url} actionStyle="icons" removable={Boolean(preview||url||invalid)} onSelect={select} onRemove={()=>{setInvalid(false);onError('');onRemove();}}/><input ref={chooser} type="file" accept="image/jpeg,image/png" className="sr-only" aria-label="Seleccionar fotografía del producto" disabled={disabled} onChange={e=>{const selected=e.currentTarget.files?.[0];e.currentTarget.value='';if(selected)select(selected);}}/><button type="button" disabled={disabled} onClick={()=>chooser.current?.click()} className="mt-2 rounded-md border border-[#18345C] px-4 py-2 font-medium text-[#18345C] hover:bg-[#F8F6F0] disabled:opacity-50">{preview||url?'Cambiar fotografía':'Seleccionar fotografía'}</button><p className="mt-1 text-xs text-[#536579]">Selecciona una imagen JPG o PNG y pulsa Guardar para subirla.</p></div>;
}
