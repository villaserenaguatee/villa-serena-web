'use client';
import {createContext,useContext,useEffect,useState,type HTMLAttributes,type ReactNode} from 'react';
import Link from 'next/link';
import {ArrowRight} from 'lucide-react';
import {readPublishedEditorial} from '@/lib/editorial/client';
import {EDITORIAL_DESTINATIONS,type EditorialDocument,type EditorialId,type EditorialLanguage} from '@/lib/editorial/catalog';

type ContextValue={document?:EditorialDocument|null;language:EditorialLanguage;changeLanguage:(language:EditorialLanguage)=>void;error:string;preview:boolean};
const Context=createContext<ContextValue>({language:'es',changeLanguage:()=>{},error:'',preview:true});
export function EditorialContentProvider({children,preview=false,document,language,loadPublished=true}:{children:ReactNode;preview?:boolean;document?:EditorialDocument;language?:EditorialLanguage;loadPublished?:boolean}){
 const [selected,setSelected]=useState<EditorialLanguage>('es'),[published,setPublished]=useState<{language:EditorialLanguage;document:EditorialDocument|null}>(),[error,setError]=useState('');
 const current=language??selected;
 useEffect(()=>{if(preview||!loadPublished)return;const abort=new AbortController();setError('');readPublishedEditorial(current,abort.signal).then(value=>{if(!abort.signal.aborted)setPublished({language:current,document:value});}).catch(()=>{if(!abort.signal.aborted)setError('No se pudo consultar el contenido actualizado. Intenta nuevamente más tarde.');});return()=>abort.abort();},[current,preview,loadPublished]);
 return <Context.Provider value={{document:preview?document:published?.language===current?published.document:null,language:current,changeLanguage:setSelected,error,preview}}>{children}</Context.Provider>;
}
export function useEditorialLanguage(){const value=useContext(Context);return {...value,en:value.language==='en'};}
export function EditorialLanguageSelect(){const {language,changeLanguage,preview,error}=useContext(Context);return <><label className="inline-flex items-center gap-1 text-xs"><span className="sr-only">Idioma del sitio</span><select aria-label="Idioma del sitio" value={language} disabled={preview} onChange={event=>changeLanguage(event.target.value as EditorialLanguage)} className="rounded border bg-white px-2 py-1 text-[#18345C]"><option value="es">Español</option><option value="en">English</option></select></label>{error&&<span role="status" className="text-xs">{error}</span>}</>;}
function useElement(id:EditorialId){return useContext(Context).document?.elementos.find(element=>element.id===id);}
export function EditorialText({editorialId,as:Tag='span',children,...props}:{editorialId:EditorialId;as?:'h1'|'h2'|'h3'|'p'|'span'|'b';children:ReactNode}&HTMLAttributes<HTMLElement>){const element=useElement(editorialId);return <Tag {...props} data-editorial-id={editorialId}>{element?.texto??children}</Tag>;}
export function EditorialLink({editorialId,href,children,className}:{editorialId:EditorialId;href:string;children:ReactNode;className?:string}){const element=useElement(editorialId);const allowed=element?.destino&&EDITORIAL_DESTINATIONS.some(value=>value===element.destino);return <Link href={allowed?element!.destino!:href} className={className} data-editorial-id={editorialId}>{element?.texto?<>{element.texto}<ArrowRight size={15}/></>:children}</Link>;}
export function EditorialImage({editorialId,src,alt,...props}:{editorialId:EditorialId;src:string;alt:string;className?:string}){const context=useContext(Context),element=useElement(editorialId),url=element?.fotoClave?context.document?.fotografias?.[element.fotoClave]:undefined;let safe=src;try{if(url&&['http:','https:'].includes(new URL(url).protocol))safe=url;}catch{/* Conserva la fotografía existente si la respuesta no contiene una URL válida. */}return <img {...props} data-editorial-id={editorialId} src={safe} alt={alt}/>;}
