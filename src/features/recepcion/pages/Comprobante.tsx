import ReceptionCloseButton from './ReceptionCloseButton';
import { calcularCuentaRecepcion as calcularCuenta } from '../accountTotals';
import { HOTEL } from "@/lib/hotel";
import type { Pago, Reserva, Huesped } from '@/lib/pms/types';
import { formatoFechaHora } from '@/data/pms';
import { dinero } from '@/features/recepcion/pages/recUtils';
import type { HabitacionHotel } from '@/lib/pms/types';
const METODO_LABEL: Record<string, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};
interface Props {
  pago: Pago;
  reserva: Reserva;
  huesped: Huesped;
  habitacion: HabitacionHotel | null;
  onCerrar: () => void;
}
export default function Comprobante({ pago, reserva, huesped, habitacion, onCerrar }: Props) {
  const cuenta = calcularCuenta(reserva, habitacion);
  return (<div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black/50" onClick={onCerrar} />

    <div className="reception-print-document relative z-10 w-full max-w-xl max-h-[88vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E0D8]">
        <h2 className="text-[20px] font-semibold text-[#18345C]">Comprobante de pago</h2>
        <ReceptionCloseButton onClick={onCerrar} />
      </div>

      <div className="px-5 py-5" id="comprobante-imprimible">
        <div className="mb-5 grid gap-4 border-b border-[#CDB46B] pb-4 sm:grid-cols-[150px_1fr_1fr] sm:items-center">
          <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="mx-auto h-24 w-auto object-contain sm:mx-0" />
          <div className="border-[#E5E0D8] sm:border-l sm:pl-5">
            <p className="font-serif text-lg font-bold text-[#18345C]">Villa Serena Hotel</p>
            <p className="text-xs text-[#52677F]">Huehuetenango, Guatemala</p>
            <p className="text-xs text-[#52677F]">NIT: {HOTEL.nit}</p>
            <p className="text-xs text-[#52677F]">villaserenagt@gmail.com</p>
          </div>
          <div className="sm:text-right">
            <p className="font-serif text-xl font-bold text-[#18345C]">COMPROBANTE DE PAGO</p>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B38719]">Documento informativo · no es factura fiscal</p>
            <p className="mt-2 text-xs text-[#52677F]">Comprobante: <b>
              {pago.comprobante}
            </b></p>
            <p className="text-xs text-[#52677F]">Reserva: <b>
              {reserva.codigo}
            </b></p>
          </div>
        </div>

        <div className="border-t border-dashed border-[#CBD5E1] pt-3 space-y-1.5 text-[13px] text-[#1F2933]">
          <Fila k="Fecha" v={formatoFechaHora(pago.fecha)} />
          <Fila k="Huésped" v={huesped.nombre} />
          <Fila k="Documento" v={`${huesped.tipoDocumento} •••• ${huesped.documento.slice(-4)}`} />
          <Fila k="Reserva" v={reserva.codigo} />
          <Fila k="Habitación" v={habitacion ? `${habitacion.numero} · ${habitacion.tipo}` : reserva.tipoHabitacion} />
        </div>

        <div className="border-t border-dashed border-[#CBD5E1] mt-3 pt-3 space-y-1.5 text-[13px]">
          <Fila k={`Alojamiento (${cuenta.noches} noche${cuenta.noches !== 1 ? 's' : ''})`} v={dinero(cuenta.alojamiento)} />
          {cuenta.servicios > 0 && <Fila k="Servicios adicionales" v={dinero(cuenta.servicios)} />}
          {cuenta.descuento > 0 && <Fila k="Descuento" v={`- ${dinero(cuenta.descuento)}`} />}
          <Fila k="Total de la cuenta" v={dinero(cuenta.total)} bold />
        </div>

        <div className="border-t border-dashed border-[#CBD5E1] mt-3 pt-3 space-y-1.5 text-[13px]">
          <Fila k="Monto pagado" v={dinero(pago.monto)} bold />
          <Fila k="Método de pago" v={METODO_LABEL[pago.metodo] ?? pago.metodo} />
          <Fila k="Total pagado a la fecha" v={dinero(reserva.pagos.reduce((total, p) => total + p.monto, 0))} />
          <Fila k="Saldo pendiente" v={dinero(Math.max(0, cuenta.saldo))} bold />
        </div>

        <p className="text-[11px] text-[#AEBCC1] text-center mt-4">
          Gracias por hospedarte en Villa Serena. Estancias que dejan buenas historias.
        </p>
      </div>

      <div className="flex flex-wrap justify-end gap-2 px-5 pb-5">
        <button
          onClick={() => window.print()}
          className="rounded-md bg-[#18345C] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#102747]">
          Imprimir
        </button>
      </div>
    </div>
  </div>);
}
function Fila({ k, v, bold }: {
  k: string;
  v: string;
  bold?: boolean;
}) {
  return (<div className="flex items-baseline justify-between gap-3">
    <span className={bold ? 'font-semibold text-[#18345C]' : 'text-[#6B7280]'}>
      {k}
    </span>
    <span className={bold ? 'font-bold text-[#18345C]' : 'text-[#1F2933]'}>
      {v}
    </span>
  </div>);
}
