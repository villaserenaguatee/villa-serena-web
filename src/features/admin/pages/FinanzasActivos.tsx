import { fechaHotel } from "@/lib/hotel";
import { useMemo, useState } from 'react';
import type { ActivoHotel, CompraHotel, Empleado, GastoHotel, Reserva } from '@/lib/pms/types';
import { dinero, INPUT_CLS } from '@/features/admin/pages/adminUtils';
import { exportXlsx } from '@/lib/pms/exportXlsx';
type Tab = 'resumen' | 'caja' | 'gastos' | 'nomina' | 'activos' | 'reportes';
export default function FinanzasActivos({ empleados, reservas, compras, gastos, activos, onAgregarGasto, onAgregarActivo }: {
  empleados: Empleado[];
  reservas: Reserva[];
  compras: CompraHotel[];
  gastos: GastoHotel[];
  activos: ActivoHotel[];
  onAgregarGasto: (g: Omit<GastoHotel, 'id'>) => void;
  onAgregarActivo: (a: Omit<ActivoHotel, 'id'>) => void;
}) {
  const [tab, setTab] = useState<Tab>('resumen');
  const [modal, setModal] = useState<'gasto' | 'activo' | null>(null);
  const [nominaPagada, setNominaPagada] = useState<string[]>([]);
  const nomina = useMemo(() => empleados.filter(e => e.activo).map(e => {
    const base = e.salarioBase ?? 0, extras = e.bonosExtras ?? 0, descuentos = e.descuentosNomina ?? 0;
    return { e, base, extras, descuentos, neto: Math.max(0, base + extras - descuentos) };
  }),
    [empleados]);
  const ingresos = useMemo(() => reservas.flatMap(r => r.pagos).reduce((s, p) => s + p.monto, 0), [reservas]);
  const totalNomina = nomina.filter(n => nominaPagada.includes(n.e.id)).reduce((s, n) => s + n.neto, 0),
    totalGastos = gastos.reduce((s, g) => s + g.monto, 0) + compras.filter(c => c.estado === 'pagada').reduce((s, c) => s + c.total, 0),
    valorActivos = activos.reduce((s, a) => s + a.costo, 0);
  const tabs: [
    Tab,
    string
  ][] = [['resumen', 'Resumen'], ['caja', 'Caja'], ['gastos', 'Gastos'], ['nomina', 'Nómina'], ['activos', 'Activos'], ['reportes', 'Reportes']];
  return <div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-4 sm:p-6">
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-3xl font-semibold text-[#18345C]">Finanzas</h1>
        <p className="mt-1 text-sm text-[#71839B]">Control financiero, nómina y activos del hotel.</p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => setModal('gasto')} className="rounded-md border border-[#18345C] bg-white px-3 py-2.5 text-sm font-semibold text-[#18345C]">Registrar gasto</button>
        <button onClick={() => setModal('activo')} className="rounded-md bg-[#18345C] px-3 py-2.5 text-sm font-semibold text-white">+ Nuevo activo</button>
      </div>
    </div>
    <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
      {tabs.map(([id, l]) => <button
        key={id}
        onClick={() => setTab(id)}
        className={`whitespace-nowrap rounded-md border px-3 py-2 text-sm font-medium ${tab === id ? 'border-[#18345C] bg-[#18345C] text-white' : 'border-[#E0DAD0] bg-white text-[#52677F]'}`}>
        {l}
      </button>)}
    </div>
    {tab === 'resumen' && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi l="Ingresos del período" v={dinero(ingresos)} />
      <Kpi l="Egresos del período" v={dinero(totalGastos + totalNomina)} />
      <Kpi l="Saldo" v={dinero(ingresos - totalGastos - totalNomina)} />
      <Kpi l="Pagos pendientes" v={String(compras.filter(c => c.estado === 'pendiente').length)} />
    </div>}
    {tab === 'caja' && <Caja ingresos={ingresos} compras={compras} gastos={gastos} nomina={totalNomina} />}
    {tab === 'gastos' && <Gastos compras={compras} gastos={gastos} />}
    {tab === 'nomina' && <Nomina filas={nomina} pagados={nominaPagada} onPagar={id => setNominaPagada(v => v.includes(id) ? v : [...v, id])} />}
    {tab === 'activos' && <Activos activos={activos} />}
    {tab === 'reportes' && <Reportes ingresos={ingresos} compras={compras} gastos={gastos} nominaFilas={nomina.filter(n => nominaPagada.includes(n.e.id))} activos={activos} />}
    {modal && <Modal close={() => setModal(null)}>
      {modal === 'gasto' ? <FormGasto cancel={() => setModal(null)} save={g => {
        onAgregarGasto(g);
        setModal(null);
        setTab('gastos');
      }} /> : <FormActivo cancel={() => setModal(null)} save={a => {
        onAgregarActivo(a);
        setModal(null);
        setTab('activos');
      }} />}
    </Modal>}
  </div>;
}
function Kpi({ l, v }: {
  l: string;
  v: string;
}) {
  return <div className="rounded-xl border border-[#E5E0D8] bg-white p-4">
    <p className="text-2xl font-bold text-[#18345C]">
      {v}
    </p>
    <p className="mt-1 text-xs text-[#71839B]">
      {l}
    </p>
  </div>;
}
function Card({ t, children }: {
  t: string;
  children: React.ReactNode;
}) {
  return <section className="rounded-xl border border-[#E5E0D8] bg-white p-5">
    <h2 className="mb-3 font-semibold text-[#18345C]">
      {t}
    </h2>
    {children}
  </section>;
}
function Linea({ a, b }: {
  a: string;
  b: string;
}) {
  return <div className="flex items-center justify-between border-b border-[#EEE8DF] py-2 text-sm">
    <span>
      {a}
    </span>
    <span className="font-semibold text-[#18345C]">→ {b}</span>
  </div>;
}
function Caja({ ingresos, compras, gastos, nomina }: {
  ingresos: number;
  compras: CompraHotel[];
  gastos: GastoHotel[];
  nomina: number;
}) {
  const egresos = compras.filter(c => c.estado === 'pagada').reduce((s, c) => s + c.total, 0) + gastos.reduce((s, g) => s + g.monto, 0) + nomina;
  return <><div className="grid gap-3 sm:grid-cols-3">
    <Kpi l="Ingresos del período" v={dinero(ingresos)} />
    <Kpi l="Egresos del período" v={dinero(egresos)} />
    <Kpi l="Saldo estimado" v={dinero(ingresos - egresos)} />
  </div><Card t="Origen de los movimientos de caja">
      <Linea a="Reservas, hospedaje y servicios" b={dinero(ingresos)} />
      <Linea a="Compras pagadas" b={dinero(compras.filter(c => c.estado === 'pagada').reduce((s, c) => s + c.total, 0))} />
      <Linea a="Gastos operativos" b={dinero(gastos.reduce((s, g) => s + g.monto, 0))} />
      <Linea a="Pago de nómina" b={dinero(nomina)} />
    </Card></>;
}
function Gastos({ compras, gastos }: {
  compras: CompraHotel[];
  gastos: GastoHotel[];
}) {
  const filas = [...gastos.map(g => ({ id: g.id, fecha: g.fecha, categoria: g.categoria, concepto: g.concepto, ref: g.comprobante, monto: g.monto })),
  ...compras.filter(c => c.estado === 'pagada').map(c => ({ id: c.id, fecha: c.fecha, categoria: 'Compras', concepto: `Compra a ${c.proveedor}`, ref: c.numeroFactura, monto: c.total }))].sort((a, b) => b.fecha.localeCompare(a.fecha));
  return <Tabla heads={['Fecha', 'Categoría', 'Concepto', 'Comprobante', 'Monto']}>
    {filas.map(f => <tr key={f.id} className="border-t">
      <td className="p-3">
        {f.fecha}
      </td>
      <td>
        {f.categoria}
      </td>
      <td>
        {f.concepto}
      </td>
      <td>
        {f.ref}
      </td>
      <td className="pr-3 text-right font-semibold">
        {dinero(f.monto)}
      </td>
    </tr>)}
  </Tabla>;
}
function Nomina({ filas, pagados, onPagar }: {
  filas: any[];
  pagados: string[];
  onPagar: (id: string) => void;
}) {
  const [detalle, setDetalle] = useState<any | null>(null);
  return <><div className="grid gap-3">
    {filas.map(n => <div key={n.e.id} className="grid items-center gap-3 rounded-xl border border-[#E5E0D8] bg-white p-4 sm:grid-cols-[1fr_repeat(4,120px)_auto]">
      <button onClick={() => setDetalle(n)} className="text-left">
        <b className="text-[#18345C]">
          {n.e.nombre}
        </b>
        <p className="text-xs text-[#71839B]">{n.e.codigoEmpleado} · {n.e.rol} · {n.e.turno}</p>
      </button>
      <Dato l="Salario base" v={dinero(n.base)} />
      <Dato l="Bonos y extras" v={dinero(n.extras)} />
      <Dato l="Descuentos" v={dinero(n.descuentos)} />
      <Dato l="Neto a pagar" v={dinero(n.neto)} fuerte />
      <button
        disabled={pagados.includes(n.e.id) || n.neto <= 0}
        onClick={() => onPagar(n.e.id)}
        className="rounded-lg bg-[#18345C] px-3 py-2 text-sm font-semibold text-white disabled:bg-[#D7DCE2] disabled:text-[#71839B]">
        {pagados.includes(n.e.id) ? 'Pagada' : 'Pagar nómina'}
      </button>
    </div>)}
  </div>{detalle && <Modal close={() => setDetalle(null)}>
    <h2 className="text-2xl font-semibold text-[#18345C]">Detalle de nómina</h2>
    <p className="mb-4 text-sm text-[#71839B]">
      {detalle.e.nombre}
    </p>
    <div className="grid gap-2 sm:grid-cols-2">
      <Bloque t="Ingresos">
        <Linea a="Salario base" b={dinero(detalle.base)} />
        <Linea a="Bonos y extras" b={dinero(detalle.extras)} />
      </Bloque>
      <Bloque t="Descuentos">
        <Linea a="Descuentos registrados" b={dinero(detalle.descuentos)} />
      </Bloque>
      <div className="rounded-xl bg-[#18345C] p-4 text-white sm:col-span-2">
        <p className="text-sm">Neto a pagar</p>
        <p className="mt-2 text-3xl font-bold">
          {dinero(detalle.neto)}
        </p>
      </div>
    </div>
  </Modal>}</>;
}
function Dato({ l, v, fuerte = false }: {
  l: string;
  v: string;
  fuerte?: boolean;
}) {
  return <div>
    <p className="text-xs text-[#71839B]">
      {l}
    </p>
    <p className={`${fuerte ? 'text-lg font-bold' : 'font-semibold'} text-[#18345C]`}>
      {v}
    </p>
  </div>;
}
function Bloque({ t, children }: {
  t: string;
  children: React.ReactNode;
}) {
  return <div className="rounded-xl border border-[#E5E0D8] p-4">
    <h3 className="mb-2 font-semibold text-[#18345C]">
      {t}
    </h3>
    {children}
  </div>;
}
function Activos({ activos }: {
  activos: ActivoHotel[];
}) {
  return <div className="grid gap-3 md:grid-cols-2">
    {activos.map(a => <div key={a.id} className="rounded-xl border border-[#E5E0D8] bg-white p-4">
      <div className="flex justify-between gap-2">
        <div>
          <p className="text-xs text-[#B38719]">
            {a.codigo}
          </p>
          <h3 className="font-semibold text-[#18345C]">
            {a.nombre}
          </h3>
        </div>
        <span className="h-fit rounded-full border px-2 py-1 text-xs">
          {a.estado}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#71839B]">{a.categoria} · {a.ubicacion}</p>
      <div className="mt-3 flex justify-between border-t pt-3 text-sm">
        <span>Valor de adquisición</span>
        <b>
          {dinero(a.costo)}
        </b>
      </div>
      {a.vinculadoMantenimiento && <p className="mt-2 text-xs font-semibold text-blue-700">Vinculado con Mantenimiento</p>}
    </div>)}
  </div>;
}
function Reportes({ ingresos, compras, gastos, nominaFilas, activos }: {
  ingresos: number;
  compras: CompraHotel[];
  gastos: GastoHotel[];
  nominaFilas: any[];
  activos: ActivoHotel[];
}) {
  const egresosCompras = compras.filter(c => c.estado === 'pagada').reduce((s, c) => s + c.total, 0);
  const totalNomina = nominaFilas.reduce((s, n) => s + n.neto, 0);
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0) + egresosCompras;
  const valorActivos = activos.reduce((s, a) => s + a.costo, 0);
  function excel() {
    exportXlsx('finanzas-villa-serena.xlsx',
      [{
        name: 'Resumen',
        rows: [['Villa Serena — Reporte financiero'],
        ['Generado', new Date().toLocaleString('es-GT')],
        [],
        ['Ingresos', ingresos],
        ['Egresos', totalGastos + totalNomina],
        ['Nómina', totalNomina],
        ['Activos', valorActivos],
        ['Saldo', ingresos - totalGastos - totalNomina]]
      },
      {
        name: 'Caja',
        rows: [['Tipo', 'Origen', 'Concepto', 'Monto'],
        ['Ingreso', 'Reservaciones', 'Pagos registrados', ingresos],
        ['Egreso', 'Compras', 'Compras pagadas', egresosCompras],
        ['Egreso', 'Gastos', 'Gastos operativos', gastos.reduce((s, g) => s + g.monto, 0)],
        ['Egreso', 'Nómina', 'Nómina', totalNomina]]
      },
      {
        name: 'Gastos',
        rows: [['Fecha', 'Categoría', 'Concepto', 'Comprobante', 'Monto'],
        ...gastos.map(g => [g.fecha, g.categoria, g.concepto, g.comprobante, g.monto]),
        ...compras.filter(c => c.estado === 'pagada').map(c => [c.fecha, 'Compras', `Compra a ${c.proveedor}`, c.numeroFactura, c.total])]
      },
      {
        name: 'Nómina',
        rows: [['Código', 'Empleado', 'Área', 'Salario base', 'Bonos y extras', 'Descuentos', 'Neto'],
        ...nominaFilas.map(n => [n.e.codigoEmpleado, n.e.nombre, n.e.rol, n.base, n.extras, n.descuentos, n.neto])]
      },
      {
        name: 'Activos',
        rows: [['Código', 'Activo', 'Categoría', 'Ubicación', 'Estado', 'Costo'], ...activos.map(a => [a.codigo, a.nombre, a.categoria, a.ubicacion, a.estado, a.costo])]
      }]);
  }
  return <Card t="Reporte financiero">
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Kpi l="Ingresos" v={dinero(ingresos)} />
      <Kpi l="Egresos" v={dinero(totalGastos + totalNomina)} />
      <Kpi l="Nómina" v={dinero(totalNomina)} />
      <Kpi l="Activos" v={dinero(valorActivos)} />
      <Kpi l="Saldo" v={dinero(ingresos - totalGastos - totalNomina)} />
    </div>
    <button onClick={excel} className="mt-4 rounded-md bg-[#18345C] px-4 py-2.5 text-sm font-semibold text-white">Exportar Excel</button>
  </Card>;
}
function Tabla({ heads, children }: {
  heads: string[];
  children: React.ReactNode;
}) {
  return <div className="overflow-x-auto rounded-xl border bg-white">
    <table className="w-full min-w-[700px] text-sm">
      <thead className="bg-[#F4F1EA] text-left text-xs uppercase text-[#71839B]">
        <tr>
          {heads.map((h, i) => <th key={h} className={`${i === 0 ? 'p-3' : ''} ${i === heads.length - 1 ? 'pr-3 text-right' : ''}`}>
            {h}
          </th>)}
        </tr>
      </thead>
      <tbody>
        {children}
      </tbody>
    </table>
  </div>;
}
function FormGasto({ cancel, save }: {
  cancel: () => void;
  save: (g: Omit<GastoHotel, 'id'>) => void;
}) {
  const [fecha, setFecha] = useState(fechaHotel()), [categoria, setCategoria] = useState('Servicios'), [concepto, setConcepto] = useState(''), [comprobante, setComprobante] = useState(''), [monto, setMonto] = useState('');
  return <Form
    titulo="Registrar gasto"
    cancel={cancel}
    save={() => concepto && Number(monto) > 0 && save({ fecha, categoria, concepto, comprobante, monto: Number(monto), origen: 'manual' })}>
    <Campo l="Fecha">
      <input type="date" className={INPUT_CLS} value={fecha} onChange={e => setFecha(e.target.value)} />
    </Campo>
    <Campo l="Categoría">
      <select className={INPUT_CLS} value={categoria} onChange={e => setCategoria(e.target.value)}>
        {['Servicios', 'Mantenimiento', 'Transporte', 'Impuestos', 'Administración', 'Otros'].map(x => <option key={x}>
          {x}
        </option>)}
      </select>
    </Campo>
    <Campo l="Concepto">
      <input className={INPUT_CLS} value={concepto} onChange={e => setConcepto(e.target.value)} />
    </Campo>
    <Campo l="Factura o comprobante">
      <input className={INPUT_CLS} value={comprobante} onChange={e => setComprobante(e.target.value)} />
    </Campo>
    <Campo l="Monto">
      <input type="number" className={INPUT_CLS} value={monto} onChange={e => setMonto(e.target.value)} />
    </Campo>
  </Form>;
}
function FormActivo({ cancel, save }: {
  cancel: () => void;
  save: (a: Omit<ActivoHotel, 'id'>) => void;
}) {
  const [codigo, setCodigo] = useState(''),
  [nombre, setNombre] = useState(''),
  [categoria, setCategoria] = useState('Mobiliario'),
  [ubicacion, setUbicacion] = useState(''),
  [fechaCompra, setFecha] = useState(fechaHotel()),
  [costo, setCosto] = useState(''),
  [estado, setEstado] = useState<ActivoHotel['estado']>('operativo');
  return <Form
    titulo="Registrar activo"
    cancel={cancel}
    save={() => codigo && nombre && Number(costo) > 0 && save({ codigo, nombre, categoria, ubicacion, fechaCompra, costo: Number(costo), estado, vinculadoMantenimiento: categoria !== 'Mobiliario' })}>
    <Campo l="Código">
      <input className={INPUT_CLS} value={codigo} onChange={e => setCodigo(e.target.value)} />
    </Campo>
    <Campo l="Nombre">
      <input className={INPUT_CLS} value={nombre} onChange={e => setNombre(e.target.value)} />
    </Campo>
    <Campo l="Categoría">
      <select className={INPUT_CLS} value={categoria} onChange={e => setCategoria(e.target.value)}>
        {['Mobiliario', 'Equipo electrónico', 'Equipo de cocina', 'Maquinaria', 'Climatización', 'Vehículos'].map(x => <option key={x}>
          {x}
        </option>)}
      </select>
    </Campo>
    <Campo l="Ubicación">
      <input className={INPUT_CLS} value={ubicacion} onChange={e => setUbicacion(e.target.value)} />
    </Campo>
    <Campo l="Estado">
      <select className={INPUT_CLS} value={estado} onChange={e => setEstado(e.target.value as ActivoHotel['estado'])}>
        <option value="operativo">Operativo</option>
        <option value="en reparación">En reparación</option>
        <option value="fuera de servicio">Fuera de servicio</option>
      </select>
    </Campo>
    <Campo l="Fecha de compra">
      <input type="date" className={INPUT_CLS} value={fechaCompra} onChange={e => setFecha(e.target.value)} />
    </Campo>
    <Campo l="Costo">
      <input type="number" className={INPUT_CLS} value={costo} onChange={e => setCosto(e.target.value)} />
    </Campo>
  </Form>;
}
function Form({ titulo, cancel, save, children }: {
  titulo: string;
  cancel: () => void;
  save: () => void;
  children: React.ReactNode;
}) {
  return <div>
    <h2 className="mb-4 text-2xl font-semibold text-[#18345C]">
      {titulo}
    </h2>
    <div className="grid gap-3 sm:grid-cols-2">
      {children}
    </div>
    <div className="mt-4 flex flex-wrap justify-end gap-2">
      <button onClick={cancel} className="min-h-11 rounded-md border px-4 py-2 text-sm">Cancelar</button>
      <button onClick={save} className="min-h-11 rounded-md bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Guardar</button>
    </div>
  </div>;
}
function Campo({ l, children }: {
  l: string;
  children: React.ReactNode;
}) {
  return <label>
    <span className="mb-1 block text-xs uppercase tracking-wider text-[#71839B]">
      {l}
    </span>
    {children}
  </label>;
}
function Modal({ children, close }: {
  children: React.ReactNode;
  close: () => void;
}) {
  return <div
    onMouseDown={e => e.target === e.currentTarget && close()}
    className="fixed inset-0 z-50 flex items-end justify-center bg-[#071D34]/50 sm:items-center sm:p-4">
    <section className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-white p-5 sm:max-w-lg sm:rounded-2xl sm:p-5">
      <button onClick={close} className="absolute right-5 top-4 text-2xl">×</button>
      {children}
    </section>
  </div>;
}
