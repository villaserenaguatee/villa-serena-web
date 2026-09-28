import { fechaHotel } from "@/lib/hotel";
import { useMemo, useState } from 'react';
import type { CompraHotel, Insumo, MovimientoInsumo, TipoMovimiento } from '@/lib/pms/types';
import Inventario from '@/features/admin/pages/Inventario';
import { dinero, INPUT_CLS } from '@/features/admin/pages/adminUtils';
import { exportXlsx } from '@/lib/pms/exportXlsx';
type Tab = 'resumen' | 'productos' | 'compras' | 'movimientos' | 'proveedores' | 'reportes';
interface Props {
  insumos: Insumo[];
  movimientos: MovimientoInsumo[];
  compras: CompraHotel[];
  onAgregarInsumo: (i: Omit<Insumo, 'id'>) => void;
  onRegistrarMovimiento: (insumoId: string, tipo: TipoMovimiento, cantidad: number, motivo: string) => void;
  onRegistrarCompra: (c: Omit<CompraHotel, 'id' | 'subtotal' | 'impuesto' | 'total'>) => void;
}
export default function ComprasInventario(props: Props) {
  const [tab, setTab] = useState<Tab>('resumen');
  const [formCompra, setFormCompra] = useState(false);
  const valorInventario = props.insumos.reduce((s, i) => s + i.stock * i.costoUnitario, 0);
  const totalCompras = props.compras.reduce((s, c) => s + c.total, 0);
  const bajos = props.insumos.filter(i => i.stock <= i.stockMinimo).length;
  const proveedores = useMemo(() => [...new Set(props.compras.map(c => c.proveedor))], [props.compras]);
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-4 sm:p-6" style={{ fontFamily: '"Afacad", sans-serif' }}>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold text-[#18345C]">Compras e inventario</h1>
        <p className="mt-1 text-sm text-[#71839B]">Compras, existencias y consumos de todas las áreas del hotel.</p>
      </div>
      <button onClick={() => setFormCompra(true)} className="rounded-md bg-[#18345C] px-4 py-2.5 text-sm font-semibold text-white">+ Registrar compra</button>
    </div>
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {([['resumen', 'Resumen'],
      ['productos', 'Productos'],
      ['compras', 'Compras'],
      ['movimientos', 'Movimientos'],
      ['proveedores', 'Proveedores'],
      ['reportes', 'Reportes']] as [
        Tab,
        string
      ][]).map(([id, label]) => <button
        key={id}
        onClick={() => setTab(id)}
        className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium ${tab === id ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E0DAD0] bg-white text-[#52677F]'}`}>
        {label}
      </button>)}
    </div>

    {tab === 'resumen' && <>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Valor de existencias" value={dinero(valorInventario)} />
        <Kpi label="Compras registradas" value={dinero(totalCompras)} />
        <Kpi label="Productos bajo mínimo" value={String(bajos)} alerta={bajos > 0} />
        <Kpi label="Proveedores activos" value={String(proveedores.length)} />
      </div>
      <div className="mt-5">
        <Panel titulo="Atención requerida">
          {props.insumos.filter(i => i.stock <= i.stockMinimo).slice(0, 5).map(i => <div key={i.id} className="flex justify-between border-b border-[#EEE8DF] py-2 text-sm">
            <span>
              {i.nombre}
            </span>
            <span className="font-semibold text-red-700">{i.stock} / {i.stockMinimo}</span>
          </div>)}
        </Panel>
      </div>
    </>}
    {tab === 'productos' && <Inventario {...props} integrado />}
    {tab === 'compras' && <TablaCompras compras={props.compras} insumos={props.insumos} />}
    {tab === 'movimientos' && <TablaMovimientos movimientos={props.movimientos} insumos={props.insumos} />}
    {tab === 'proveedores' && <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {proveedores.map(p => {
        const cs = props.compras.filter(c => c.proveedor === p);
        return <div key={p} className="rounded-xl border border-[#E5E0D8] bg-white p-4">
          <p className="font-semibold text-[#18345C]">
            {p}
          </p>
          <p className="mt-2 text-sm text-[#71839B]">{cs.length} compras registradas</p>
          <p className="mt-1 text-lg font-semibold text-[#18345C]">
            {dinero(cs.reduce((s, c) => s + c.total, 0))}
          </p>
        </div>;
      })}
    </div>}
    {tab === 'reportes' && <Reportes compras={props.compras} movimientos={props.movimientos} insumos={props.insumos} />}

    {formCompra && <Modal onClose={() => setFormCompra(false)}>
      <FormCompra
        insumos={props.insumos}
        onCancel={() => setFormCompra(false)}
        onSave={c => {
          props.onRegistrarCompra(c);
          setFormCompra(false);
          setTab('compras');
        }} />
    </Modal>}
  </div>;
}
function Kpi({ label, value, alerta = false }: {
  label: string;
  value: string;
  alerta?: boolean;
}) {
  return <div className="rounded-xl border border-[#E5E0D8] bg-white p-4">
    <p className={`text-2xl font-bold ${alerta ? 'text-red-700' : 'text-[#18345C]'}`}>
      {value}
    </p>
    <p className="mt-1 text-xs text-[#71839B]">
      {label}
    </p>
  </div>;
}
function Panel({ titulo, children }: {
  titulo: string;
  children: React.ReactNode;
}) {
  return <section className="rounded-xl border border-[#E5E0D8] bg-white p-5">
    <h2 className="mb-3 font-semibold text-[#18345C]">
      {titulo}
    </h2>
    {children}
  </section>;
}
function TablaCompras({ compras, insumos }: {
  compras: CompraHotel[];
  insumos: Insumo[];
}) {
  return <div className="overflow-x-auto rounded-xl border border-[#E5E0D8] bg-white">
    <table className="w-full min-w-[760px] text-sm">
      <thead className="bg-[#F4F1EA] text-left text-xs uppercase tracking-wider text-[#71839B]">
        <tr>
          <th className="p-3">Fecha / factura</th>
          <th>Proveedor</th>
          <th>Producto</th>
          <th className="text-right">Subtotal</th>
          <th className="text-right">Impuesto</th>
          <th className="pr-3 text-right">Total</th>
        </tr>
      </thead>
      <tbody>
        {compras.map(c => <tr key={c.id} className="border-t border-[#EEE8DF]">
          <td className="p-3">
            <b>
              {c.fecha}
            </b>
            <br />
            <span className="text-xs text-[#71839B]">
              {c.numeroFactura}
            </span>
          </td>
          <td>
            {c.proveedor}
          </td>
          <td>
            {insumos.find(i => i.id === c.insumoId)?.nombre}
            <br />
            <span className="text-xs text-[#71839B]">{c.cantidad} × {dinero(c.costoUnitario)}</span>
          </td>
          <td className="text-right">
            {dinero(c.subtotal)}
          </td>
          <td className="text-right">
            {dinero(c.impuesto)}
          </td>
          <td className="pr-3 text-right font-semibold text-[#18345C]">
            {dinero(c.total)}
          </td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}
function TablaMovimientos({ movimientos, insumos }: {
  movimientos: MovimientoInsumo[];
  insumos: Insumo[];
}) {
  return <div className="rounded-xl border border-[#E5E0D8] bg-white divide-y divide-[#EEE8DF]">
    {movimientos.map(m => <div key={m.id} className="grid gap-2 p-4 text-sm sm:grid-cols-[110px_1fr_1fr_auto]">
      <span className={`font-semibold ${m.tipo === 'entrada' ? 'text-green-700' : m.tipo === 'merma' ? 'text-red-700' : 'text-blue-700'}`}>
        {m.tipo.toUpperCase()}
      </span>
      <span>
        {insumos.find(i => i.id === m.insumoId)?.nombre}
      </span>
      <span className="text-[#71839B]">
        {m.motivo}
        {m.areaDestino ? ` · ${m.areaDestino}` : ''}
      </span>
      <b>
        {m.tipo === 'entrada' ? '+' : '−'}
        {m.cantidad}
      </b>
    </div>)}
  </div>;
}
function Reportes({ compras, movimientos, insumos }: {
  compras: CompraHotel[];
  movimientos: MovimientoInsumo[];
  insumos: Insumo[];
}) {
  function descargar() {
    const proveedores = [...new Set(compras.map(c => c.proveedor))];
    exportXlsx('compras-inventario-villa-serena.xlsx',
      [
        {
          name: 'Resumen',
          rows: [['Villa Serena — Reporte de compras e inventario'],
          ['Generado', new Date().toLocaleString('es-GT')],
          [],
          ['Compras', compras.length],
          ['Movimientos', movimientos.length],
          ['Productos', insumos.length],
          ['Valor de inventario', insumos.reduce((s, i) => s + i.stock * i.costoUnitario, 0)]]
        },
        {
          name: 'Productos',
          rows: [['Producto', 'Categoría', 'Unidad', 'Stock', 'Stock mínimo', 'Costo unitario', 'Valor'],
          ...insumos.map(i => [i.nombre, i.categoria, i.unidad, i.stock, i.stockMinimo, i.costoUnitario, i.stock * i.costoUnitario])]
        },
        {
          name: 'Compras',
          rows: [['Fecha', 'Factura', 'Proveedor', 'Producto', 'Cantidad', 'Subtotal', 'Impuesto', 'Total', 'Estado'],
          ...compras.map(c => [c.fecha, c.numeroFactura, c.proveedor, insumos.find(i => i.id === c.insumoId)?.nombre || '', c.cantidad, c.subtotal, c.impuesto, c.total, c.estado])]
        },
        {
          name: 'Movimientos',
          rows: [['Fecha', 'Tipo', 'Producto', 'Cantidad', 'Motivo', 'Área'],
          ...movimientos.map(m => [m.fecha, m.tipo, insumos.find(i => i.id === m.insumoId)?.nombre || '', m.cantidad, m.motivo, m.areaDestino || ''])]
        },
        {
          name: 'Proveedores',
          rows: [['Proveedor', 'Compras', 'Total'],
          ...proveedores.map(p => {
            const cs = compras.filter(c => c.proveedor === p);
            return [p, cs.length, cs.reduce((a, c) => a + c.total, 0)];
          })]
        }
      ]);
  }
  return <Panel titulo="Reportes de compras e inventario">
    <div className="grid gap-3 sm:grid-cols-3">
      <Kpi label="Compras" value={String(compras.length)} />
      <Kpi label="Movimientos" value={String(movimientos.length)} />
      <Kpi label="Productos" value={String(insumos.length)} />
    </div>
    <button onClick={descargar} className="mt-4 rounded-md bg-[#18345C] px-4 py-2.5 text-sm font-semibold text-white">Exportar Excel</button>
  </Panel>;
}
function FormCompra({ insumos, onCancel, onSave }: {
  insumos: Insumo[];
  onCancel: () => void;
  onSave: (c: Omit<CompraHotel, 'id' | 'subtotal' | 'impuesto' | 'total'>) => void;
}) {
  const [factura, setFactura] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [fecha, setFecha] = useState(fechaHotel());
  const [insumoId, setInsumoId] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [costo, setCosto] = useState('');
  const [estado, setEstado] = useState<'pagada' | 'pendiente'>('pagada');
  const [ivaIncluido, setIvaIncluido] = useState(true);
  const [error, setError] = useState('');
  const base = (Number(cantidad) || 0) * (Number(costo) || 0), subtotal = ivaIncluido ? base / 1.12 : base, impuesto = ivaIncluido ? base - subtotal : subtotal * .12, total = ivaIncluido ? base : subtotal + impuesto;
  function guardar() {
    if (!factura || !proveedor || !insumoId || subtotal <= 0)
      return setError('Completa la factura, proveedor, producto, cantidad y costo.');
    onSave({ numeroFactura: factura, proveedor, fecha, insumoId, cantidad: Number(cantidad), costoUnitario: Number(costo), estado, ivaIncluido });
  }
  return <div>
    <p className="text-xs font-semibold uppercase tracking-widest text-[#B38719]">Entrada de mercadería</p>
    <h2 className="mb-4 text-2xl font-semibold text-[#18345C]">Registrar compra</h2>
    <div className="grid gap-3 sm:grid-cols-2">
      <Campo label="Número de factura">
        <input className={INPUT_CLS} value={factura} onChange={e => setFactura(e.target.value)} />
      </Campo>
      <Campo label="Proveedor">
        <input className={INPUT_CLS} value={proveedor} onChange={e => setProveedor(e.target.value)} />
      </Campo>
      <Campo label="Fecha">
        <input type="date" className={INPUT_CLS} value={fecha} onChange={e => setFecha(e.target.value)} />
      </Campo>
      <Campo label="Producto">
        <select
          className={INPUT_CLS}
          value={insumoId}
          onChange={e => {
            setInsumoId(e.target.value);
            const i = insumos.find(x => x.id === e.target.value);
            if (i)
              setCosto(String(i.costoUnitario));
          }}>
          <option value="">Seleccionar…</option>
          {insumos.map(i => <option key={i.id} value={i.id}>
            {i.nombre}
          </option>)}
        </select>
      </Campo>
      <Campo label="Cantidad">
        <input type="number" min="1" className={INPUT_CLS} value={cantidad} onChange={e => setCantidad(e.target.value)} />
      </Campo>
      <Campo label="Costo unitario">
        <input type="number" min="0" step=".01" className={INPUT_CLS} value={costo} onChange={e => setCosto(e.target.value)} />
      </Campo>
      <Campo label="Tratamiento de IVA">
        <select className={INPUT_CLS} value={ivaIncluido ? "incluido" : "agregar"} onChange={e => setIvaIncluido(e.target.value === "incluido")}>
          <option value="incluido">IVA incluido en costo</option>
          <option value="agregar">Agregar IVA al costo</option>
        </select>
      </Campo>
      <Campo label="Estado del pago">
        <select className={INPUT_CLS} value={estado} onChange={e => setEstado(e.target.value as 'pagada' | 'pendiente')}>
          <option value="pagada">Pagada</option>
          <option value="pendiente">Pendiente de pago</option>
        </select>
      </Campo>
      <div className="rounded-lg bg-[#F8F6F0] p-3 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <b>
            {dinero(subtotal)}
          </b>
        </div>
        <div className="flex justify-between">
          <span>IVA (12%)</span>
          <b>
            {dinero(impuesto)}
          </b>
        </div>
        <div className="mt-2 flex justify-between border-t pt-2 text-[#18345C]">
          <span>Total</span>
          <b>
            {dinero(total)}
          </b>
        </div>
      </div>
    </div>
    {error && <p className="mt-3 text-sm text-red-700">
      {error}
    </p>}
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      <button onClick={onCancel} className="min-h-11 rounded-md border px-4 py-2 text-sm">Cancelar</button>
      <button onClick={guardar} className="min-h-11 rounded-md bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Guardar compra</button>
    </div>
  </div>;
}
function Campo({ label, children }: {
  label: string;
  children: React.ReactNode;
}) {
  return <label className="block">
    <span className="mb-1 block text-xs uppercase tracking-wider text-[#71839B]">
      {label}
    </span>
    {children}
  </label>;
}
function Modal({ children, onClose }: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return <div
    onMouseDown={e => e.target === e.currentTarget && onClose()}
    className="fixed inset-0 z-50 flex items-end justify-center bg-[#071D34]/50 sm:items-center sm:p-4">
    <section className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-xl sm:rounded-2xl sm:p-4">
      <button onClick={onClose} className="absolute right-5 top-4 text-2xl text-[#71839B]">×</button>
      {children}
    </section>
  </div>;
}
