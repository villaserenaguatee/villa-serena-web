import { useMemo, useState } from 'react';
import type { Insumo, MovimientoInsumo, CategoriaInsumo, TipoMovimiento } from '@/lib/pms/types';
import { formatoFechaHora } from '@/data/pms';
import { dinero, Chip, Campo, INPUT_CLS, CATEGORIA_INSUMO, diasHasta, PlusIcon, AlertIcon, } from '@/features/admin/pages/adminUtils';
const DIAS_ALERTA_VENC = 30;
const MOV_LABEL: Record<TipoMovimiento, string> = { entrada: 'Entrada', salida: 'Salida', merma: 'Merma' };
interface Props {
  insumos: Insumo[];
  movimientos: MovimientoInsumo[];
  onAgregarInsumo: (i: Omit<Insumo, 'id'>) => void;
  onRegistrarMovimiento: (insumoId: string, tipo: TipoMovimiento, cantidad: number, motivo: string) => void;
  integrado?: boolean;
}
export default function Inventario({ insumos, movimientos, onAgregarInsumo, onRegistrarMovimiento, integrado = false }: Props) {
  const [filtro, setFiltro] = useState<CategoriaInsumo | 'todas'>('todas');
  const [formMov, setFormMov] = useState(false);
  const [formInsumo, setFormInsumo] = useState(false);
  const bajoMinimo = useMemo(() => insumos.filter(i => i.stock <= i.stockMinimo), [insumos]);
  const porVencer = useMemo(() => insumos.filter(i => i.vencimiento && diasHasta(i.vencimiento) <= DIAS_ALERTA_VENC), [insumos]);
  const valorTotal = insumos.reduce((s, i) => s + i.stock * i.costoUnitario, 0);
  const visibles = insumos
    .filter(i => filtro === 'todas' || i.categoria === filtro)
    .sort((a, b) => Number(a.stock <= a.stockMinimo ? 0 : 1) - Number(b.stock <= b.stockMinimo ? 0 : 1) || a.nombre.localeCompare(b.nombre));
  const movRecientes = [...movimientos].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 8);
  const insumoDe = useMemo(() => new Map(insumos.map(i => [i.id, i])), [insumos]);
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className={`px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8] ${integrado ? 'mt-4 rounded-xl border' : ''}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div>
          <h1 className={`${integrado ? 'text-[22px]' : 'text-[32px]'} font-semibold text-[#18345C] leading-tight`}>
            {integrado ? 'Productos y existencias' : 'Control de inventario'}
          </h1>
          <p className="text-[14px] text-[#AEBCC1] mt-1">{insumos.length} productos registrados</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => {
              setFormInsumo(false);
              setFormMov(true);
            }}
            className="flex items-center gap-2 px-3 py-2.5 text-[14px] font-semibold border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#18345C] hover:text-white transition-colors">
            Registrar movimiento
          </button>
          <button
            onClick={() => {
              setFormMov(false);
              setFormInsumo(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            <PlusIcon /> Nuevo insumo
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi valor={String(insumos.length)} label="Insumos" color="#18345C" />
        <Kpi valor={String(bajoMinimo.length)} label="Bajo mínimo" color={bajoMinimo.length ? '#991B1B' : '#166534'} />
        <Kpi valor={String(porVencer.length)} label={`Vencen ≤ ${DIAS_ALERTA_VENC} días`} color={porVencer.length ? '#9A3412' : '#166534'} />
        <Kpi valor={dinero(valorTotal)} label="Valor del inventario" color="#18345C" />
      </div>
    </div>

    {(bajoMinimo.length > 0 || porVencer.length > 0) && (<div className="px-4 sm:px-6 pt-5 space-y-2">
      {bajoMinimo.length > 0 && (<div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl px-4 py-3">
        <p className="text-[13px] font-semibold text-[#991B1B] flex items-center gap-2">
          <AlertIcon /> Stock bajo mínimo ({bajoMinimo.length})
        </p>
        <p className="text-[13px] text-[#7F1D1D] mt-1">
          {bajoMinimo.map(i => `${i.nombre} (${i.stock}/${i.stockMinimo})`).join(' · ')}
        </p>
      </div>)}
      {porVencer.length > 0 && (<div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-xl px-4 py-3">
        <p className="text-[13px] font-semibold text-[#9A3412] flex items-center gap-2">
          <AlertIcon /> Próximos a vencer ({porVencer.length})
        </p>
        <p className="text-[13px] text-[#7C2D12] mt-1">
          {porVencer.map(i => `${i.nombre} (${diasHasta(i.vencimiento!)} días)`).join(' · ')}
        </p>
      </div>)}
    </div>)}

    {formMov && (<ModalFormulario onCerrar={() => setFormMov(false)}>
      <FormMovimiento
        insumos={insumos}
        onCancelar={() => setFormMov(false)}
        onGuardar={(id, tipo, cant, motivo) => {
          onRegistrarMovimiento(id, tipo, cant, motivo);
          setFormMov(false);
        }} />
    </ModalFormulario>)}
    {formInsumo && (<ModalFormulario onCerrar={() => setFormInsumo(false)}>
      <FormInsumo onCancelar={() => setFormInsumo(false)} onGuardar={x => {
        onAgregarInsumo(x);
        setFormInsumo(false);
      }} />
    </ModalFormulario>)}

    <div className="px-4 sm:px-6 pt-5 flex gap-2 flex-wrap">
      <BotonFiltro activo={filtro === 'todas'} onClick={() => setFiltro('todas')}>Todas</BotonFiltro>
      {CATEGORIA_INSUMO.map(c => (<BotonFiltro key={c} activo={filtro === c} onClick={() => setFiltro(c)}>
        {c}
      </BotonFiltro>))}
    </div>

    <div className="px-4 sm:px-6 py-5">
      <div className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 px-4 py-3 bg-[#F8F6F0] border-b border-[#E5E0D8] text-[11px] text-[#AEBCC1] uppercase tracking-widest font-medium">
          <span className="col-span-4">Insumo</span>
          <span className="col-span-3">Stock / mínimo</span>
          <span className="col-span-2 text-right">Costo unitario</span>
          <span className="col-span-2 text-right">Valor</span>
          <span className="col-span-1 text-right">Vencimiento</span>
        </div>
        <div className="divide-y divide-[#F0EBE3]">
          {visibles.map(i => {
            const bajo = i.stock <= i.stockMinimo;
            const pct = Math.min(100, Math.round((i.stock / Math.max(1, i.stockMinimo * 1.5)) * 100));
            const dias = i.vencimiento ? diasHasta(i.vencimiento) : null;
            return (<div key={i.id} className="grid grid-cols-2 sm:grid-cols-12 gap-y-2 px-4 py-3 items-center text-[13px]">
              <div className="col-span-2 sm:col-span-4">
                <p className="font-medium text-[#1F2933]">
                  {i.nombre}
                </p>
                <p className="text-[12px] text-[#AEBCC1]">{i.categoria} · {i.unidad}</p>
              </div>
              <div className="col-span-2 sm:col-span-3">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold ${bajo ? 'text-[#991B1B]' : 'text-[#18345C]'}`}>
                    {i.stock}
                  </span>
                  <span className="text-[#AEBCC1]">/ {i.stockMinimo}</span>
                  {bajo && <Chip cls="bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">Bajo</Chip>}
                </div>
                <div className="h-1.5 bg-[#EEF0F2] rounded-full overflow-hidden mt-1 max-w-[160px]">
                  <div className={`h-full rounded-full ${bajo ? 'bg-[#EF4444]' : 'bg-[#18345C]'}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              <div className="col-span-1 sm:col-span-2 text-right text-[#6B7280]">
                {dinero(i.costoUnitario)}
              </div>
              <div className="col-span-1 sm:col-span-2 text-right font-medium text-[#18345C]">
                {dinero(i.stock * i.costoUnitario)}
              </div>
              <div className="col-span-2 sm:col-span-1 text-right text-[12px]">
                {dias === null ? (<span className="text-[#AEBCC1]">—</span>) : (<span className={dias <= DIAS_ALERTA_VENC ? 'text-[#9A3412] font-semibold' : 'text-[#6B7280]'}>
                  {dias}d
                </span>)}
              </div>
            </div>);
          })}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-[16px] font-semibold text-[#18345C] mb-3">Movimientos recientes</h2>
        <div className="bg-white border border-[#E5E0D8] rounded-xl divide-y divide-[#F0EBE3]">
          {movRecientes.map(mv => (<div key={mv.id} className="flex items-center gap-3 px-4 py-2.5 text-[13px]">
            <Chip cls={mv.tipo === 'entrada'
              ? 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]'
              : mv.tipo === 'salida'
                ? 'bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]'
                : 'bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]'}>
              {MOV_LABEL[mv.tipo]}
            </Chip>
            <span className="flex-1 min-w-0 text-[#1F2933] truncate">
              {insumoDe.get(mv.insumoId)?.nombre ?? 'Insumo'} · <span className="text-[#6B7280]">
                {mv.motivo}
              </span>
            </span>
            <span className="font-semibold text-[#18345C]">
              {mv.tipo === 'entrada' ? '+' : '−'}
              {mv.cantidad}
            </span>
            <span className="text-[12px] text-[#AEBCC1] hidden sm:block">
              {formatoFechaHora(mv.fecha)}
            </span>
          </div>))}
        </div>
      </div>
    </div>
  </div>);
}
function FormMovimiento({ insumos, onCancelar, onGuardar, }: {
  insumos: Insumo[];
  onCancelar: () => void;
  onGuardar: (insumoId: string, tipo: TipoMovimiento, cantidad: number, motivo: string) => void;
}) {
  const [insumoId, setInsumoId] = useState('');
  const [tipo, setTipo] = useState<TipoMovimiento>('salida');
  const [cantidad, setCantidad] = useState('1');
  const [motivo, setMotivo] = useState('');
  const [otroMotivo, setOtroMotivo] = useState('');
  const [err, setErr] = useState('');
  function guardar() {
    if (!insumoId)
      return setErr('Selecciona un insumo.');
    const c = Number(cantidad);
    if (!c || c <= 0)
      return setErr('Cantidad inválida.');
    const motivoFinal = motivo === 'otro' ? otroMotivo.trim() : motivo;
    if (!motivoFinal)
      return setErr('Selecciona o escribe el motivo.');
    const actual = insumos.find(i => i.id === insumoId);
    if (actual && tipo !== 'entrada' && c > actual.stock)
      return setErr(`Existencias insuficientes. Disponible: ${actual.stock}.`);
    onGuardar(insumoId, tipo, c, motivoFinal);
  }
  const motivos: Record<TipoMovimiento, string[]> = {
    entrada: ['Compra a proveedor', 'Devolución al inventario', 'Retorno de lavandería', 'Ajuste de inventario'],
    salida: ['Consumo de habitación', 'Reposición de minibar', 'Uso en limpieza', 'Entrega a un área', 'Ajuste de inventario'],
    merma: ['Producto vencido', 'Producto dañado', 'Pérdida o extravío', 'Diferencia de inventario'],
  };
  return (<div className="space-y-4">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#B38719]">Actualizar existencias</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#18345C]">Registrar movimiento</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Campo label="Insumo">
        <SelectorInsumo insumos={insumos} value={insumoId} onChange={id => {
          setInsumoId(id);
          setErr('');
        }} />
      </Campo>
      <Campo label="Tipo">
        <select value={tipo} onChange={e => {
          setTipo(e.target.value as TipoMovimiento);
          setMotivo('');
          setOtroMotivo('');
        }} className={INPUT_CLS}>
          <option value="entrada">Entrada</option>
          <option value="salida">Salida</option>
          <option value="merma">Merma</option>
        </select>
      </Campo>
      <Campo label="Cantidad">
        <input type="number" min="1" value={cantidad} onChange={e => {
          setCantidad(e.target.value);
          setErr('');
        }} className={INPUT_CLS} />
      </Campo>
      <Campo label="Motivo del movimiento">
        <select value={motivo} onChange={e => {
          setMotivo(e.target.value);
          setErr('');
        }} className={INPUT_CLS}>
          <option value="">Seleccionar motivo…</option>
          {motivos[tipo].map(opcion => <option key={opcion} value={opcion}>
            {opcion}
          </option>)}
          <option value="otro">Otro motivo…</option>
        </select>
      </Campo>
      {motivo === 'otro' && (<div className="sm:col-start-2">
        <Campo label="Especifica el motivo">
          <input
            type="text"
            value={otroMotivo}
            onChange={e => {
              setOtroMotivo(e.target.value);
              setErr('');
            }}
            placeholder="Escribe una explicación breve"
            className={INPUT_CLS} />
        </Campo>
      </div>)}
    </div>
    {err && <p className="text-xs text-[#991B1B]">
      {err}
    </p>}
    <div className="flex flex-wrap justify-end gap-2 pt-1">
      <button
        onClick={onCancelar}
        className="min-h-11 rounded-md border border-[#E5E0D8] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F8F6F0] transition-colors">Cancelar</button>
      <button
        onClick={guardar}
        className="min-h-11 rounded-md bg-[#18345C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#102747] transition-colors">Guardar movimiento</button>
    </div>
  </div>);
}
function SelectorInsumo({ insumos, value, onChange }: {
  insumos: Insumo[];
  value: string;
  onChange: (id: string) => void;
}) {
  const seleccionado = insumos.find(i => i.id === value);
  const [busqueda, setBusqueda] = useState(seleccionado?.nombre ?? '');
  const [abierto, setAbierto] = useState(false);
  const [categoria, setCategoria] = useState<CategoriaInsumo | 'todas'>('todas');
  const coincidencias = insumos.filter(i => (categoria === 'todas' || i.categoria === categoria)
    && i.nombre.toLowerCase().includes(busqueda.trim().toLowerCase()));
  const resultados = coincidencias.slice(0, 5);
  return (<div className="relative">
    <div className="grid grid-cols-[minmax(0,1fr)_auto] overflow-hidden rounded-md border border-[#D8D2C8] bg-white focus-within:border-[#18345C]">
      <input
        type="text"
        value={busqueda}
        onFocus={() => setAbierto(true)}
        onChange={e => {
          setBusqueda(e.target.value);
          onChange('');
          setAbierto(true);
        }}
        onBlur={() => window.setTimeout(() => setAbierto(false), 160)}
        placeholder="Buscar o elegir de la lista"
        className="min-w-0 px-3 py-2.5 text-sm outline-none"
        autoComplete="off" />
      <select
        aria-label="Filtrar insumos por categoría"
        value={categoria}
        onFocus={() => setAbierto(true)}
        onChange={e => {
          setCategoria(e.target.value as CategoriaInsumo | 'todas');
          setBusqueda('');
          onChange('');
          setAbierto(true);
        }}
        className="max-w-[145px] border-l border-[#E5E0D8] bg-[#F8F6F0] px-2 text-xs text-[#52677F] outline-none">
        <option value="todas">Todas las áreas</option>
        {CATEGORIA_INSUMO.map(c => <option key={c} value={c}>
          {c}
        </option>)}
      </select>
    </div>
    {abierto && (<div className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-[#D8D2C8] bg-white p-1 shadow-xl">
      <p className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#9AA8B7]">
        {busqueda ? `${coincidencias.length} resultados` : categoria === 'todas' ? 'Insumos disponibles' : categoria}
      </p>
      {resultados.length ? resultados.map(i => (<button
        key={i.id}
        type="button"
        onMouseDown={() => {
          onChange(i.id);
          setBusqueda(i.nombre);
          setAbierto(false);
        }}
        className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm text-[#1F2933] hover:bg-[#F3F6FA]">
        <span>
          {i.nombre}
        </span>
        <span className="ml-3 text-xs text-[#71839B]">Stock: {i.stock}</span>
      </button>)) : <p className="px-3 py-3 text-sm text-[#71839B]">No se encontró ese insumo.</p>}
      {coincidencias.length > 5 && <p className="border-t border-[#EEE8DF] px-3 py-2 text-xs text-[#9AA8B7]">Hay {coincidencias.length - 5} más. Escribe el nombre o elige un área para reducir la lista.</p>}
    </div>)}
  </div>);
}
function FormInsumo({ onCancelar, onGuardar, }: {
  onCancelar: () => void;
  onGuardar: (i: Omit<Insumo, 'id'>) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<CategoriaInsumo>('Lencería');
  const [unidad, setUnidad] = useState('Unidad');
  const [otraUnidad, setOtraUnidad] = useState('');
  const [tieneVencimiento, setTieneVencimiento] = useState(false);
  const [stock, setStock] = useState('0');
  const [stockMinimo, setStockMinimo] = useState('10');
  const [costo, setCosto] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [err, setErr] = useState('');
  function guardar() {
    if (!nombre.trim())
      return setErr('El nombre es obligatorio.');
    const c = Number(costo);
    if (!c || c <= 0)
      return setErr('Costo unitario inválido.');
    onGuardar({
      nombre: nombre.trim(),
      categoria,
      unidad: unidad === 'Otro' ? (otraUnidad.trim() || 'Unidad') : unidad,
      stock: Math.max(0, Number(stock) || 0),
      stockMinimo: Math.max(0, Number(stockMinimo) || 0),
      costoUnitario: Math.round(c * 100) / 100,
      vencimiento: tieneVencimiento && vencimiento ? vencimiento : undefined,
    });
  }
  return (<div className="space-y-4">
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#B38719]">Agregar al catálogo</p>
      <h2 className="mt-1 text-2xl font-semibold text-[#18345C]">Nuevo insumo</h2>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <Campo label="Nombre">
        <input type="text" value={nombre} onChange={e => {
          setNombre(e.target.value);
          setErr('');
        }} className={INPUT_CLS} />
      </Campo>
      <Campo label="Categoría">
        <select value={categoria} onChange={e => setCategoria(e.target.value as CategoriaInsumo)} className={INPUT_CLS}>
          {CATEGORIA_INSUMO.map(c => <option key={c} value={c}>
            {c}
          </option>)}
        </select>
      </Campo>
      <Campo label="Unidad">
        <select value={unidad} onChange={e => setUnidad(e.target.value)} className={INPUT_CLS}>
          {['Unidad', 'Paquete', 'Botella', 'Caja', 'Litro', 'Kg', 'Par', 'Juego', 'Rollo', 'Otro'].map(u => <option key={u} value={u}>
            {u}
          </option>)}
        </select>
      </Campo>
      {unidad === 'Otro' && <Campo label="Especificar unidad">
        <input value={otraUnidad} onChange={e => setOtraUnidad(e.target.value)} className={INPUT_CLS} />
      </Campo>}
      <Campo label="Costo unitario">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-[#18345C]">Q</span>
          <input
            type="number"
            min="0"
            value={costo}
            onChange={e => {
              setCosto(e.target.value);
              setErr('');
            }}
            placeholder="0.00"
            className={`${INPUT_CLS} pl-8`} />
        </div>
      </Campo>
      <Campo label="Stock inicial">
        <input type="number" min="0" value={stock} onChange={e => setStock(e.target.value)} className={INPUT_CLS} />
      </Campo>
      <Campo label="Stock mínimo">
        <input type="number" min="0" value={stockMinimo} onChange={e => setStockMinimo(e.target.value)} className={INPUT_CLS} />
      </Campo>
      <Campo label="¿Tiene vencimiento?">
        <select value={tieneVencimiento ? 'si' : 'no'} onChange={e => setTieneVencimiento(e.target.value === 'si')} className={INPUT_CLS}>
          <option value="no">No</option>
          <option value="si">Sí</option>
        </select>
      </Campo>
      {tieneVencimiento && <Campo label="Fecha de vencimiento">
        <input type="date" value={vencimiento} onChange={e => setVencimiento(e.target.value)} className={INPUT_CLS} />
      </Campo>}
    </div>
    {err && <p className="text-xs text-[#991B1B]">
      {err}
    </p>}
    <div className="flex flex-wrap justify-end gap-2 pt-1">
      <button
        onClick={onCancelar}
        className="min-h-11 rounded-md border border-[#E5E0D8] px-4 py-2 text-sm text-[#6B7280] hover:bg-[#F8F6F0] transition-colors">Cancelar</button>
      <button
        onClick={guardar}
        className="min-h-11 rounded-md bg-[#18345C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#102747] transition-colors">Guardar insumo</button>
    </div>
  </div>);
}
function BotonFiltro({ activo, onClick, children }: {
  activo: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (<button
    onClick={onClick}
    className={`text-[13px] font-medium px-3 py-1.5 rounded-md border transition-colors ${activo ? 'bg-[#18345C] text-white border-[#18345C]' : 'bg-white text-[#6B7280] border-[#E5E0D8] hover:bg-[#F8F6F0]'}`}>
    {children}
  </button>);
}
function ModalFormulario({ children, onCerrar }: {
  children: React.ReactNode;
  onCerrar: () => void;
}) {
  return <div
    className="fixed inset-0 z-50 flex items-end justify-center bg-[#071D34]/45 sm:items-center sm:p-4"
    onMouseDown={e => {
      if (e.target === e.currentTarget)
        onCerrar();
    }}>
    <section className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-5">
      <button
        onClick={onCerrar}
        aria-label="Cerrar"
        className="absolute right-5 top-4 grid h-9 w-9 place-items-center rounded-full border border-[#E5E0D8] text-xl text-[#71839B] hover:bg-[#F8F6F0]">×</button>
      {children}
    </section>
  </div>;
}
function Kpi({ valor, label, color }: {
  valor: string;
  label: string;
  color: string;
}) {
  return (<div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-2.5">
    <p className="text-[20px] font-bold leading-none" style={{ color }}>
      {valor}
    </p>
    <p className="text-[11px] text-[#6B7280] mt-1">
      {label}
    </p>
  </div>);
}
