import { useMemo, useState } from 'react';
import type { ItemMenu, LineaPedido } from '@/lib/pms/types';
import { pisoDeHabitacion } from '@/data/pms';
import { leerHabitaciones } from '@/store/roomStore';
import { leerHuespedes } from '@/store/guestStore';
import { leerReservas } from '@/store/reservationStore';
import { CloseIcon, PhoneIcon, precio, totalLineas } from '@/features/roomservice/pages/rsUtils';
interface Props {
  menu: ItemMenu[];
  onCerrar: () => void;
  onGuardar: (d: {
    habitacionNumero: string;
    huesped: string;
    lineas: LineaPedido[];
    notaGeneral: string;
    lugarEntrega: string;
  }) => void;
}
const CATS = ['Desayuno', 'Almuerzo', 'Entre horarios', 'Cena', 'Postres', 'Bebidas sin alcohol', 'Bebidas con alcohol'];
type PersonalizacionCfg = {
  ingredientes?: string[];
  eleccion?: {
    titulo: string;
    opciones: string[];
  };
  extras?: {
    nombre: string;
    precio: number;
  }[];
};
function configPersonalizacion(item: ItemMenu): PersonalizacionCfg | null {
  const n = item.nombre;
  const exact: Record<string, PersonalizacionCfg> = {
    'Desayuno Chapín': {
      ingredientes: ['Frijoles volteados', 'Plátanos fritos', 'Queso fresco', 'Crema', 'Aguacate', 'Tortillas'],
      eleccion: { titulo: 'Preparación de huevos', opciones: ['Revueltos', 'Estrellados'] },
      extras: [{ nombre: 'Tocino', precio: 8 }, { nombre: 'Chorizo', precio: 8 }, { nombre: 'Aguacate', precio: 7 }]
    },
    'Villa Serena': {
      ingredientes: ['Tocino', 'Frijoles', 'Plátanos', 'Aguacate', 'Pan tostado', 'Mantequilla'],
      eleccion: { titulo: 'Preparación', opciones: ['Revueltos', 'Estrellados'] },
      extras: [{ nombre: 'Tocino adicional', precio: 8 }, { nombre: 'Aguacate', precio: 7 }]
    },
    'Huevos Rancheros': {
      ingredientes: ['Salsa ranchera', 'Frijoles', 'Queso fresco', 'Aguacate', 'Tortilla'],
      eleccion: { titulo: 'Preparación', opciones: ['Estrellados', 'Revueltos'] },
      extras: [{ nombre: 'Tocino', precio: 8 }, { nombre: 'Chorizo', precio: 8 }]
    },
    'Alitas': {
      ingredientes: ['Papas fritas', 'Apio', 'Ranch'],
      eleccion: { titulo: 'Salsa', opciones: ['BBQ', 'Búfalo'] },
      extras: [{ nombre: 'Papas', precio: 8 }, { nombre: 'Ranch', precio: 5 }, { nombre: 'Salsa', precio: 4 }]
    },
    'Carne Asada': {
      ingredientes: ['Frijoles', 'Guacamole', 'Cebollines', 'Papa', 'Tortillas'],
      eleccion: { titulo: 'Término', opciones: ['Medio', '¾', 'Bien cocido'] },
      extras: [{ nombre: 'Guacamole', precio: 8 }, { nombre: 'Frijoles', precio: 6 }]
    },
    'Brownie con Helado': {
      ingredientes: ['Salsa de chocolate', 'Crema batida'],
      eleccion: { titulo: 'Helado', opciones: ['Vainilla', 'Chocolate', 'Fresa'] },
      extras: [{ nombre: 'Helado adicional', precio: 8 }, { nombre: 'Fresas', precio: 5 }, { nombre: 'Caramelo', precio: 4 }]
    },
  };
  if (exact[n])
    return exact[n];
  if (item.subcategoria === 'Hamburguesas')
    return {
      ingredientes: ['Queso', 'Lechuga', 'Tomate', 'Cebolla'],
      eleccion: { titulo: 'Término', opciones: ['Medio', '¾', 'Bien cocido'] },
      extras: [{ nombre: 'Tocino', precio: 7 }, { nombre: 'Aguacate', precio: 7 }, { nombre: 'Queso', precio: 5 }]
    };
  if (item.subcategoria === 'Pastas')
    return { ingredientes: ['Parmesano'], extras: [{ nombre: 'Pan de ajo', precio: 8 }, { nombre: 'Parmesano', precio: 5 }, { nombre: 'Pollo', precio: 12 }] };
  if (item.categoria === 'Bebidas con alcohol' && /(vino|espumoso)/i.test(item.nombre))
    return { ingredientes: [], eleccion: { titulo: 'Presentación', opciones: ['Copa', 'Botella'] }, extras: [] };
  if (item.categoria === 'Bebidas con alcohol')
    return { ingredientes: [], eleccion: { titulo: 'Servicio', opciones: ['Normal', 'Con hielo', 'Poco hielo'] }, extras: [] };
  return item.subcategoria ? { ingredientes: [], extras: [] } : null;
}
export default function NuevoPedidoModal({ menu, onCerrar, onGuardar }: Props) {
  const [piso, setPiso] = useState('1'),
    [habitacion, setHabitacion] = useState(''),
    [categoria, setCategoria] = useState('Desayuno'),
    [subcategoria, setSubcategoria] = useState('Todas'),
    [huesped, setHuesped] = useState(''),
    [nota, setNota] = useState(''),
    [sel, setSel] = useState<Record<string, number>>({}),
    [error, setError] = useState(''),
    [producto, setProducto] = useState<ItemMenu | null>(null),
    [cantidad, setCantidad] = useState(1),
    [eleccion, setEleccion] = useState(''),
    [sinIngredientes, setSinIngredientes] = useState<string[]>([]),
    [extras, setExtras] = useState<Record<string, number>>({}),
    [notaProducto, setNotaProducto] = useState(''),
    [notasLinea, setNotasLinea] = useState<Record<string, string>>({});
  const subcategorias = useMemo(() => ['Todas', ...Array.from(new Set(menu.filter(i => i.disponible && i.categoria === categoria).map(i => i.subcategoria).filter(Boolean) as string[]))], [menu, categoria]);
  const items = useMemo(() => menu.filter(i => i.disponible && i.categoria === categoria && (subcategoria === 'Todas' || i.subcategoria === subcategoria)), [menu, categoria, subcategoria]);
  const lineas: LineaPedido[] = (Object.entries(sel) as [
    string,
    number
  ][]).filter(([, q]) => q > 0).map(([id, q]) => {
    const i = menu.find(x => x.id === id)!;
    return { itemId: id, nombre: i.nombre, precioUnitario: i.precio, cantidad: q, nota: notasLinea[id] || undefined };
  });
  const total = totalLineas(lineas), count = lineas.reduce((a, b) => a + b.cantidad, 0);
  const habitaciones = leerHabitaciones();
  const huespedes = leerHuespedes();
  const chooseRoom = (v: string) => {
    setHabitacion(v);
    const habitacionCentral = habitaciones.find(x => x.numero === v);
    const r = leerReservas().find(x => x.habitacionId === habitacionCentral?.id && ['confirmada', 'en-curso'].includes(x.estado));
    const h = r ? huespedes.find(x => x.id === r.huespedId) : undefined;
    setHuesped(h?.nombre || '');
    setError('');
  };
  const qty = (id: string, d: number) => setSel(s => ({ ...s, [id]: Math.max(0, (s[id] || 0) + d) }));
  const guardar = () => {
    if (!habitacion)
      return setError('Selecciona una habitación.');
    if (!lineas.length)
      return setError('Agrega al menos un platillo.');
    onGuardar({ habitacionNumero: habitacion, huesped: huesped || `Huésped habitación ${habitacion}`, lineas, notaGeneral: nota, lugarEntrega: 'Habitación' });
  };
  return <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
    <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
      <header className="px-5 py-3 border-b flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-[#18345C]">
            <PhoneIcon size={18} />
            <h2 className="text-xl font-semibold">Registrar pedido telefónico</h2>
          </div>
          <p className="text-sm text-[#7B8796] ml-7">Registra un pedido realizado por llamada telefónica del huésped.</p>
        </div>
        <button onClick={onCerrar}>
          <CloseIcon />
        </button>
      </header>
      <div className="p-4 overflow-y-auto flex-1">
        <div className="grid lg:grid-cols-[1fr_300px] gap-4">
          <section>
            <div className="grid sm:grid-cols-[190px_250px_1fr] gap-3 mb-4">
              <label className="text-[10px] uppercase tracking-widest text-[#9AAAB8]">Piso<select
                value={piso}
                onChange={e => {
                  setPiso(e.target.value);
                  setHabitacion('');
                  setHuesped('');
                }}
                className="mt-1 w-full border rounded-md px-3 py-2.5 text-sm text-[#18345C] bg-white">
                <option value="1">Piso 1</option>
                <option value="2">Piso 2</option>
                <option value="3">Piso 3</option>
              </select></label>
              <label className="text-[10px] uppercase tracking-widest text-[#9AAAB8]">Habitación<select
                value={habitacion}
                onChange={e => chooseRoom(e.target.value)}
                className="mt-1 w-full border rounded-md px-3 py-2.5 text-sm text-[#18345C] bg-white">
                <option value="">Seleccionar habitación…</option>
                {habitaciones.filter(h => String(h.piso) === piso).map(h => <option key={h.numero}>
                  {h.numero}
                </option>)}
              </select></label>
              <label className="text-[10px] uppercase tracking-widest text-[#9AAAB8]">Huésped<div className="mt-1 min-h-[46px] border rounded-md px-3 py-2.5 text-sm text-[#18345C] bg-[#FAF8F3]">
                {huesped || 'Selecciona una habitación'}
              </div></label>
            </div>
            <h3 className="text-lg font-semibold text-[#18345C] mb-3">Selecciona los platillos</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {CATS.map(c => <button
                key={c}
                onClick={() => {
                  setCategoria(c);
                  setSubcategoria('Todas');
                }}
                className={`px-4 py-2 rounded-md text-sm whitespace-nowrap ${categoria === c ? 'bg-[#18345C] text-white' : 'bg-[#F5F3EE] text-[#18345C]'}`}>
                {c}
              </button>)}
            </div>
            {subcategorias.length > 1 && <div className="flex gap-2 overflow-x-auto pb-3">
              {subcategorias.map(sc => <button
                key={sc}
                onClick={() => setSubcategoria(sc)}
                className={`px-3 py-1.5 rounded-full border text-xs whitespace-nowrap ${subcategoria === sc ? 'border-[#B88A18] bg-[#FFF9E8] text-[#7A5B12]' : 'border-[#E5E0D8] bg-white text-[#526276]'}`}>
                {sc}
              </button>)}
            </div>}
            <div className="grid sm:grid-cols-2 gap-3">
              {items.map(i => <article key={i.id} className="border border-[#E5E0D8] rounded-xl bg-white overflow-hidden flex flex-col">
                {i.foto && <img src={i.foto} alt={i.nombre} className="w-full h-28 object-cover" />}
                <div className="p-3 flex-1">
                  <b className="text-[#18345C]">
                    {i.nombre}
                  </b>
                  <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">
                    {i.descripcion}
                  </p>
                  <strong className="text-sm text-[#18345C] mt-1 block">
                    {precio(i.precio)}
                  </strong>
                </div>
                <div className="px-3 pb-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => {
                      setProducto(i);
                      setCantidad(Math.max(1, sel[i.id] || 1));
                      setEleccion('');
                      setSinIngredientes([]);
                      setExtras({});
                      setNotaProducto(notasLinea[i.id] || '');
                    }}
                    className="px-3 py-2 rounded-lg bg-[#18345C] text-white text-xs font-semibold">Personalizar</button>
                  <div className="flex items-center border rounded-lg shrink-0">
                    <button onClick={() => qty(i.id, -1)} className="w-8 h-8">−</button>
                    <b className="w-7 text-center">
                      {sel[i.id] || 0}
                    </b>
                    <button onClick={() => qty(i.id, 1)} className="w-8 h-8">+</button>
                  </div>
                </div>
              </article>)}
            </div>
            {!items.length && <p className="p-6 text-[#6B7280]">No hay productos disponibles en esta categoría.</p>}
          </section>
          <aside className="space-y-4">
            <div className="border rounded-xl bg-[#FAF8F3] p-4">
              <h3 className="text-xl font-semibold text-[#18345C]">Pedido actual</h3>
              <p className="text-sm text-[#7B8796] mt-1">{count} ítem(s)</p>
              <div className="my-4 space-y-2">
                {lineas.length ? lineas.map(l => <div key={l.itemId} className="flex justify-between gap-2 text-sm">
                  <span>{l.cantidad} × {l.nombre}</span>
                  <b>
                    {precio(l.cantidad * l.precioUnitario)}
                  </b>
                </div>) : <div className="bg-white rounded-lg p-4 text-center text-[#7B8796]">
                  <b className="block text-[#18345C]">Aún no hay productos</b>
                  <span className="text-xs">Selecciona los platillos del menú.</span>
                </div>}
              </div>
              <div className="border-t pt-3 flex justify-between text-lg">
                <b>Total:</b>
                <b>
                  {precio(total)}
                </b>
              </div>
            </div>
            <label className="block text-sm font-semibold text-[#18345C]">Observaciones del pedido<textarea
              value={nota}
              onChange={e => setNota(e.target.value)}
              placeholder="Alergias, preferencias, indicaciones de entrega…"
              className="mt-2 w-full border rounded-lg p-3 min-h-24 font-normal" /></label>
            {error && <p className="text-sm text-red-700">
              {error}
            </p>}
          </aside>
        </div>
      </div>
      {producto && (() => {
        const cfg = configPersonalizacion(producto);
        const extraTotal = Object.entries(extras).reduce((a, [n, q]) => a + (cfg?.extras?.find(e => e.nombre === n)?.precio || 0) * q, 0);
        const totalProducto = (producto.precio + extraTotal) * cantidad;
        return <div className="absolute inset-0 z-30 bg-black/35 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl shadow-2xl">
            <div className="p-5 border-b flex justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-[#B88A18]">
                  {producto.categoria}
                </p>
                <h3 className="text-2xl font-semibold text-[#18345C]">
                  {producto.nombre}
                </h3>
                <p className="text-sm text-[#6B7280] mt-1">
                  {producto.descripcion}
                </p>
              </div>
              <button onClick={() => setProducto(null)} className="text-2xl text-[#18345C]">×</button>
            </div>
            <div className="p-5 space-y-5">
              {cfg?.ingredientes && cfg.ingredientes.length > 0 && <div>
                <p className="font-semibold text-[#18345C] mb-2">Ingredientes · desmarca para quitar</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {cfg.ingredientes.map(x => <label key={x} className="flex gap-2 items-center border rounded-lg p-2 text-sm">
                    <input
                      type="checkbox"
                      checked={!sinIngredientes.includes(x)}
                      onChange={() => setSinIngredientes(a => a.includes(x) ? a.filter(y => y !== x) : [...a, x])} />
                    {x}
                  </label>)}
                </div>
              </div>}
              {cfg?.eleccion && <div>
                <p className="font-semibold text-[#18345C] mb-2">
                  {cfg.eleccion.titulo}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cfg.eleccion.opciones.map(x => <button
                    key={x}
                    onClick={() => setEleccion(x)}
                    className={`px-3 py-2 rounded-lg border text-sm ${eleccion === x ? 'bg-[#18345C] text-white' : 'bg-white text-[#18345C]'}`}>
                    {x}
                  </button>)}
                </div>
              </div>}
              {cfg?.extras && cfg.extras.length > 0 && <div>
                <p className="font-semibold text-[#18345C] mb-2">Extras</p>
                {cfg.extras.map(e => <div key={e.nombre} className="flex items-center justify-between border-b py-2 text-sm">
                  <span>{e.nombre} · +{precio(e.precio)}</span>
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => setExtras(a => ({ ...a, [e.nombre]: Math.max(0, (a[e.nombre] || 0) - 1) }))} className="w-8 h-8">−</button>
                    <b className="w-7 text-center">
                      {extras[e.nombre] || 0}
                    </b>
                    <button onClick={() => setExtras(a => ({ ...a, [e.nombre]: (a[e.nombre] || 0) + 1 }))} className="w-8 h-8">+</button>
                  </div>
                </div>)}
              </div>}
              <label className="block text-sm font-semibold text-[#18345C]">Indicaciones adicionales<textarea
                value={notaProducto}
                onChange={e => setNotaProducto(e.target.value)}
                className="mt-2 w-full border rounded-lg p-3 min-h-20 font-normal"
                placeholder="Ej. sin cebolla, alergias, preparación…" /></label>
              <div className="flex items-center justify-between">
                <div className="flex items-center border rounded-lg">
                  <button onClick={() => setCantidad(q => Math.max(1, q - 1))} className="w-10 h-10">−</button>
                  <b className="w-9 text-center">
                    {cantidad}
                  </b>
                  <button onClick={() => setCantidad(q => q + 1)} className="w-10 h-10">+</button>
                </div>
                <button
                  onClick={() => {
                    const detalles = [eleccion && `${cfg?.eleccion?.titulo}: ${eleccion}`,
                    sinIngredientes.length && `Sin: ${sinIngredientes.join(', ')}`,
                    Object.entries(extras).filter(([, q]) => q > 0).map(([n, q]) => `${q}× ${n}`).join(', '),
                    notaProducto.trim()].filter(Boolean).join(' · ');
                    setSel(a => ({ ...a, [producto.id]: cantidad }));
                    setNotasLinea(a => ({ ...a, [producto.id]: detalles }));
                    setProducto(null);
                  }}
                  className="px-5 py-3 bg-[#18345C] text-white rounded-lg font-semibold">Agregar · {precio(totalProducto)}</button>
              </div>
            </div>
          </div>
        </div>;
      })()}
      <footer className="px-4 py-3 border-t flex justify-end gap-2 shrink-0">
        <button onClick={onCerrar} className="min-h-11 px-4 py-2 border border-[#18345C] rounded-lg text-[#18345C]">Cancelar</button>
        <button onClick={guardar} className="min-h-11 px-4 py-2 bg-[#18345C] text-white rounded-lg font-semibold">Guardar pedido</button>
      </footer>
    </div>
  </div>;
}
