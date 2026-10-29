'use client';
import AdminRefreshButton from './AdminRefreshButton';
import {ADMIN_DEMO_UNAVAILABLE,isAdminDemoUnavailable} from './adminAvailability';
import {useEffect,useMemo,useState} from 'react';
import {operacion} from '@/lib/api/operaciones';
import {usePublicCatalog} from '@/lib/usePublicCatalog';
import type {HabitacionHotel,EstadoHabHotel,TipoHabitacion} from '@/lib/pms/types';
import PanelHabitaciones from './PanelHabitaciones';
type Room={id:number;numero:string;piso:number;tipoHabitacionId:number;ocupacion:string;condicion:string;estado:string};
type RoomType={id:number;nombre:string;capacidad:number;precioBase:number;descripcion?:string};
export default function ApprovedRoomMapConnected({onEdit}:{onEdit?:(id:string)=>void}){
 const [rooms,setRooms]=useState<(HabitacionHotel&{apiTypeId:number;condicion:string;estadoCatalogo:string;descripcion?:string})[]>([]),[unavailable,setUnavailable]=useState(false),[error,setError]=useState(''),[loading,setLoading]=useState(true),[reload,setReload]=useState(0);
 const {rooms:catalog}=usePublicCatalog();
 const photos=useMemo(()=>Object.fromEntries(rooms.flatMap(row=>{const offer=catalog.find(offer=>offer.apiTypeId===row.apiTypeId);return offer&&!offer.illustrativePhotos&&offer.image?[[row.id,offer.image]]:[];})),[rooms,catalog]);
 useEffect(()=>{const c=new AbortController();setLoading(true);setError('');setUnavailable(false);Promise.all([operacion<Room[]>('admin/catalogos/habitaciones','GET',undefined,c.signal),operacion<RoomType[]>('admin/catalogos/tipos','GET',undefined,c.signal)]).then(([rows,types])=>{
  if(c.signal.aborted)return;
  const next=rows.filter(row=>row.estado==='ACTIVO').map(row=>{const type=types.find(t=>t.id===row.tipoHabitacionId);if(!type)throw Error('No se pudo consultar el tipo de una habitación.');
   const estado:EstadoHabHotel=row.condicion==='FUERA_DE_SERVICIO'?'mantenimiento':row.ocupacion==='OCUPADA'?'ocupada':row.condicion==='EN_LIMPIEZA'?'en-limpieza':'disponible';
   return {id:String(row.id),numero:row.numero,piso:row.piso,tipo:type.nombre as TipoHabitacion,capacidad:type.capacidad,precioNoche:type.precioBase,estado,apiTypeId:row.tipoHabitacionId,condicion:row.condicion,estadoCatalogo:row.estado,descripcion:type.descripcion};
  });
  setRooms(next);
 }).catch(e=>{if(!c.signal.aborted){setUnavailable(isAdminDemoUnavailable(e));setError(isAdminDemoUnavailable(e)?ADMIN_DEMO_UNAVAILABLE:e instanceof Error?e.message:'No se pudo consultar el mapa.');}}).finally(()=>{if(!c.signal.aborted)setLoading(false);});return()=>c.abort();},[reload]);
 if(loading||error)return <section className="flex-1 overflow-auto bg-[#F8F6F0] p-4 sm:p-6"><h1 className="text-[32px] font-semibold text-[#18345C]">Mapa de habitaciones</h1>{loading?<div className="mt-4 flex items-center justify-between gap-3"><p role="status">Consultando habitaciones…</p><AdminRefreshButton loading={loading} onClick={()=>setReload(n=>n+1)}/></div>:<><p role="alert" className="mt-4 text-red-800">{error}</p><AdminRefreshButton loading={loading} disabled={unavailable} onClick={()=>setReload(n=>n+1)} className="mt-4"/></>}</section>;
 return <PanelHabitaciones onEditarHabitacion={onEdit} detalles={Object.fromEntries(rooms.map(row=>{const offer=catalog.find(offer=>offer.apiTypeId===row.apiTypeId);return [row.id,{descripcion:row.descripcion,fotos:offer&&!offer.illustrativePhotos?offer.gallery:[],servicios:offer?.verifiedFeatures}];}))} conectado habitaciones={rooms} reservas={[]} huespedes={[]} fotos={photos} condiciones={Object.fromEntries(rooms.map(r=>[r.id,r.condicion]))} estadosCatalogo={Object.fromEntries(rooms.map(r=>[r.id,r.estadoCatalogo]))}/>;
}
