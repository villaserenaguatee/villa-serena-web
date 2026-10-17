'use client';
import type { MenuRS } from '@/lib/api/operaciones';
import {useContentTranslation} from '@/lib/translation/useContentTranslation';
export default function MenuOperativo({ menu, busy, agotar }: { menu: MenuRS; busy: boolean; agotar: (id: number) => void }) {
  const tr=useContentTranslation([...menu.categorias.map(c=>c.nombre),...menu.items.flatMap(i=>[i.nombre,i.descripcion??''])],'menu-item');
  return <section className="overflow-y-auto p-4 sm:p-6 bg-[#F8F6F0] text-[#18345C]"><h1 className="text-[32px] font-semibold">Menú y catálogo</h1>
    {tr.loading&&<p role="status">Translating menu… Original content is shown.</p>}{tr.failed&&<p role="status">{tr.en?'Translation unavailable. Original content is shown.':'No se pudo traducir. Se muestra el contenido original.'} <button onClick={tr.retry} className="underline">{tr.en?'Retry':'Reintentar'}</button></p>}
    {menu.categorias.map(category => <div key={category.id} className="mt-5"><h2 translate="no" className="text-xl font-semibold">{tr.text(category.nombre)}</h2><div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {menu.items.filter(item => item.categoriaId === category.id).map(item => <article key={item.id} className="rounded-xl border border-[#E5E0D8] bg-white p-4">
        {item.fotoUrl && <img src={item.fotoUrl} alt="" className="h-32 w-full object-cover rounded-lg" />}<h3 translate="no" className="font-semibold">{tr.text(item.nombre)}</h3><p translate="no">{tr.text(item.descripcion??'')}</p><p>Q {item.precio.toFixed(2)} · {item.disponibilidad === 'DISPONIBLE' ? 'Disponible' : 'Agotado'}</p>
        {item.disponibilidad === 'DISPONIBLE' && <button disabled={busy} onClick={() => agotar(item.id)} className="mt-3 rounded-md bg-[#18345C] text-white px-4 py-2">Marcar agotado</button>}
      </article>)}
    </div></div>)}
    {!menu.items.length && <p className="mt-4">No hay ítems en el menú.</p>}
  </section>;
}
