'use client';
export type FeatureDraft={capacidad:string;superficieM2:string;camas:{tipo:string;cantidad:string}[];caracteristicas:string};
export const featureDraft=(value?:{capacidad?:number;superficieM2?:number;camas?:Record<string,number>;caracteristicas?:string[]}):FeatureDraft=>({capacidad:value?.capacidad?.toString()??'',superficieM2:value?.superficieM2?.toString()??'',camas:Object.entries(value?.camas??{}).map(([tipo,cantidad])=>({tipo,cantidad:String(cantidad)})),caracteristicas:(value?.caracteristicas??[]).join('\n')});
export const lines=(value:string)=>value.split('\n').map(item=>item.trim()).filter(Boolean);
export function featureInput(value:FeatureDraft){
 const capacidad=Number(value.capacidad),superficieM2=Number(value.superficieM2),camas:Record<string,number>=Object.create(null);
 if(!Number.isInteger(capacidad)||capacidad<1||!Number.isFinite(superficieM2)||superficieM2<0.01)throw Error('Revisa la capacidad y la superficie.');
 if(!value.camas.length||value.camas.length>20)throw Error('Registra al menos un tipo de cama.');
 for(const bed of value.camas){const key=bed.tipo.trim(),amount=Number(bed.cantidad);if(!key||key.length>40||Object.hasOwn(camas,key)||!Number.isInteger(amount)||amount<1||amount>30)throw Error('Revisa los tipos y cantidades de camas.');camas[key]=amount;}
 const caracteristicas=lines(value.caracteristicas);if(caracteristicas.length>100||caracteristicas.some(text=>text.length>200))throw Error('Revisa las características y servicios.');
 return {capacidad,superficieM2,camas,caracteristicas};
}
const BED_TYPES=['King','Queen','Matrimonial','Individual','Doble','Litera','Sofá cama'];
const ROOM_FEATURES=['Wi-Fi','Televisión','Aire acondicionado','Baño privado','Minibar','Balcón','Caja fuerte','Escritorio','Secador de cabello','Cafetera'];
export default function RoomOfferFields({value,onChange,maxCapacity}:{value:FeatureDraft;onChange:(value:FeatureDraft)=>void;maxCapacity:number}){
 const selected=lines(value.caracteristicas);
 const other=selected.filter(item=>!ROOM_FEATURES.includes(item));
 const updateOther=(text:string)=>onChange({...value,caracteristicas:[...ROOM_FEATURES.filter(item=>selected.includes(item)),...lines(text)].join('\n')});
 return <div className="grid min-w-0 gap-3 sm:grid-cols-2">
  <label>Capacidad<input required type="number" min="1" max={maxCapacity} step="1" value={value.capacidad} onChange={event=>onChange({...value,capacidad:event.target.value})}/></label>
  <label>Superficie (m²)<input required type="number" min="0.01" step="0.01" value={value.superficieM2} onChange={event=>onChange({...value,superficieM2:event.target.value})}/></label>
  <fieldset className="min-w-0 sm:col-span-2"><legend className="mb-2 font-semibold">Distribución de camas</legend>
   <div className="space-y-2">{value.camas.map((bed,index)=><div key={index} className="grid min-w-0 grid-cols-[minmax(0,1fr)_85px_42px] items-end gap-2">
    <label className="min-w-0 text-sm">Tipo de cama<select required aria-label={'Tipo de cama '+(index+1)} className="mt-1 w-full min-w-0 rounded-md border p-2" value={bed.tipo} onChange={event=>onChange({...value,camas:value.camas.map((item,i)=>i===index?{...item,tipo:event.target.value}:item)})}>
     <option value="">Seleccionar</option>{bed.tipo&&!BED_TYPES.includes(bed.tipo)&&<option value={bed.tipo}>{bed.tipo}</option>}{BED_TYPES.filter(type=>type===bed.tipo||!value.camas.some(item=>item.tipo===type)).map(type=><option key={type} value={type}>{type}</option>)}
    </select></label>
    <label className="text-sm">Cantidad<input required aria-label={'Cantidad de camas '+(index+1)} className="mt-1 w-full rounded-md border p-2" type="number" min="1" max="30" step="1" value={bed.cantidad} onChange={event=>onChange({...value,camas:value.camas.map((item,i)=>i===index?{...item,cantidad:event.target.value}:item)})}/></label>
    <button type="button" aria-label={'Quitar tipo de cama '+(index+1)} title="Eliminar cama" className="grid h-10 w-10 place-items-center rounded-md border text-[#18345C]" onClick={()=>onChange({...value,camas:value.camas.filter((_,i)=>i!==index)})}>✕</button>
   </div>)}</div>
   <button type="button" className="mt-3 rounded-md border border-[#18345C] px-3 py-2 text-sm font-semibold text-[#18345C]" disabled={value.camas.length>=20} onClick={()=>onChange({...value,camas:[...value.camas,{tipo:'',cantidad:'1'}]})}>+ Agregar otro tipo de cama</button>
  </fieldset>
  <fieldset className="min-w-0 sm:col-span-2"><legend className="mb-2 font-semibold">Características de la habitación</legend>
   <div className="grid gap-2 sm:grid-cols-2">{ROOM_FEATURES.map(feature=><label key={feature} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={selected.includes(feature)} onChange={event=>onChange({...value,caracteristicas:(event.target.checked?[...selected,feature]:selected.filter(item=>item!==feature)).join('\n')})}/>{feature}</label>)}</div>
   <label className="mt-3 block text-sm">Otras características (una por línea)<textarea rows={2} className="mt-1 w-full rounded-md border p-2" value={other.join('\n')} onChange={event=>updateOther(event.target.value)}/></label>
  </fieldset>
 </div>;
}
