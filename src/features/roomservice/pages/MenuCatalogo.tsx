import { useMemo, useState } from 'react';
import type { ItemMenu, CategoriaMenu } from '@/lib/pms/types';
const ORDEN_CATEGORIAS: CategoriaMenu[] = [
  'Desayuno',
  'Almuerzo',
  'Entre horarios',
  'Cena',
  'Postres',
  'Bebidas sin alcohol',
  'Bebidas con alcohol',
];
interface Props {
  menu: ItemMenu[];
  onMarcarAgotado: (id: string) => void;
  onReactivar: (id: string) => void;
}
export default function MenuCatalogo({ menu, onMarcarAgotado, onReactivar, }: Props) {
  const [categoria, setCategoria] = useState<CategoriaMenu>('Desayuno');
  const [subcategoria, setSubcategoria] = useState<string>('Todas');
  const [busqueda, setBusqueda] = useState('');
  const categorias = ORDEN_CATEGORIAS.filter((categoriaActual) => menu.some((item) => item.categoria === categoriaActual));
  const subcategorias = useMemo(() => {
    const lista = menu
      .filter((item) => item.categoria === categoria &&
        item.subcategoria &&
        item.subcategoria.trim() !== '')
      .map((item) => item.subcategoria!.trim());
    return Array.from(new Set(lista));
  },
    [menu, categoria]);
  const visibles = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();
    return menu.filter((item) => {
      const coincideCategoria = item.categoria === categoria;
      const coincideSubcategoria = subcategoria === 'Todas' ||
        item.subcategoria === subcategoria;
      const coincideBusqueda = texto === '' ||
        `${item.nombre} ${item.descripcion} ${item.categoria} ${item.subcategoria ?? ''}`
          .toLowerCase()
          .includes(texto);
      return (coincideCategoria &&
        coincideSubcategoria &&
        coincideBusqueda);
    });
  },
    [menu, categoria, subcategoria, busqueda]);
  const cambiarCategoria = (nuevaCategoria: CategoriaMenu) => {
    setCategoria(nuevaCategoria);
    setSubcategoria('Todas');
    setBusqueda('');
  };
  const cambiarDisponibilidad = (item: ItemMenu) => {
    if (item.disponible) {
      onMarcarAgotado(item.id);
    }
    else {
      onReactivar(item.id);
    }
  };
  const nombreCategoria = (categoriaActual: CategoriaMenu) => {
    if (categoriaActual === 'Entre horarios') {
      return 'Fuera de horario';
    }
    return categoriaActual;
  };
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{
    fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif',
  }}>

    <div className="border-b border-[#E5E0D8] bg-white px-4 py-5 sm:px-6">
      <h1 className="text-[32px] font-semibold leading-tight text-[#18345C]">
        Menú y catálogo
      </h1>
    </div>

    <div className="px-4 py-5 sm:px-6">

      <div className="mb-5">
        <div className="flex flex-wrap gap-2">
          {categorias.map((itemCategoria) => (<button
            key={itemCategoria}
            type="button"
            onClick={() => cambiarCategoria(itemCategoria)}
            className={`
                  h-11
                  whitespace-nowrap
                  rounded-lg
                  border
                  px-5
                  text-[14px]
                  font-semibold
                  transition-colors
                  ${categoria === itemCategoria
                ? 'border-[#18345C] bg-[#18345C] text-white'
                : 'border-[#DDD7CD] bg-white text-[#526276] hover:border-[#18345C]'}
                `}>
            {nombreCategoria(itemCategoria)}
          </button>))}
        </div>
      </div>

      {subcategorias.length > 0 && (<div className="mb-5 rounded-xl border border-[#E5E0D8] bg-white p-4">
        <p className="mb-3 text-[12px] font-semibold uppercase tracking-wider text-[#71839B]">
          {nombreCategoria(categoria)}
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSubcategoria('Todas')}
            className={`
                  rounded-lg
                  border
                  px-4
                  py-2
                  text-[13px]
                  font-semibold
                  transition-colors
                  ${subcategoria === 'Todas'
                ? 'border-[#C99A2E] bg-[#FFF8E7] text-[#8A6518]'
                : 'border-[#DDD7CD] bg-white text-[#526276] hover:border-[#C99A2E]'}
                `}>
            Todas
          </button>

          {subcategorias.map((sub) => (<button
            key={sub}
            type="button"
            onClick={() => setSubcategoria(sub)}
            className={`
                    rounded-lg
                    border
                    px-4
                    py-2
                    text-[13px]
                    font-semibold
                    transition-colors
                    ${subcategoria === sub
                ? 'border-[#C99A2E] bg-[#FFF8E7] text-[#8A6518]'
                : 'border-[#DDD7CD] bg-white text-[#526276] hover:border-[#C99A2E]'}
                  `}>
            {sub}
          </button>))}
        </div>
      </div>)}

      <div className="mb-5">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71839B]"
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>

          <input
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar plato o bebida"
            className="
                h-11
                w-full
                rounded-lg
                border
                border-[#DDD7CD]
                bg-white
                pl-10
                pr-3
                text-[14px]
                text-[#1F2933]
                outline-none
                focus:border-[#18345C]
              "/>
        </div>
      </div>

      {visibles.length === 0 ? (<div className="rounded-xl border border-[#E5E0D8] bg-white p-8 text-center">
        <p className="text-[15px] text-[#71839B]">
          No se encontraron productos.
        </p>
      </div>) : (<div className="space-y-3">
        {visibles.map((item) => (<article
          key={item.id}
          className="
                  flex
                  flex-col
                  gap-4
                  rounded-xl
                  border
                  border-[#E5E0D8]
                  bg-white
                  px-5
                  py-4
                  transition-shadow
                  hover:shadow-sm
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                ">
          <div className="min-w-0 flex-1">

            {item.subcategoria && (<p className="text-[11px] font-semibold uppercase tracking-wider text-[#C29222]">
              {item.subcategoria}
            </p>)}

            <h2 className="mt-1 text-[18px] font-semibold text-[#18345C]">
              {item.nombre}
            </h2>

            <p className="mt-1 max-w-5xl text-[14px] leading-relaxed text-[#526276]">
              {item.descripcion}
            </p>
          </div>

          <button
            type="button"
            onClick={() => cambiarDisponibilidad(item)}
            className={`
                    min-w-[118px]
                    shrink-0
                    rounded-lg
                    border
                    px-5
                    py-2.5
                    text-[14px]
                    font-semibold
                    transition-all
                    ${item.disponible
                ? 'border-[#86EFAC] bg-[#F0FAF4] text-[#166534] hover:bg-[#DCFCE7]'
                : 'border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B] hover:bg-[#FEE2E2]'}
                  `}>
            {item.disponible ? 'Disponible' : 'Agotado'}
          </button>
        </article>))}
      </div>)}
    </div>
  </div>);
}
