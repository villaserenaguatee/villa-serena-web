'use client';
import {usePublicCatalog} from '@/lib/usePublicCatalog';
import Image from 'next/image';
export default function RoomCatalogContent(){
 const {rooms,loading,error}=usePublicCatalog();
 if(loading)return <p role="status" className="mt-3 text-sm">Consultando ofertas…</p>;
 if(error)return <p role="alert" className="mt-3 text-sm">No se pudieron consultar las ofertas.</p>;
 return <div className="mt-3 grid gap-3">{rooms.map(offer=><article key={offer.slug} className="rounded-lg border border-[#E5E0D8] bg-white p-3"><h2 className="font-semibold">{offer.name}</h2><p>{offer.description}</p><p className="mt-1">Precio público: Q{offer.price} · Capacidad: {offer.capacity}</p>{offer.beds&&<p>Camas: {offer.beds}</p>}<p>{(offer.verifiedFeatures??[]).join(' · ')}</p><div className="mt-2 flex gap-2 overflow-x-auto">{[...new Set([offer.image,...offer.gallery??[]])].filter(Boolean).map((src,index)=><Image unoptimized key={src} src={src} width={112} height={80} alt={offer.name+' · Fotografía '+(index+1)} className="h-20 w-28 shrink-0 rounded-md object-cover"/>)}</div></article>)}</div>;
}
