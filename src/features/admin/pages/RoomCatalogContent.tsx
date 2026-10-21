'use client';
import { usePublicCatalog } from '@/lib/usePublicCatalog';
import Image from 'next/image';
import { ImagePlus } from 'lucide-react';

/** Read-only until the administrative offer and photograph contracts are implemented. */
export default function RoomCatalogContent({ typeId }: { typeId?: number }) {
  const { rooms, loading, error, connected } = usePublicCatalog();
  const offers = typeId ? rooms.filter(room => room.apiTypeId === typeId) : [];
  return <section className="mt-4 rounded-lg border border-[#E5E0D8] bg-[#F8F6F0] p-3" aria-label="Contenido del catálogo público">
    <h3 className="font-semibold">Contenido del catálogo público</h3>
    <p className="mt-1 text-sm text-[#536579]">Guardar la categoría no publica una oferta ni actualiza su precio público. La edición y vinculación del contenido dependen de API #83; la carga de fotografías depende de API #82.</p>
    <fieldset disabled className="mt-3 grid gap-3 sm:grid-cols-2">
      <legend className="sr-only">Funciones pendientes de conexión</legend>
      <label className="text-sm">
        Fotografía principal y galería
        <input type="file" multiple accept="image/jpeg,image/png" className="peer sr-only"
          aria-label="Fotografía principal y galería" aria-describedby="category-images-hint" />
        <span aria-hidden="true" className="mt-1 flex min-h-10 items-center justify-center gap-2 rounded-md border border-[#D9DFE5] bg-white px-3 py-2 text-[#536579] peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[#426D98] peer-disabled:opacity-60">
          <ImagePlus size={17} />Seleccionar imágenes
        </span>
        <small id="category-images-hint" className="mt-1 block text-[#536579]">Ninguna imagen seleccionada. JPG o PNG; máximo 5 MiB por imagen. Carga pendiente de API #82.</small>
      </label>
      <label className="text-sm">Superficie (m²)<input type="number" placeholder="Pendiente de conexión" className="mt-1 w-full rounded-md border bg-white p-2" /></label>
      <label className="text-sm">Tipo y cantidad de camas<input placeholder="Pendiente de conexión" className="mt-1 w-full rounded-md border bg-white p-2" /></label>
      <label className="text-sm">Publicación de la oferta<select className="mt-1 w-full rounded-md border bg-white p-2"><option>Pendiente de conexión</option></select></label>
      <label className="text-sm sm:col-span-2">Características y servicios<textarea placeholder="Pendiente de conexión" rows={2} className="mt-1 w-full rounded-md border bg-white p-2" /></label>
    </fieldset>
    {loading ? <p role="status" className="mt-3 text-sm">Consultando contenido publicado…</p> : error ? <p role="status" className="mt-3 text-sm">No se pudo consultar el catálogo público. Los datos de la categoría se pueden editar por separado.</p> : offers.length ? <details className="mt-3 text-sm">
      <summary className="cursor-pointer font-medium">Ver ofertas asociadas actualmente ({offers.length}){!connected ? ' · Demostración' : ''}</summary>
      {offers.map(offer => <article key={offer.slug} className="mt-3 border-t border-[#E5E0D8] pt-3">
        <h4 className="font-semibold">{offer.name}</h4><p>{offer.description}</p>
        <p className="mt-1">Precio público: Q{offer.price} · Capacidad: {offer.capacity}</p>
        {offer.beds && <p>Camas: {offer.beds}</p>}
        {connected ? null : <p>Superficie de demostración: {offer.size} m²</p>}
        <p>{(connected ? offer.verifiedFeatures ?? [] : offer.features).join(' · ')}</p>
        <div className="mt-2 flex gap-2 overflow-x-auto">{[offer.image, ...(offer.gallery ?? []).filter(src => src !== offer.image)].filter(Boolean).map((src, i) =>
          <Image unoptimized width={112} height={80} key={`${src}-${i}`} src={src} alt={`${offer.name} · ${i === 0 ? 'principal' : `foto ${i + 1}`}`} className="h-20 w-28 shrink-0 rounded-md object-cover" />)}</div>
      </article>)}
    </details> : <p className="mt-3 text-sm">{typeId ? 'No hay ofertas públicas asociadas en el catálogo consultado.' : 'Primero guarde la categoría. La publicación y sus habitaciones compatibles se conectarán con API #83.'}</p>}
  </section>;
}
