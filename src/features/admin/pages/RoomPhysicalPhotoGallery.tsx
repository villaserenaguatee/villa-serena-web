'use client';
import {useEffect,useRef,useState} from 'react';
import AdminPhotoGallery from './AdminPhotoGallery';
import {resolveCatalogPhotos,type CatalogPhotoDraft} from './catalogPhotoClient';
import {operacion} from '@/lib/api/operaciones';
type Response={habitacionId:number;fotos:{clave:string;url:string;principal:boolean;orden:number}[]};
export default function RoomPhysicalPhotoGallery({roomId}:{roomId?:number}) {
 const [photos,setPhotos]=useState<CatalogPhotoDraft[]>([]);
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[notice,setNotice]=useState('');
 const [photoError,setPhotoError]=useState('');
 const uploaded=useRef(new Map<File,string>());
 useEffect(()=>{setPhotos([]);setReady(false);setError('');setNotice('');uploaded.current.clear();if(!roomId)return;
  const controller=new AbortController();
  operacion<Response>(`admin/habitaciones/${roomId}/fotos`,'GET',undefined,controller.signal)
   .then(response=>{if(!controller.signal.aborted){setPhotos(response.fotos.map(f=>({clave:f.clave,url:f.url,principal:f.principal})));setReady(true);}})
   .catch(e=>{if(!controller.signal.aborted)setError(e instanceof Error?e.message:'No se pudieron consultar las fotografías.');});
  return()=>controller.abort();
 },[roomId]);
 async function save() {
  if(!roomId||busy||!ready||photoError)return;
  if(!photos.length||photos.filter(x=>x.principal).length!==1){setError('Agrega una fotografía y selecciona exactamente una principal.');return;}
  setBusy(true);setError('');setNotice('');
  try{
   const fotos=await resolveCatalogPhotos(photos,'HABITACION',uploaded.current);
   const result=await operacion<Response>(`admin/habitaciones/${roomId}/fotos`,'PUT',{fotos});
   if(!Array.isArray(result.fotos))throw Error('La API no confirmó las fotografías.');
   setPhotos(result.fotos.map(f=>({clave:f.clave,url:f.url,principal:f.principal})));
   uploaded.current.clear();setNotice('Fotografías guardadas.');
  }catch(e){setError(e instanceof Error?e.message:'No se pudieron guardar las fotografías.');}
  finally{setBusy(false);}
 }
 return <section className="mt-4 min-w-0 border-t pt-4" aria-label="Galería fotográfica">
  {!roomId?<p className="text-sm text-[#536579]">Primero guarda la habitación para agregar fotografías.</p>:
   <><AdminPhotoGallery management principal title="Galería fotográfica" value={photos} disabled={!ready||busy} onChange={next=>{setPhotos(next);setNotice('');}} onError={setPhotoError}/>
    {error&&<p role="alert" className="mt-2 text-sm text-red-800">{error}</p>}
    {notice&&<p role="status" className="mt-2 text-sm text-green-800">{notice}</p>}
    <button type="button" disabled={!ready||busy||Boolean(photoError)} onClick={()=>void save()} className="mt-3 rounded-md bg-[#18345C] px-4 py-2 text-white disabled:opacity-50">Guardar fotografías</button>
   </>}
 </section>;
}
