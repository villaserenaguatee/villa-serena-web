'use client';
import {useState} from 'react';
import RoomOfferFields,{featureDraft,featureInput,lines} from './RoomOfferFields';
import type {CatalogRoom,Offer,OfferInput} from './roomOffersClient';
export default function RoomOfferEditor({offer,typeId,maxCapacity,rooms,onSave,onCancel}:{offer?:Offer;typeId:number;maxCapacity:number;rooms:CatalogRoom[];onSave:(slug:string,value:OfferInput,create:boolean)=>void;onCancel:()=>void}){
 const [slug,setSlug]=useState(offer?.slug??''),[name,setName]=useState(offer?.nombre??''),[description,setDescription]=useState(offer?.descripcion??''),[floor,setFloor]=useState(offer?.piso?.toString()??''),[price,setPrice]=useState(offer?.precioPorNoche?.toString()??''),[order,setOrder]=useState(offer?.orden?.toString()??'0'),[preferences,setPreferences]=useState((offer?.preferencias??[]).join('\n')),[ids,setIds]=useState(offer?.habitacionIds??[]),[details,setDetails]=useState(featureDraft(offer)),[error,setError]=useState('');
 function save(){setError('');try{const features=featureInput(details),precioPorNoche=Number(price),piso=Number(floor),orden=Number(order),preferencias=lines(preferences);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)||slug.length>80||!name.trim()||!description.trim()||name.trim().length>100||description.trim().length>4000||!Number.isInteger(piso)||piso<1||!Number.isFinite(precioPorNoche)||precioPorNoche<0.01||Math.abs(precioPorNoche*100-Math.round(precioPorNoche*100))>1e-6||!Number.isInteger(orden)||orden<0||features.capacidad>maxCapacity||preferencias.length>30||preferencias.some(item=>item.length>100))throw Error('Revisa los datos de la oferta.');onSave(slug,{...features,tipoHabitacionId:typeId,nombre:name.trim(),descripcion:description.trim(),piso,precioPorNoche,orden,preferencias,habitacionIds:ids,publicada:offer?.publicada??false},!offer);}catch(error){setError(error instanceof Error?error.message:'Revisa los datos.');}}
 return <section aria-label={offer?'Editar oferta':'Nueva oferta'} className="grid gap-3">
  <h4 className="font-semibold">{offer?'Editar oferta':'Nueva oferta'}</h4>
  <label>Identificador de la oferta<input required readOnly={Boolean(offer)} maxLength={80} value={slug} onChange={event=>setSlug(event.target.value)}/></label>
  <label>Nombre de la oferta<input required maxLength={100} value={name} onChange={event=>setName(event.target.value)}/></label>
  <label>Descripción de la oferta<textarea required maxLength={4000} rows={3} value={description} onChange={event=>setDescription(event.target.value)}/></label>
  <div className="grid gap-3 sm:grid-cols-2"><label>Piso de la oferta<input required type="number" min="1" step="1" value={floor} onChange={event=>setFloor(event.target.value)}/></label><label>Precio público por noche (Q)<input required type="number" min="0.01" step="0.01" value={price} onChange={event=>setPrice(event.target.value)}/></label></div>
  <RoomOfferFields value={details} onChange={setDetails} maxCapacity={maxCapacity}/>
  <label>Preferencias de estancia<textarea rows={2} value={preferences} onChange={event=>setPreferences(event.target.value)}/></label>
  <label>Orden de la oferta<input required type="number" min="0" step="1" value={order} onChange={event=>setOrder(event.target.value)}/></label>
  <fieldset><legend>Habitaciones vinculadas</legend><div className="grid gap-2 sm:grid-cols-2">{rooms.map(room=><label key={room.id} className="flex items-center gap-2"><input type="checkbox" checked={ids.includes(room.id)} onChange={event=>setIds(event.target.checked?[...ids,room.id]:ids.filter(id=>id!==room.id))}/>Habitación {room.numero} · Piso {room.piso}{room.estado==='INACTIVO'?' · Inactiva':''}</label>)}</div></fieldset>
  {error&&<p role="alert" className="text-sm text-red-800">{error}</p>}
  <footer className="flex flex-wrap justify-end gap-2"><button type="button" className="rounded-md border px-3 py-2" onClick={onCancel}>Cancelar edición</button><button type="button" className="rounded-md bg-[#18345C] px-3 py-2 text-white" onClick={save}>Guardar oferta</button></footer>
 </section>;
}
