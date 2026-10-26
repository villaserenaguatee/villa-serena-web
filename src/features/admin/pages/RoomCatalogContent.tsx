'use client';
import { usePublicCatalog } from '@/lib/usePublicCatalog';
import Image from 'next/image';
import AdminRoomPhotos from './AdminRoomPhotos';

/** Offer publication has no administrative operation in the pinned contract. */
export default function RoomCatalogContent({ typeId,onBusyChange }: { typeId?: number;onBusyChange?:(busy:boolean)=>void }) {
  const { rooms, loading, error, connected } = usePublicCatalog();
  const offers = typeId ? rooms.filter(room => room.apiTypeId === typeId) : [];
  return <section className="mt-4 rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] p-3" aria-label="Contenido del catálogo público">
    <h3 className="font-semibold">Contenido del catálogo público</h3>
    <p className="mt-1 text-sm text-[#536579]">Guardar la categoría no publica una oferta ni actualiza su precio público. API #83 está cerrada y el contrato canónico actual ya define administración de ofertas y características. Esta web sigue fijada a la revisión 77225a1, anterior a esas operaciones: su conexión requiere alinear ese consumidor con el contrato vigente. Las consultas públicas y las fotografías existentes se conservan. Las fotografías usan las operaciones oficiales; si el API no las admite, se informa el error sin simular el guardado.</p>
    <AdminRoomPhotos typeId={typeId} onBusyChange={onBusyChange}/>
    <fieldset disabled className="mt-3 grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">Funciones pendientes de conexión</legend>
      <label className="text-sm">Superficie (m²)<input type="number" placeholder="Pendiente de conexión" className="mt-1 w-full rounded-md border bg-white p-2" /></label>
      <label className="text-sm">Tipo y cantidad de camas<input placeholder="Pendiente de conexión" className="mt-1 w-full rounded-md border bg-white p-2" /></label>
      <label className="text-sm">Publicación de la oferta<select className="mt-1 w-full rounded-md border bg-white p-2"><option>Pendiente de conexión</option></select></label>
      <label className="text-sm sm:col-span-2">Características y servicios<textarea placeholder="Pendiente de conexión" rows={2} className="mt-1 w-full rounded-md border bg-white p-2" /></label>
    </fieldset>
    {loading ? <p role="status" className="mt-3 text-sm">Consultando contenido publicado…</p> : error ? <p role="status" className="mt-3 text-sm">No se pudo consultar el catálogo público. Los datos de la categoría se pueden editar por separado.</p> : offers.length ? <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-medium">Ver ofertas asociadas actualmente ({offers.length}){!connected ? ' · Demostración' : ''}</summary>
      {offers.map(offer => <article key={offer.slug} className="mt-3 border-t border-[#E5E0D8] pt-3">
        <h4 className="font-semibold">{offer.name}</h4><p>{offer.description}</p>
        {offer.illustrativePhotos&&<p className="mt-1 text-sm">El API identifica estas fotografías como ilustrativas, no como fotografías verificadas del hotel.</p>}<p className="mt-1">Precio público: Q{offer.price} · Capacidad: {offer.capacity}</p>
        {offer.beds && <p>Camas: {offer.beds}</p>}
        {connected ? null : <p>Superficie de demostración: {offer.size} m²</p>}
        <p>{(connected ? offer.verifiedFeatures ?? [] : offer.features).join(' · ')}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto">{[offer.image, ...(offer.gallery ?? []).filter(src => src !== offer.image)].filter(Boolean).map((src, i) =>
          <Image unoptimized width={112} height={80} key={`${src}-${i}`} src={src} alt={`${offer.name} · ${i === 0 ? 'principal' : `foto ${i + 1}`}`} className="h-20 w-28 shrink-0 rounded-md object-cover" />)}</div>
      </article>)}
    </details> : <p className="mt-3 text-sm">{typeId ? 'No hay ofertas públicas asociadas en el catálogo consultado.' : 'Primero guarde la categoría. La publicación y sus habitaciones compatibles requieren conectar las operaciones ya definidas en la revisión vigente del contrato.'}</p>}
  </section>;
}
