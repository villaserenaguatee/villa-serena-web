'use client';
import {useEffect,useState} from 'react';
import {validarFoto} from '@/lib/incidenciaValidation';
import PhotoPicker from './PhotoPicker';
/** Image control extracted from Reception's lost-property form. Never uploads on selection. */
export default function LostObjectImageField({label,value,onChange,onError,disabled=false}:{label:string;value?:File;onChange:(file:File|undefined)=>void;onError:(message:string)=>void;disabled?:boolean}){
 const [preview,setPreview]=useState(''),[invalid,setInvalid]=useState(false);
 useEffect(()=>{if(!value){setPreview('');return;}const url=URL.createObjectURL(value);setPreview(url);return()=>URL.revokeObjectURL(url);},[value]);
 return <div className="text-sm"><span className="mb-1 block">{label}</span><PhotoPicker label={label} disabled={disabled} accept="image/jpeg,image/png" preview={preview} removable={Boolean(preview||invalid)} onSelect={file=>{const error=validarFoto(file);setInvalid(Boolean(error));onError(error);if(!error)onChange(file);}} onRemove={()=>{setInvalid(false);onChange(undefined);onError('');}}/></div>;
}
