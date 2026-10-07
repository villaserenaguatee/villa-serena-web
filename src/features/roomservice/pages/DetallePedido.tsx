import { useState } from 'react';
import type { Pedido } from '@/lib/pms/types';
import { formatoHoraISO, formatoDuracion, minutosEntre } from '@/data/pms';
import { ChipEstado, ESTADO_META, SIGUIENTE_ESTADO, ACCION_AVANZAR, esTerminal, precio, totalLineas, BedIcon, ClockIcon, PhoneIcon, CloseIcon, } from '@/features/roomservice/pages/rsUtils';
const MOTIVOS_RAPIDOS = [
  'Ítem agotado',
  'Error de registro',
  'El huésped canceló',
  'Habitación sin respuesta',
];
interface Props {
  pedido: Pedido;
  onCerrar: () => void;
  onAvanzarEstado: (id: string) => void;
  onCancelar: (id: string, motivo: string) => void;
  busy?: boolean;
  conectado?: boolean;
}
export default function DetallePedido({ pedido, onCerrar, onAvanzarEstado, onCancelar, busy = false, conectado = false }: Props) {
  const [modoCancelar, setModoCancelar] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errorMotivo, setErrorMotivo] = useState(false);
  const total = totalLineas(pedido.lineas);
  const siguiente = SIGUIENTE_ESTADO[pedido.estado];
  const terminal = esTerminal(pedido.estado);
  function confirmarCancelacion() {
    if (!motivo.trim()) {
      setErrorMotivo(true);
      return;
    }
    onCancelar(pedido.id, motivo.trim());
  }
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

    <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">

      <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-[#E5E0D8] sticky top-0 bg-white z-10">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[26px] font-semibold text-[#18345C] leading-none">
              Pedido #{pedido.numero}
            </h2>
            <ChipEstado estado={pedido.estado} />
          </div>
          <p className="text-[13px] text-[#AEBCC1] mt-1 flex items-center gap-1.5">
            {pedido.origen === 'telefono' ? <PhoneIcon /> : <AppIcon />}
            {pedido.origen === 'telefono' ? 'Pedido telefónico' : pedido.origen === 'portal' ? 'Pedido desde la página web' : 'Pedido desde la app'}
            {' · '}
            Creado {formatoHoraISO(pedido.creadoEn)}
          </p>
        </div>
        <button onClick={onCerrar} className="text-[#AEBCC1] hover:text-[#1F2933] p-1 shrink-0">
          <CloseIcon />
        </button>
      </div>

      <div className="px-5 sm:px-6 py-5 space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Dato label="Piso" valor={String(pedido.piso)} destacado />
          <Dato icono={<BedIcon size={15} />} label="Habitación" valor={pedido.habitacionNumero} destacado />
          <div className="col-span-2">
            <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-1">Huésped</p>
            <p className="text-[15px] font-medium text-[#1F2933]">
              {pedido.huesped}
            </p>
          </div>
        </div>

        {(pedido.alergias || pedido.notaGeneral || pedido.indicaciones || pedido.lugarEntrega || pedido.codigoCupon) && (<div className="grid gap-3 sm:grid-cols-2">
          {pedido.alergias && <div className="bg-[#FFF7ED] border border-[#FDBA74] rounded-xl px-4 py-3">
            <p className="text-[10px] text-[#9A3412] uppercase tracking-widest font-semibold mb-1">Alergias</p>
            <p className="text-[14px] text-[#7C2D12]">
              {pedido.alergias}
            </p>
          </div>}
          {pedido.indicaciones && <div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-xl px-4 py-3">
            <p className="text-[10px] text-[#71839B] uppercase tracking-widest font-semibold mb-1">Indicaciones</p>
            <p className="text-[14px] text-[#526276]">
              {pedido.indicaciones}
            </p>
          </div>}
          {pedido.codigoCupon && <div className="bg-[#F0FAF4] border border-[#86EFAC] rounded-xl px-4 py-3">
            <p className="text-[10px] text-[#166534] uppercase tracking-widest font-semibold mb-1">Cupón</p>
            <p className="text-[14px] text-[#166534]">
              {pedido.codigoCupon}
              {pedido.descuentoPct ? ` · ${pedido.descuentoPct}%` : ''}
            </p>
          </div>}
          {pedido.notaGeneral && <div className="bg-[#F8F6F0] border border-[#E5E0D8] rounded-xl px-4 py-3 sm:col-span-2">
            <p className="text-[10px] text-[#71839B] uppercase tracking-widest font-semibold mb-1">Nota del huésped</p>
            <p className="text-[14px] text-[#526276]">
              {pedido.notaGeneral}
            </p>
          </div>}
        </div>)}

        <div>
          <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-2">Ítems del pedido</p>
          <div className="border border-[#E5E0D8] rounded-xl overflow-hidden">
            {pedido.lineas.map((l,
              i) => (<div key={l.itemId + i} className={`flex items-start gap-3 px-4 py-3 ${i !== 0 ? 'border-t border-[#F0EBE3]' : ''}`}>
                <span className="w-7 h-7 rounded-md bg-[#F8F6F0] text-[#18345C] text-[13px] font-bold flex items-center justify-center shrink-0">
                  {l.cantidad}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-[#1F2933]">
                    {l.nombre}
                  </p>
                  {l.nota && (<p className="text-[13px] text-[#9A3412] mt-0.5">
                    <span className="font-semibold">Nota:</span>
                    {l.nota}
                  </p>)}
                  <p className="text-[12px] text-[#AEBCC1] mt-0.5">
                    {precio(l.precioUnitario)} c/u
                  </p>
                </div>
                <p className="text-[15px] font-semibold text-[#18345C] shrink-0">
                  {precio(l.precioUnitario * l.cantidad)}
                </p>
              </div>))}
            <div className="flex items-center justify-between px-4 py-3 bg-[#F8F6F0] border-t border-[#E5E0D8]">
              <p className="text-[13px] font-semibold text-[#6B7280] uppercase tracking-wide">Total</p>
              <p className="text-[20px] font-bold text-[#18345C]">
                {precio(total)}
              </p>
            </div>
          </div>
        </div>

        {(!conectado || terminal) && <div className={`rounded-xl px-4 py-3 border ${pedido.estado === 'cancelado'
          ? 'bg-[#F1F5F9] border-[#CBD5E1]'
          : 'bg-[#F0FAF4] border-[#86EFAC]'}`}>
          <p className="text-[13px] text-[#1F2933]">
            {pedido.estado === 'cancelado' ? (<>Cargo <span className="font-semibold">anulado</span>: el pedido cancelado no se cobra al huésped.</>) : (<>
              {precio(total)} cargados al folio de la habitación{' '}
              <span className="font-semibold">
                {pedido.habitacionNumero}
              </span>. Visible para recepción; se cobra en el check-out.
            </>)}
          </p>
        </div>}

        <div>
          <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-2">Progreso del pedido</p>
          <div className="space-y-2.5">
            {pedido.historial.map((c,
              i) => (<div key={i} className="flex items-start gap-3">
                <span className="w-2.5 h-2.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: ESTADO_META[c.estado].dot }} />
                <div className="flex-1">
                  <p className="text-[14px] font-medium text-[#1F2933]">
                    {ESTADO_META[c.estado].label}
                  </p>
                  {c.motivo && (<p className="text-[13px] text-[#991B1B] mt-0.5">Motivo: {c.motivo}</p>)}
                </div>
                <p className="text-[12px] text-[#AEBCC1] shrink-0 flex items-center gap-1">
                  <ClockIcon size={11} />
                  {formatoHoraISO(c.fechaHora)}
                </p>
              </div>))}
          </div>

          {pedido.estado === 'entregado' && pedido.entregadoEn && (<p className="text-[13px] text-[#166534] mt-3 font-medium">
            Tiempo total: {formatoDuracion(minutosEntre(pedido.creadoEn, pedido.entregadoEn))}{' '}
            (de la creación a la entrega).
          </p>)}
        </div>

        {!terminal && !modoCancelar && (<div className="flex flex-col sm:flex-row gap-3 pt-1">
          {siguiente && (<button
            onClick={() => onAvanzarEstado(pedido.id)}
            disabled={busy}
            className="flex-1 py-3 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
            {ACCION_AVANZAR[pedido.estado]}
          </button>)}
          <button
            onClick={() => setModoCancelar(true)}
            disabled={busy}
            className="flex-1 sm:flex-none sm:px-5 py-3 text-[15px] font-semibold border border-[#FCA5A5] text-[#991B1B] rounded-md hover:bg-[#FEF2F2] transition-colors">
            Cancelar pedido
          </button>
        </div>)}

        {modoCancelar && (<div className="border border-[#FCA5A5] bg-[#FEF2F2] rounded-xl px-4 py-4 space-y-3">
          <p className="text-[15px] font-semibold text-[#991B1B]">Cancelar el pedido #{pedido.numero}</p>
          <p className="text-[13px] text-[#7F1D1D]">
            Indica el motivo. Un pedido cancelado no puede reactivarse; solo quedará en el historial.
          </p>

          <div className="flex flex-wrap gap-2">
            {MOTIVOS_RAPIDOS.map(m => (<button
              key={m}
              type="button"
              onClick={() => {
                setMotivo(m);
                setErrorMotivo(false);
              }}
              className={`text-[12px] font-medium px-2.5 py-1 rounded-md border transition-colors ${motivo === m
                ? 'bg-[#991B1B] text-white border-[#991B1B]'
                : 'bg-white text-[#7F1D1D] border-[#FCA5A5] hover:bg-[#FEE2E2]'}`}>
              {m}
            </button>))}
          </div>

          <textarea
            rows={3}
            value={motivo}
            onChange={e => {
              setMotivo(e.target.value);
              setErrorMotivo(false);
            }}
            placeholder="Describe el motivo de la cancelación…"
            className="w-full border border-[#FCA5A5] rounded-md px-3 py-2.5 text-sm text-[#1F2933] resize-none focus:outline-none focus:border-[#991B1B] bg-white placeholder:text-[#C99]" />
          {errorMotivo && (<p className="text-xs text-[#991B1B]">El motivo es obligatorio para cancelar.</p>)}

          <div className="flex gap-3">
            <button
              onClick={() => {
                setModoCancelar(false);
                setMotivo('');
                setErrorMotivo(false);
              }}
              className="flex-1 py-2.5 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-white transition-colors bg-white">
              Volver
            </button>
            <button
              onClick={confirmarCancelacion}
              disabled={busy}
              className="flex-1 py-2.5 text-sm font-semibold bg-[#991B1B] text-white rounded-md hover:bg-[#7F1D1D] transition-colors">
              Confirmar cancelación
            </button>
          </div>
        </div>)}

        {pedido.estado === 'cancelado' && (<div className="border border-[#FCA5A5] bg-[#FEF2F2] rounded-xl px-4 py-3">
          <p className="text-[14px] font-semibold text-[#991B1B]">Pedido cancelado</p>
          <p className="text-[13px] text-[#7F1D1D] mt-1">
            {pedido.motivoCancelacion}
          </p>
          <p className="text-[12px] text-[#7F1D1D] mt-2">No puede reactivarse. Queda solo para consulta en el historial.</p>
        </div>)}

        {pedido.estado === 'entregado' && (<div className="border border-[#86EFAC] bg-[#F0FAF4] rounded-xl px-4 py-3">
          <p className="text-[14px] font-semibold text-[#166534]">
            Entregado a las {pedido.entregadoEn ? formatoHoraISO(pedido.entregadoEn) : '—'}
          </p>
        </div>)}
      </div>
    </div>
  </div>);
}
function Dato({ icono, label, valor, destacado, }: {
  icono?: React.ReactNode;
  label: string;
  valor: string;
  destacado?: boolean;
}) {
  return (<div>
    <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-1 flex items-center gap-1">
      {icono}
      {label}
    </p>
    <p className={destacado ? 'text-[22px] font-bold text-[#18345C] leading-none' : 'text-[15px] font-medium text-[#1F2933]'}>
      {valor}
    </p>
  </div>);
}
function AppIcon() {
  return (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="5" y="2" width="14" height="20" rx="2" />
    <line x1="12" y1="18" x2="12" y2="18" />
  </svg>);
}
