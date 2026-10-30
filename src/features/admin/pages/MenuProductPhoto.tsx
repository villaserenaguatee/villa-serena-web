'use client';
import {useEffect,useState} from 'react';
import PhotoPicker from '@/components/common/PhotoPicker';
import {validarFoto} from '@/lib/incidenciaValidation';
export default function MenuProductPhoto({file,url,disabled,onChange,onRemove,onError}:{file?:File;url?:string|null;disabled:boolean;onChange:(file:File|undefined)=>void;onRemove:()=>void;onError:(error:string)=>void}){
 const [preview,setPreview]=useState(''),[invalid,setInvalid]=useState(false);
 useEffect(()=>{if(!file){setPreview('');return;}const object=URL.createObjectURL(file);setPreview(object);return()=>URL.revokeObjectURL(object);},[file]);
 return <div className="text-sm"><span className="mb-1 block">Fotografía</span><PhotoPicker label="Imagen (opcional)" accept="image/jpeg,image/png" disabled={disabled} preview={preview||url} removable={Boolean(preview||url||invalid)} onSelect={selected=>{const error=validarFoto(selected);setInvalid(Boolean(error));onError(error);if(!error)onChange(selected);}} onRemove={()=>{setInvalid(false);onError('');onRemove();}}/></div>;
}
