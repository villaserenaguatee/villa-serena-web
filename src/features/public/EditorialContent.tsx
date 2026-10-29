'use client';
import {createContext,useContext,useEffect,useState,type HTMLAttributes,type ReactNode} from 'react';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {readPublishedEditorial} from '@/lib/editorial/client';
import {EDITORIAL_DESTINATIONS,type EditorialDocument,type EditorialId} from '@/lib/editorial/catalog';

type ContextValue={document?:EditorialDocument|null;error:string};
const Context=createContext<ContextValue>({error:''});
export function EditorialContentProvider({children,preview=false,document,loadPublished=true}:{children:ReactNode;preview?:boolean;document?:EditorialDocument;loadPublished?:boolean}){
 const [published,setPublished]=useState<EditorialDocument|null>(),[error,setError]=useState('');
 useEffect(()=>{if(preview||!loadPublished)return;const abort=new AbortController();setError('');readPublishedEditorial('es',abort.signal).then(value=>{if(!abort.signal.aborted)setPublished(value);}).catch(()=>{if(!abort.signal.aborted)setError('No se pudo consultar el contenido actualizado. Intenta nuevamente más tarde.');});return()=>abort.abort();},[preview,loadPublished]);
 return <Context.Provider value={{document:preview?document:published,error}}>{error&&<p role="status" className="text-xs">{error}</p>}{children}</Context.Provider>;
}
function useElement(id:EditorialId){return useContext(Context).document?.elementos.find(element=>element.id===id);}
export function EditorialText({editorialId,as:Tag='span',children,...props}:{editorialId:EditorialId;as?:'h1'|'h2'|'h3'|'p'|'span'|'b';children:ReactNode}&HTMLAttributes<HTMLElement>){const element=useElement(editorialId);return <Tag {...props} data-editorial-id={editorialId}>{element?.texto??children}</Tag>;}
export function EditorialLink({editorialId,href,children,className}:{editorialId:EditorialId;href:string;children:ReactNode;className?:string}){const element=useElement(editorialId);const allowed=element?.destino&&EDITORIAL_DESTINATIONS.some(value=>value===element.destino);return <Link href={allowed?element!.destino!:href} className={className} data-editorial-id={editorialId}>{element?.texto?<>{element.texto}<ArrowRight size={15}/></>:children}</Link>;}
export function EditorialImage({editorialId,src,alt,...props}:{editorialId:EditorialId;src:string;alt:string;className?:string}){const context=useContext(Context),element=useElement(editorialId),url=element?.fotoClave?context.document?.fotografias?.[element.fotoClave]:undefined;let safe=src;try{if(url&&['http:','https:'].includes(new URL(url).protocol))safe=url;}catch{/* Conserva la fotografía existente si la respuesta no contiene una URL válida. */}return <img {...props} data-editorial-id={editorialId} src={safe} alt={alt}/>;}
