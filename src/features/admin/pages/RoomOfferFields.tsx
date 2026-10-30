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
export default function RoomOfferFields({value,onChange,maxCapacity}:{value:FeatureDraft;onChange:(value:FeatureDraft)=>void;maxCapacity:number}){
 return <div className="grid min-w-0 gap-3 sm:grid-cols-2">
  <label>Capacidad<input required type="number" min="1" max={maxCapacity} step="1" value={value.capacidad} onChange={event=>onChange({...value,capacidad:event.target.value})}/></label>
  <label>Superficie (m²)<input required type="number" min="0.01" step="0.01" value={value.superficieM2} onChange={event=>onChange({...value,superficieM2:event.target.value})}/></label>
  <fieldset className="min-w-0 sm:col-span-2"><legend>Tipo y cantidad de camas</legend><div className="grid gap-2">{value.camas.map((bed,index)=><div key={index} className="flex min-w-0 items-end gap-2">
   <label className="min-w-0 flex-1">Tipo de cama {index+1}<input required maxLength={40} value={bed.tipo} onChange={event=>onChange({...value,camas:value.camas.map((item,i)=>i===index?{...item,tipo:event.target.value}:item)})}/></label>
   <label className="w-20 shrink-0">Cantidad {index+1}<input required type="number" min="1" max="30" step="1" value={bed.cantidad} onChange={event=>onChange({...value,camas:value.camas.map((item,i)=>i===index?{...item,cantidad:event.target.value}:item)})}/></label>
   <button type="button" aria-label={'Quitar tipo de cama '+(index+1)} className="min-h-10 rounded-md border px-2" onClick={()=>onChange({...value,camas:value.camas.filter((_,i)=>i!==index)})}>Quitar</button>
  </div>)}</div><button type="button" className="mt-2 min-h-10 rounded-md border px-3" disabled={value.camas.length>=20} onClick={()=>onChange({...value,camas:[...value.camas,{tipo:'',cantidad:'1'}]})}>Agregar tipo de cama</button></fieldset>
  <label className="sm:col-span-2">Características y servicios<textarea rows={3} value={value.caracteristicas} onChange={event=>onChange({...value,caracteristicas:event.target.value})}/></label>
 </div>;
}
