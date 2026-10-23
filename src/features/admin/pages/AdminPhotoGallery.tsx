'use client';
import {useEffect,useId,useState} from 'react';
import PhotoPicker from '@/components/common/PhotoPicker';
import {validarFoto} from '@/lib/incidenciaValidation';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
import type {CatalogPhotoDraft} from './catalogPhotoClient';
function GalleryPhoto({photo,index,disabled,onReplace,onRemove}:{photo:CatalogPhotoDraft;index:number;disabled:boolean;onReplace:(file:File)=>void;onRemove:()=>void}){
 const [preview,setPreview]=useState(photo.url??'');const {en}=usePublicLanguage();
 useEffect(()=>{if(!photo.file){setPreview(photo.url??'');return;}const url=URL.createObjectURL(photo.file);setPreview(url);return()=>URL.revokeObjectURL(url);},[photo.file,photo.url]);
 return <PhotoPicker label={(en?'Photograph ':'Fotografía ')+(index+1)} accept="image/jpeg,image/png" preview={preview} disabled={disabled} removable onSelect={onReplace} onRemove={onRemove}/>;
}
export default function AdminPhotoGallery({value,onChange,onError,disabled=false,principal=false}:{value:CatalogPhotoDraft[];onChange:(photos:CatalogPhotoDraft[])=>void;onError?:(message:string)=>void;disabled?:boolean;principal?:boolean}){
 const [error,setError]=useState(''),id=useId(),{en}=usePublicLanguage();const ui=(es:string,english:string)=>en?english:es;
 function report(message:string){setError(message);onError?.(message);}
 function replace(index:number,file:File){const reason=validarFoto(file);report(reason);if(reason)return;onChange(value.map((p,i)=>i===index?{file,principal:p.principal}:p));}
 return <section aria-label={ui('Fotografías','Photographs')} className="space-y-3"><h3 className="font-semibold">{ui('Fotografías','Photographs')}</h3><p className="text-xs text-[#536579]">{ui('JPG o PNG, hasta 5 MiB. Los cambios se guardan al confirmar.','JPG or PNG, up to 5 MiB. Changes are saved on confirmation.')}</p><div className="grid gap-3 sm:grid-cols-2">{value.map((photo,index)=><div key={index} className="min-w-0 rounded-lg border bg-white p-2"><GalleryPhoto photo={photo} index={index} disabled={disabled} onReplace={file=>replace(index,file)} onRemove={()=>{report('' );const next=value.filter((_,i)=>i!==index);if(principal&&next.length&&!next.some(p=>p.principal))next[0]={...next[0],principal:true};onChange(next);}}/>{!photo.file&&!photo.url&&<p className="mt-1 break-all text-xs">{ui('Imagen registrada; el servicio no devuelve su URL de vista previa.','Saved image; the service does not return its preview URL.')}</p>}{principal&&<label className="mt-2 flex gap-2 text-sm"><input type="radio" name={id} disabled={disabled} checked={photo.principal} onChange={()=>onChange(value.map((p,i)=>({...p,principal:i===index})))}/>{ui('Principal','Main photograph')}</label>}</div>)}</div><PhotoPicker compact label={ui('Agregar fotografía','Add photograph')} accept="image/jpeg,image/png" disabled={disabled} removable={Boolean(error)} onRemove={()=>report('')} onSelect={file=>{const reason=validarFoto(file);report(reason);if(!reason)onChange([...value,{file,principal:principal&&value.length===0}]);}}/>{error&&<p role="alert" className="text-sm text-red-800">{error}</p>}</section>;
}
