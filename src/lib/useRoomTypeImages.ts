'use client';
import {useEffect,useMemo,useState} from 'react';
import {getPublicCatalog} from '@/lib/api/public';
import {usePublicCatalog} from '@/lib/usePublicCatalog';
import type {RoomTypeDto} from '@/lib/bff/contracts/public';
// Exact API type-name -> real ID -> approved offer image. No approximate category fallback.
export function useRoomTypeImages(){
 const [types,setTypes]=useState<RoomTypeDto[]>([]);const {rooms}=usePublicCatalog();
 useEffect(()=>{const c=new AbortController();getPublicCatalog(c.signal).then(v=>{if(!c.signal.aborted)setTypes(v);}).catch(()=>{});return()=>c.abort();},[]);
 return useMemo(()=>Object.fromEntries(types.flatMap(type=>{if(types.filter(t=>t.nombre===type.nombre).length!==1)return [];const offer=rooms.find(r=>r.apiTypeId===type.id);return offer?[[type.nombre,offer.image]]:[];})),[types,rooms]);
}
