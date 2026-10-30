'use client';
import {createContext,useContext,useEffect,useState,type HTMLAttributes,type ReactNode} from 'react';
import Link from 'next/link';
import {resolveStay,STAY_SLOTS,type StayId} from '@/lib/editorial/stays';
import type {CatalogRoom} from '@/lib/usePublicCatalog';
import {editorialPhotoUrls} from '@/lib/editorial/photos';
import {ArrowRight} from 'lucide-react';
import {readPublishedEditorial} from '@/lib/editorial/client';
import {EDITORIAL_DESTINATIONS,type EditorialDocument,type EditorialId} from '@/lib/editorial/catalog';

type ContextValue={document?:EditorialDocument|null;error:string};
const Context=createContext<ContextValue>({error:''});
export function EditorialContentProvider({children,preview=false,document,loadPublished=true}:{children:ReactNode;preview?:boolean;document?:EditorialDocument;loadPublished?:boolean}){
 const [published,setPublished]=useState<EditorialDocument|null>(),[error,setError]=useState('');
 useEffect(()=>{
  if(preview||!loadPublished)return;
  let abort:AbortController;
  const refresh=()=>{abort?.abort();abort=new AbortController();const signal=abort.signal;setError('');readPublishedEditorial('es',signal).then(value=>{if(!signal.aborted)setPublished(value);}).catch(()=>{if(!signal.aborted)setError('No se pudo consultar el contenido actualizado. Intenta nuevamente más tarde.');});};
  refresh();window.addEventListener('focus',refresh);
  return()=>{abort?.abort();window.removeEventListener('focus',refresh);};
 },[preview,loadPublished]);
 return <Context.Provider value={{document:preview?document:published,error}}>{error&&<p role="status" className="text-xs">{error}</p>}{children}</Context.Provider>;
}
export function useEditorialPhotos(id:EditorialId,fallback:string[]){return editorialPhotoUrls(useContext(Context).document,id,fallback);}
function useElement(id:EditorialId){return useContext(Context).document?.elementos.find(element=>element.id===id);}
export function EditorialText({editorialId,as:Tag='span',children,...props}:{editorialId:EditorialId;as?:'h1'|'h2'|'h3'|'p'|'span'|'b';children:ReactNode}&HTMLAttributes<HTMLElement>){const element=useElement(editorialId);return <Tag {...props} data-editorial-id={editorialId}>{element?.texto??children}</Tag>;}
export function EditorialLink({editorialId,href,children,className}:{editorialId:EditorialId;href:string;children:ReactNode;className?:string}){const element=useElement(editorialId);const allowed=element?.destino&&EDITORIAL_DESTINATIONS.some(value=>value===element.destino);return <Link href={allowed?element!.destino!:href} className={className} data-editorial-id={editorialId}>{element?.texto?<>{element.texto}<ArrowRight size={15}/></>:children}</Link>;}
export function EditorialImage({editorialId,src,alt,...props}:{editorialId:EditorialId;src:string;alt:string;className?:string}){const urls=useEditorialPhotos(editorialId,[src]);if(!urls.length)return null;return <img {...props} data-editorial-id={editorialId} src={urls[0]} alt={alt}/>;}

export function useEditorialStay(id:StayId,rooms:CatalogRoom[]){return resolveStay(id,useContext(Context).document?.elementos??[],rooms);}

export function useEditorialStayNames(rooms:CatalogRoom[]){const elements=useContext(Context).document?.elementos??[];return Object.fromEntries(STAY_SLOTS.map(slot=>[slot.id,resolveStay(slot.id,elements,rooms).name])) as Record<StayId,string>;}
