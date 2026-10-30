'use client';
import {useEffect,useRef,useState} from 'react';
import RoomOfferFields,{featureDraft,featureInput} from './RoomOfferFields';
import {readFeatures,saveFeatures,type CatalogRoom} from './roomOffersClient';
export default function RoomFeaturesEditor({room,maxCapacity,onBusyChange}:{room:CatalogRoom;maxCapacity:number;onBusyChange:(busy:boolean)=>void}){
 const [draft,setDraft]=useState(featureDraft()),[error,setError]=useState(''),[notice,setNotice]=useState(''),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[reload,setReload]=useState(0);const lock=useRef(false);
 useEffect(()=>{const abort=new AbortController();setReady(false);setError('');readFeatures(room.id,abort.signal).then(value=>{if(!abort.signal.aborted){setDraft(featureDraft(value));setReady(true);}}).catch(error=>{if(!abort.signal.aborted)setError(error.message);});return()=>abort.abort();},[room.id,reload]);
 async function save(){if(lock.current||!ready)return;setError('');setNotice('');try{const input=featureInput(draft);if(input.capacidad>maxCapacity)throw Error('La capacidad supera la de la categoría.');lock.current=true;setBusy(true);onBusyChange(true);const saved=await saveFeatures(room.id,input);setDraft(featureDraft(saved));setNotice('Características guardadas.');}catch(error){setError(error instanceof Error?error.message:'No se pudo guardar.');}finally{lock.current=false;setBusy(false);onBusyChange(false);}}
 return <section aria-label={'Características de habitación '+room.numero}>
  <h4 className="mb-3 font-semibold">Habitación {room.numero} · Piso {room.piso}</h4>
  <fieldset disabled={!ready||busy}><RoomOfferFields value={draft} onChange={setDraft} maxCapacity={maxCapacity}/></fieldset>
  {error&&<p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}{notice&&<p role="status" className="mt-2 text-sm">{notice}</p>}
  <div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={!ready||busy} className="rounded-md bg-[#18345C] px-3 py-2 text-white disabled:opacity-50" onClick={()=>void save()}>Guardar características</button><button type="button" disabled={busy} className="rounded-md border px-3 py-2" onClick={()=>setReload(value=>value+1)}>Actualizar características</button></div>
 </section>;
}
