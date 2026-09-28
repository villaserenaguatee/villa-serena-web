import { useState } from 'react';
import type { TipoHabitacion, ReglaTarifa, Promocion, CriterioTarifa, AjusteTarifa, } from '@/lib/pms/types';
import { fechaHoyISO, formatoFecha, generarId } from '@/data/pms';
import { dinero, Chip, Campo, INPUT_CLS, tarifaEfectiva, CRITERIO_LABEL, PlusIcon, } from '@/features/admin/pages/adminUtils';
const TIPOS: TipoHabitacion[] = ['Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
interface Props {
  tarifasBase: Record<TipoHabitacion, number>;
  reglas: ReglaTarifa[];
  promociones: Promocion[];
  ocupacionActualPct: number;
  onCambiarTarifaBase: (tipo: TipoHabitacion, valor: number) => void;
  onGuardarRegla: (r: ReglaTarifa) => void;
  onToggleRegla: (id: string) => void;
  onEliminarRegla: (id: string) => void;
  onGuardarPromo: (p: Promocion) => void;
  onTogglePromo: (id: string) => void;
}
export default function Tarifas({ tarifasBase, reglas, promociones, ocupacionActualPct, onCambiarTarifaBase, onGuardarRegla, onToggleRegla, onEliminarRegla, onGuardarPromo, onTogglePromo, }: Props) {
  const hoy = fechaHoyISO();
  const [formRegla, setFormRegla] = useState(false);
  const [formPromo, setFormPromo] = useState(false);
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Tarifas y ofertas</h1>
      <p className="text-[14px] text-[#AEBCC1] mt-1">
        Ocupación actual del hotel: {ocupacionActualPct}% · las tarifas especiales por ocupación usan este dato
      </p>
    </div>

    <div className="px-4 sm:px-6 py-5 space-y-8">

      <section>
        <h2 className="text-[20px] font-semibold text-[#18345C] mb-1">Precio por tipo de habitación</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {TIPOS.map(tipo => {
            const base = tarifasBase[tipo];
            const { precio, aplicadas } = tarifaEfectiva(tipo, base, reglas, ocupacionActualPct, hoy);
            const cambia = Math.abs(precio - base) > 0.001;
            return (<div key={tipo} className="bg-white border border-[#E5E0D8] rounded-xl p-4">
              <p className="text-[16px] font-semibold text-[#18345C]">
                {tipo}
              </p>
              <div className="mt-3">
                <Campo label="Precio por noche">
                  <div className="flex items-center gap-2">
                    <span className="text-[#18345C] text-sm font-semibold">Q</span>
                    <input type="number" min="0" value={base} onChange={e => onCambiarTarifaBase(tipo, Math.max(0, Number(e.target.value) || 0))} className={INPUT_CLS} />
                  </div>
                </Campo>
              </div>
              {cambia && (<div className="mt-3 pt-3 border-t border-[#F0EBE3]">
                <p className="text-[11px] text-[#AEBCC1] uppercase tracking-widest">Precio final vigente hoy</p>
                <p className="text-[20px] font-bold text-[#166534]">
                  {dinero(precio)}
                </p>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {aplicadas.map(r => (<Chip key={r.id} cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">
                    {r.nombre}
                  </Chip>))}
                </div>
              </div>)}
            </div>);
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-[20px] font-semibold text-[#18345C]">Reglas de tarifa</h2>
          </div>
          <button
            onClick={() => setFormRegla(v => !v)}
            className="flex items-center gap-2 px-3 py-2 text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            <PlusIcon /> Nueva tarifa
          </button>
        </div>

        {formRegla && (<div className="fixed inset-0 z-50 grid place-items-center bg-[#071D34]/45 p-4">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto">
            <FormularioRegla onCancelar={() => setFormRegla(false)} onGuardar={r => {
              onGuardarRegla(r);
              setFormRegla(false);
            }} />
          </div>
        </div>)}

        <div className="space-y-2 mt-3">
          {reglas.length === 0 && <p className="text-[13px] text-[#AEBCC1]">No hay tarifas especiales programadas.</p>}
          {reglas.map(r => {
            const signo = r.ajuste === 'porcentaje' ? (r.valor >= 0 ? `+${r.valor}%` : `${r.valor}%`) : dinero(r.valor);
            const vig = r.criterio === 'ocupacion'
              ? `Ocupación ≥ ${r.umbralOcupacion ?? 0}%`
              : `${formatoFecha(r.desde ?? '')} → ${formatoFecha(r.hasta ?? '')}`;
            return (<div
              key={r.id}
              className={`bg-white border rounded-xl px-4 py-3 flex items-center gap-3 flex-wrap ${r.activa ? 'border-[#E5E0D8]' : 'border-[#E5E0D8] opacity-60'}`}>
              <div className="flex-1 min-w-[180px]">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-[15px] font-semibold text-[#18345C]">
                    {r.nombre}
                  </p>
                  <Chip cls="bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]">
                    {CRITERIO_LABEL[r.criterio]}
                  </Chip>
                  <Chip cls="bg-[#F8F6F0] text-[#6B7280] border-[#E5E0D8]">
                    {r.tipoHabitacion}
                  </Chip>
                </div>
                <p className="text-[12px] text-[#AEBCC1] mt-1">
                  Ajuste {signo} · {vig}
                </p>
              </div>
              <button
                onClick={() => onToggleRegla(r.id)}
                className={`text-[12px] font-semibold px-3 py-1.5 rounded-md border transition-colors ${r.activa
                  ? 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]'
                  : 'bg-white text-[#6B7280] border-[#E5E0D8]'}`}>
                {r.activa ? 'Activa' : 'Inactiva'}
              </button>
              <button onClick={() => onEliminarRegla(r.id)} className="text-[12px] font-semibold text-[#991B1B] hover:underline">
                Eliminar
              </button>
            </div>);
          })}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[20px] font-semibold text-[#18345C]">Promociones</h2>
          <button
            onClick={() => setFormPromo(v => !v)}
            className="flex items-center gap-2 px-3 py-2 text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            <PlusIcon /> Nueva promoción
          </button>
        </div>

        {formPromo && (<div className="fixed inset-0 z-50 grid place-items-center bg-[#071D34]/45 p-4">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto">
            <FormularioPromo onCancelar={() => setFormPromo(false)} onGuardar={p => {
              onGuardarPromo(p);
              setFormPromo(false);
            }} />
          </div>
        </div>)}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
          {promociones.map(p => {
            const vigente = p.activa && hoy >= p.desde && hoy <= p.hasta;
            return (<div key={p.id} className="bg-white border border-[#E5E0D8] rounded-xl p-4">
              <div className="flex items-start justify-between gap-2">
                <p className="text-[16px] font-semibold text-[#18345C]">
                  {p.nombre}
                </p>
                <Chip cls={vigente ? 'bg-[#F0FAF4] text-[#166534] border-[#86EFAC]' : 'bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]'}>
                  {vigente ? 'Vigente' : p.activa ? 'Programada' : 'Inactiva'}
                </Chip>
              </div>
              <p className="text-[13px] text-[#6B7280] mt-1">
                Código <span className="font-mono font-semibold text-[#18345C]">
                  {p.codigo}
                </span> · −{p.descuentoPct}%
              </p>
              <p className="text-[12px] text-[#AEBCC1] mt-1">
                {formatoFecha(p.desde)} → {formatoFecha(p.hasta)}
              </p>
              <button
                onClick={() => onTogglePromo(p.id)}
                className="mt-3 text-[12px] font-semibold px-3 py-1.5 rounded-md border border-[#E5E0D8] text-[#18345C] hover:bg-[#F8F6F0] transition-colors">
                {p.activa ? 'Desactivar' : 'Activar'}
              </button>
            </div>);
          })}
        </div>
      </section>
    </div>
  </div>);
}
function FormularioRegla({ onCancelar, onGuardar, }: {
  onCancelar: () => void;
  onGuardar: (r: ReglaTarifa) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoHabitacion | 'Todas'>('Todas');
  const [criterio, setCriterio] = useState<CriterioTarifa>('temporada');
  const [ajuste, setAjuste] = useState<AjusteTarifa>('porcentaje');
  const [valor, setValor] = useState('10');
  const [desde, setDesde] = useState(fechaHoyISO());
  const [hasta, setHasta] = useState(fechaHoyISO());
  const [umbral, setUmbral] = useState('70');
  const [err, setErr] = useState('');
  function guardar() {
    if (!nombre.trim())
      return setErr('Escribe un nombre.');
    const n = Number(valor);
    if (Number.isNaN(n))
      return setErr('Valor inválido.');
    onGuardar({
      id: generarId(),
      nombre: nombre.trim(),
      tipoHabitacion: tipo,
      criterio,
      ajuste,
      valor: n,
      desde: criterio === 'ocupacion' ? undefined : desde,
      hasta: criterio === 'ocupacion' ? undefined : hasta,
      umbralOcupacion: criterio === 'ocupacion' ? Math.max(0, Number(umbral) || 0) : undefined,
      activa: true,
    });
  }
  return (<div className="overflow-hidden rounded-2xl border border-[#D7D1C7] bg-white shadow-[0_12px_35px_rgba(24,52,92,.08)]">
    <div className="flex items-start justify-between gap-4 bg-[#18345C] px-5 py-4 text-white">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#E2C66D]">Nueva tarifa</p>
        <h3 className="mt-1 text-xl font-semibold">Crear</h3>
      </div>
      <button
        type="button"
        onClick={onCancelar}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-xl hover:bg-white/10"
        aria-label="Cerrar">×</button>
    </div>
    <div className="space-y-5 p-5">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-[#B38719]">Información general</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nombre de la tarifa especial">
            <input type="text" placeholder="Ej. Semana Santa" value={nombre} onChange={e => {
              setNombre(e.target.value);
              setErr('');
            }} className={INPUT_CLS} />
          </Campo>
          <Campo label="Aplica a">
            <select value={tipo} onChange={e => setTipo(e.target.value as TipoHabitacion | 'Todas')} className={INPUT_CLS}>
              <option value="Todas">Todas</option>
              {TIPOS.map(t => <option key={t} value={t}>
                {t}
              </option>)}
            </select>
          </Campo>
        </div>
      </section>
      <section className="rounded-xl bg-[#F8F6F0] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-[#B38719]">Cuándo y cómo se aplicará</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Cuándo se aplicará">
            <select value={criterio} onChange={e => setCriterio(e.target.value as CriterioTarifa)} className={INPUT_CLS}>
              <option value="temporada">Temporada</option>
              <option value="evento">Evento</option>
              <option value="ocupacion">Ocupación</option>
            </select>
          </Campo>
          <Campo label="Forma de calcular el precio">
            <select value={ajuste} onChange={e => setAjuste(e.target.value as AjusteTarifa)} className={INPUT_CLS}>
              <option value="porcentaje">Porcentaje (%)</option>
              <option value="fijo">Precio fijo por noche</option>
            </select>
          </Campo>
          <Campo label={ajuste === 'porcentaje' ? 'Aumento o descuento' : 'Nuevo precio por noche'}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#71839B]">
                {ajuste === 'porcentaje' ? '%' : 'Q'}
              </span>
              <input
                type="number"
                placeholder={ajuste === 'porcentaje' ? 'Ej. 15 o -10' : 'Ej. 550'}
                value={valor}
                onChange={e => {
                  setValor(e.target.value);
                  setErr('');
                }}
                className={`${INPUT_CLS} pl-9`} />
            </div>
          </Campo>
          {criterio === 'ocupacion' ? (<Campo label="Umbral de ocupación (%)">
            <input type="number" min="0" max="100" value={umbral} onChange={e => setUmbral(e.target.value)} className={INPUT_CLS} />
          </Campo>) : (<>
            <Campo label="Fecha de inicio">
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={INPUT_CLS} />
            </Campo>
            <Campo label="Fecha de finalización">
              <input type="date" value={hasta} min={desde} onChange={e => setHasta(e.target.value)} className={INPUT_CLS} />
            </Campo>
          </>)}
        </div>
      </section>
      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-[#991B1B]">
        {err}
      </p>}
      <div className="flex flex-wrap justify-end gap-2 border-t border-[#EEE9E1] pt-4">
        <button
          onClick={onCancelar}
          className="min-h-11 rounded-lg border border-[#D7D1C7] px-4 py-2 text-sm font-semibold text-[#52677F] hover:bg-[#F8F6F0] transition-colors">
          Cancelar
        </button>
        <button
          onClick={guardar}
          className="min-h-11 rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#102747] transition-colors">
          Guardar
        </button>
      </div>
    </div>
  </div>);
}
function FormularioPromo({ onCancelar, onGuardar, }: {
  onCancelar: () => void;
  onGuardar: (p: Promocion) => void;
}) {
  const [nombre, setNombre] = useState('');
  const [codigo, setCodigo] = useState('');
  const [descuento, setDescuento] = useState('15');
  const [desde, setDesde] = useState(fechaHoyISO());
  const [hasta, setHasta] = useState(fechaHoyISO());
  const [err, setErr] = useState('');
  function guardar() {
    if (!nombre.trim())
      return setErr('Escribe un nombre.');
    if (!codigo.trim())
      return setErr('Escribe un código.');
    const d = Number(descuento);
    if (!d || d <= 0 || d > 100)
      return setErr('Descuento entre 1 y 100.');
    onGuardar({
      id: generarId(),
      nombre: nombre.trim(),
      codigo: codigo.trim().toUpperCase(),
      descuentoPct: d,
      desde,
      hasta,
      activa: true,
    });
  }
  return (<div className="overflow-hidden rounded-2xl border border-[#D7D1C7] bg-white shadow-[0_12px_35px_rgba(24,52,92,.08)]">
    <div className="flex items-start justify-between gap-4 bg-[#18345C] px-5 py-4 text-white">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#E2C66D]">Nueva oferta</p>
        <h3 className="mt-1 text-xl font-semibold">Crear promoción</h3>
      </div>
      <button
        type="button"
        onClick={onCancelar}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/20 text-xl hover:bg-white/10"
        aria-label="Cerrar">×</button>
    </div>
    <div className="space-y-5 p-5">
      <section>
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-[#B38719]">Datos de la promoción</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Nombre de la promoción">
            <input
              type="text"
              placeholder="Ej. Escapada de fin de semana"
              value={nombre}
              onChange={e => {
                setNombre(e.target.value);
                setErr('');
              }}
              className={INPUT_CLS} />
          </Campo>
          <Campo label="Código">
            <input
              type="text"
              value={codigo}
              onChange={e => {
                setCodigo(e.target.value.toUpperCase());
                setErr('');
              }}
              className={`${INPUT_CLS} font-mono uppercase tracking-wider`} />
          </Campo>
          <Campo label="Descuento (%)">
            <input type="number" min="1" max="100" value={descuento} onChange={e => {
              setDescuento(e.target.value);
              setErr('');
            }} className={INPUT_CLS} />
          </Campo>
          <div className="hidden sm:block" />
        </div>
      </section>
      <section className="rounded-xl bg-[#F8F6F0] p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[.16em] text-[#B38719]">Vigencia</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Campo label="Fecha de inicio">
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} className={INPUT_CLS} />
          </Campo>
          <Campo label="Fecha de finalización">
            <input type="date" value={hasta} min={desde} onChange={e => setHasta(e.target.value)} className={INPUT_CLS} />
          </Campo>
        </div>
      </section>

      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-[#991B1B]">
        {err}
      </p>}
      <div className="flex flex-wrap justify-end gap-2 border-t border-[#EEE9E1] pt-4">
        <button
          onClick={onCancelar}
          className="min-h-11 rounded-lg border border-[#D7D1C7] px-4 py-2 text-sm font-semibold text-[#52677F] hover:bg-[#F8F6F0] transition-colors">
          Cancelar
        </button>
        <button
          onClick={guardar}
          className="min-h-11 rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#102747] transition-colors">
          Guardar promoción
        </button>
      </div>
    </div>
  </div>);
}
