'use client';
import {useEffect,useRef,useState} from 'react';
import {OperationError} from '@/lib/api/operaciones';
import {readEditorialDraft,saveEditorialDraft,publishEditorial} from '@/lib/editorial/client';
import {EDITORIAL_DESTINATIONS,type EditorialDocument,type EditorialElement,type EditorialId,type EditorialLanguage} from '@/lib/editorial/catalog';
import {adminServiceError} from './adminServiceError';

type State={base?:EditorialDocument;elements:EditorialElement[];error:string;notice:string;conflict:boolean;remote?:EditorialDocument};
const empty=():State=>({elements:[],error:'',notice:'',conflict:false});
export function editorialValidation(elements:EditorialElement[]):string{
 if(!elements.length)return 'Selecciona y modifica al menos un elemento.';
 for(const element of elements){
  if(element.id.endsWith('.imagen')){if(!element.fotoClave)return 'Selecciona una fotografía guardada en la galería del hotel.';}
  else{const max=/\.(titulo|subtitulo|boton)$/.test(element.id)?200:4000;if(!element.texto?.trim()||element.texto.length>max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(element.texto))return `Introduce texto válido de hasta ${max} caracteres, sin etiquetas.`;if(element.id.endsWith('.boton')&&!EDITORIAL_DESTINATIONS.some(path=>path===element.destino))return 'Selecciona el destino del botón.';}
 }return '';
}
export function useHotelEditorial(enabled:boolean){
 const [language,setLanguage]=useState<EditorialLanguage>('es'),[states,setStates]=useState<Record<EditorialLanguage,State>>({es:empty(),en:empty()}),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[reload,setReload]=useState(0),[confirmPublish,setConfirmPublish]=useState(false);
 const lock=useRef(false),state=states[language],dirty=Boolean(state.base)&&JSON.stringify(state.elements)!==JSON.stringify(state.base?.elementos);
 function update(language:EditorialLanguage,change:Partial<State>){setStates(current=>({...current,[language]:{...current[language],...change}}));}
 useEffect(()=>{if(!enabled)return;const abort=new AbortController();setLoading(true);readEditorialDraft(language,abort.signal).then(base=>{if(!abort.signal.aborted)setStates(current=>current[language].base?current:{...current,[language]:{...empty(),base,elements:base.elementos}});}).catch(error=>{if(!abort.signal.aborted)update(language,{error:adminServiceError(error)});}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();},[enabled,language,reload]);
 useEffect(()=>{if(!Object.values(states).some(state=>state.base&&JSON.stringify(state.elements)!==JSON.stringify(state.base.elementos)))return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[states]);
 const validation=editorialValidation(state.elements);
 function setElement(element:EditorialElement){if(lock.current)return;setStates(current=>{const value=current[language];return {...current,[language]:{...value,notice:'',elements:value.elements.some(item=>item.id===element.id)?value.elements.map(item=>item.id===element.id?element:item):[...value.elements,element]}};});}
 function resetElement(id:EditorialId){if(lock.current)return;update(language,{elements:state.elements.filter(element=>element.id!==id),notice:''});}
 async function save(){if(lock.current||!enabled||!state.base||!dirty||validation)return;lock.current=true;setBusy(true);update(language,{error:'',notice:''});try{const base=await saveEditorialDraft(language,state.base.revision,state.elements);update(language,{base,elements:base.elementos,notice:'Borrador guardado. La página pública no cambió.',conflict:false});}catch(error){update(language,{error:adminServiceError(error),conflict:error instanceof OperationError&&error.status===409});}finally{lock.current=false;setBusy(false);}}
 async function publish(){if(lock.current||!confirmPublish||!state.base||dirty||state.base.revision===0)return;lock.current=true;setBusy(true);update(language,{error:'',notice:''});try{const base=await publishEditorial(language,state.base.revision);if(base.revisionPublicada!==state.base.revision)throw new OperationError('El servicio no confirmó la versión publicada. Vuelve a consultar.',502);update(language,{base,elements:base.elementos,notice:'Cambios publicados. Ya puedes revisar el sitio público.',conflict:false});setConfirmPublish(false);}catch(error){update(language,{error:adminServiceError(error),conflict:error instanceof OperationError&&error.status===409});}finally{lock.current=false;setBusy(false);}}
 async function consult(){if(lock.current)return;lock.current=true;setBusy(true);try{const remote=await readEditorialDraft(language);update(language,{remote});}catch(error){update(language,{error:adminServiceError(error)});}finally{lock.current=false;setBusy(false);}}
 function loadRemote(){if(!state.remote)return;update(language,{...empty(),base:state.remote,elements:state.remote.elementos,notice:'Se cargó el borrador actual.'});}
 return {language,changeLanguage:(value:EditorialLanguage)=>{if(!lock.current){setConfirmPublish(false);setLanguage(value);}},state,busy,loading,dirty,validation,setElement,resetElement,save,publish,confirmPublish,setConfirmPublish,consult,loadRemote,closeReview:()=>update(language,{remote:undefined}),retry:()=>setReload(value=>value+1),canSave:enabled&&!busy&&!loading&&dirty&&!validation,canPublish:enabled&&!busy&&!loading&&!dirty&&Boolean(state.base&&state.base.revision>0&&state.base.revision!==state.base.revisionPublicada),document:state.base?{...state.base,elementos:state.elements}:undefined};
}
export type HotelEditorial=ReturnType<typeof useHotelEditorial>;
