'use client';
import type {HotelEditorial} from './useHotelEditorial';
import type {CatalogRoom} from '@/lib/usePublicCatalog';
import {resolveStay,staySlot} from '@/lib/editorial/stays';
import type {EditorialId} from '@/lib/editorial/catalog';
import c from './HotelWebsiteEditor.module.css';
export default function StayEditorialPanel({id,editorial,rooms,disabled}:{id:EditorialId;editorial:HotelEditorial;rooms:CatalogRoom[];disabled:boolean}){
 const slot=staySlot(id)!;const value=resolveStay(slot.id,editorial.state.elements,rooms),current=editorial.state.elements.find(element=>element.id===id);const blocked=disabled||editorial.busy||editorial.loading||!editorial.state.base;
 function update(change:{nombre?:string;texto?:string;ofertaSlugs?:string[]}){editorial.setElement({...current,id,nombre:value.name,texto:value.description,ofertaSlugs:value.slugs,...change});}
 return <div className={c.controls}><label>Nombre<input value={value.name} maxLength={80} disabled={blocked} onChange={event=>update({nombre:event.target.value})}/></label><label>Descripción<textarea value={value.description} maxLength={4000} disabled={blocked} onChange={event=>update({texto:event.target.value})}/></label>{[0,1,2].map(index=><label key={index}>Habitación {index+1}<select value={value.slugs[index]??''} disabled={blocked} onChange={event=>{if(event.target.value&&value.slugs.some((slug,position)=>position!==index&&slug===event.target.value))return;const next=[...value.slugs];next[index]=event.target.value;update({ofertaSlugs:next.filter(Boolean)});}}><option value="">Sin selección</option>{value.slugs[index]&&!rooms.some(room=>room.slug===value.slugs[index])&&<option value={value.slugs[index]}>No disponible</option>}{rooms.map(room=><option key={room.slug} value={room.slug} disabled={value.slugs.some((slug,position)=>position!==index&&slug===room.slug)}>{room.name}</option>)}</select></label>)}</div>;
}
