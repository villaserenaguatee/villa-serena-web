'use client';
import {useEffect,useRef,useState} from 'react';
import {OperationError} from '@/lib/api/operaciones';
import {readEditorialDraft,saveEditorialDraft,publishEditorial} from '@/lib/editorial/client';
import {EDITORIAL_DESTINATIONS,type EditorialDocument,type EditorialElement,type EditorialId} from '@/lib/editorial/catalog';
import {uploadCatalogPhoto,type CatalogPhotoDraft} from './catalogPhotoClient';
import {validarFoto} from '@/lib/incidenciaValidation';
import {adminServiceError} from './adminServiceError';

type State={base?:EditorialDocument;elements:EditorialElement[];error:string;notice:string;conflict:boolean;remote?:EditorialDocument};
const empty=():State=>({elements:[],error:'',notice:'',conflict:false});
export function editorialValidation(elements:EditorialElement[]):string{
 if(!elements.length)return 'Selecciona y modifica al menos un elemento.';
 for(const element of elements){
  if(element.id.endsWith('.imagen')||element.id.endsWith('.imagenes')){if(element.fotoClaves){if(element.fotoClaves.length>(element.id.endsWith('.imagenes')?30:1)||new Set(element.fotoClaves).size!==element.fotoClaves.length||element.id==='identidad.logo.imagen'&&!element.fotoClaves.length)return 'Revisa las fotografias de la seccion.';}else if(!element.fotoClave)return 'Selecciona una fotografía guardada en la galería del hotel.';}
  else{const max=/\.(titulo|subtitulo|boton)$/.test(element.id)?200:4000;if(!element.texto?.trim()||element.texto.length>max||/[<>\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(element.texto))return `Introduce texto válido de hasta ${max} caracteres, sin etiquetas.`;if(element.id.endsWith('.boton')&&!EDITORIAL_DESTINATIONS.some(path=>path===element.destino))return 'Selecciona el destino del botón.';}
 }return '';
}
export function useHotelEditorial(enabled:boolean){
 const language='es' as const;
 const [state,setState]=useState<State>(empty),[busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[reload,setReload]=useState(0),[confirmPublish,setConfirmPublish]=useState(false);
 const localFiles=useRef(new Map<string,{file:File;key?:string}>()),[photoUrls,setPhotoUrls]=useState<Record<string,string>>({});
 useEffect(()=>()=>{for(const url of localFiles.current.keys())URL.revokeObjectURL(url);localFiles.current.clear();},[]);
 const lock=useRef(false),dirty=Boolean(state.base)&&JSON.stringify(state.elements)!==JSON.stringify(state.base?.elementos);
 function update(change:Partial<State>){setState(current=>({...current,...change}));}
 useEffect(()=>{if(!enabled)return;const abort=new AbortController();setLoading(true);readEditorialDraft(language,abort.signal).then(base=>{if(!abort.signal.aborted)setState(current=>current.base?current:{...empty(),base,elements:base.elementos});}).catch(error=>{if(!abort.signal.aborted)update({error:adminServiceError(error)});}).finally(()=>{if(!abort.signal.aborted)setLoading(false);});return()=>abort.abort();},[enabled,language,reload]);
 useEffect(()=>{if(!(state.base&&JSON.stringify(state.elements)!==JSON.stringify(state.base.elementos)))return;const warn=(event:BeforeUnloadEvent)=>event.preventDefault();window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[state]);
 const validation=editorialValidation(state.elements);
 function setElement(element:EditorialElement){if(lock.current)return;setState(value=>({...value,notice:'',elements:value.elements.some(item=>item.id===element.id)?value.elements.map(item=>item.id===element.id?element:item):[...value.elements,element]}));}
 function resetElement(id:EditorialId){if(lock.current)return;update({elements:state.elements.filter(element=>element.id!==id),notice:''});}
 async function save(){if(lock.current||!enabled||!state.base||!dirty||validation)return;lock.current=true;setBusy(true);update({error:'',notice:''});try{const elements=[];
 for(const element of state.elements){if(element.fotoClaves){const keys=[];for(const value of element.fotoClaves){const local=localFiles.current.get(value);if(local){if(!local.key)local.key=await uploadCatalogPhoto(local.file,'HOTEL');keys.push(local.key);}else keys.push(value);}elements.push({...element,fotoClaves:keys});}else elements.push(element);}
 const base=await saveEditorialDraft(language,state.base.revision,elements);update({base,elements:base.elementos,notice:'Borrador guardado. La página pública no cambió.',conflict:false});}catch(error){update({error:adminServiceError(error),conflict:error instanceof OperationError&&error.status===409});}finally{lock.current=false;setBusy(false);}}
 async function publish(){if(lock.current||!confirmPublish||!state.base||dirty||state.base.revision===0)return;lock.current=true;setBusy(true);update({error:'',notice:''});try{const base=await publishEditorial(language,state.base.revision);if(base.revisionPublicada!==state.base.revision)throw new OperationError('El servicio no confirmó la versión publicada. Vuelve a consultar.',502);update({base,elements:base.elementos,notice:'Cambios publicados. Ya puedes revisar el sitio público.',conflict:false});setConfirmPublish(false);}catch(error){update({error:adminServiceError(error),conflict:error instanceof OperationError&&error.status===409});}finally{lock.current=false;setBusy(false);}}
 async function consult(){if(lock.current)return;lock.current=true;setBusy(true);try{const remote=await readEditorialDraft(language);update({remote});}catch(error){update({error:adminServiceError(error)});}finally{lock.current=false;setBusy(false);}}
 function loadRemote(){if(!state.remote)return;update({...empty(),base:state.remote,elements:state.remote.elementos,notice:'Se cargó el borrador actual.'});}
 function setPhotos(id:EditorialId,photos:CatalogPhotoDraft[]){
  if(lock.current)return;
  const limit=id.endsWith('.imagenes')?30:1;
  if(photos.filter(photo=>photo.file||photo.clave).length>limit){update({error:'Esta posicion admite '+limit+' fotografia(s). Reemplaza o quita la anterior.'});return;}
  const error=photos.filter(photo=>photo.file).map(photo=>validarFoto(photo.file!)).find(Boolean);if(error){update({error});return;}
  const keys:string[]=[],urls:Record<string,string>={};
  for(const photo of photos){let key=photo.clave;if(photo.file){key=URL.createObjectURL(photo.file);localFiles.current.set(key,{file:photo.file});urls[key]=key;}else if(key&&photo.url)urls[key]=photo.url;if(key)keys.push(key);}
  setPhotoUrls(current=>({...current,...urls}));setElement({id,fotoClaves:keys});
 }
 return {state,busy,setPhotos,loading,dirty,validation,setElement,resetElement,save,publish,confirmPublish,setConfirmPublish,consult,loadRemote,closeReview:()=>update({remote:undefined}),retry:()=>setReload(value=>value+1),canSave:enabled&&!busy&&!loading&&dirty&&!validation,canPublish:enabled&&!busy&&!loading&&!dirty&&Boolean(state.base&&state.base.revision>0&&state.base.revision!==state.base.revisionPublicada),document:state.base?{...state.base,elementos:state.elements,fotografias:{...state.base.fotografias,...photoUrls}}:undefined};
}
export type HotelEditorial=ReturnType<typeof useHotelEditorial>;
