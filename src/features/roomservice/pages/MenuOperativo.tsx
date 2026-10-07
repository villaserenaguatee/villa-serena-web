'use client';
import type { MenuRS } from '@/lib/api/operaciones';
export default function MenuOperativo({ menu, busy, agotar }: { menu: MenuRS; busy: boolean; agotar: (id: number) => void }) {
  return <section className="overflow-y-auto p-4 sm:p-6 bg-[#F8F6F0] text-[#18345C]"><h1 className="text-[32px] font-semibold">Menú y catálogo</h1>
    {menu.categorias.map(category => <div key={category.id} className="mt-5"><h2 className="text-xl font-semibold">{category.nombre}</h2><div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {menu.items.filter(item => item.categoriaId === category.id).map(item => <article key={item.id} className="rounded-xl border border-[#E5E0D8] bg-white p-4">
        {item.fotoUrl && <img src={item.fotoUrl} alt="" className="h-32 w-full object-cover rounded-lg" />}<h3 className="font-semibold">{item.nombre}</h3><p>{item.descripcion}</p><p>Q {item.precio.toFixed(2)} · {item.disponibilidad === 'DISPONIBLE' ? 'Disponible' : 'Agotado'}</p>
        {item.disponibilidad === 'DISPONIBLE' && <button disabled={busy} onClick={() => agotar(item.id)} className="mt-3 rounded-md bg-[#18345C] text-white px-4 py-2">Marcar agotado</button>}
      </article>)}
    </div></div>)}
    {!menu.items.length && <p className="mt-4">No hay ítems en el menú.</p>}
  </section>;
}
