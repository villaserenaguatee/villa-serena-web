import { checkInRealizado, checkInWebPendiente } from '@/store/reservationStore';
import { HOTEL } from "@/lib/hotel";
import { useMemo, useState } from 'react';
import type { Reserva, Huesped, HabitacionHotel, Acompanante, ServicioAdicional, MetodoPago, Pago, TipoHabitacion, SolicitudHuesped, } from '@/lib/pms/types';
import { formatoFecha, formatoFechaHora, nochesEntre, } from '@/data/pms';
import { dinero, Chip, RESERVA_META, calcularCuenta, habitacionesDisponibles, habitacionTieneConflicto, Campo, INPUT_CLS, BedIcon, UserIcon, CalendarIcon, CloseIcon, } from '@/features/recepcion/pages/recUtils';
import DocumentosCheckIn from '@/features/recepcion/pages/DocumentosCheckIn';
import Comprobante from '@/features/recepcion/pages/Comprobante';
import { publicRooms, publicRoomForHotelType, money } from '@/data/publicRooms';
import ReceptionDetailBff, { type ExistingAction } from './ReceptionDetailBff';
import type { ReservationDetail } from '@/lib/bff/contracts/reception';
type Tab = 'resumen' | 'actividad' | 'cuenta' | 'servicios' | 'huespedes' | 'cambios';
const MOTIVOS_CANCELACION = [
  'El huésped canceló',
  'No se presentó (no-show)',
  'Error de registro',
  'Cambio de fechas no disponible',
];
const METODO_LABEL: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
};
interface Props {
  initialTab?: Tab;
  bffAction?: ExistingAction;
  reserva: Reserva;
  huesped: Huesped;
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  solicitudes: SolicitudHuesped[];
  onCerrar: () => void;
  onAsignarHabitacion: (reservaId: string, habitacionId: string) => void;
  onCheckIn: (reservaId: string) => void;
  onValidarCheckInWeb: (reservaId: string) => void;
  onRechazarCheckInWeb: (reservaId: string, motivo: string) => void;
  onCheckOut: (reservaId: string) => void;
  onModificar: (reservaId: string, cambios: {
    fechaEntrada: string;
    fechaSalida: string;
    personas: number;
    adultos: number;
    ninos: number;
    habitacionId: string | null;
  }) => void;
  onCancelar: (reservaId: string, motivo: string) => void;
  onAgregarAcompanante: (reservaId: string, a: Acompanante) => void;
  onQuitarAcompanante: (reservaId: string, index: number) => void;
  onAgregarServicio: (reservaId: string, s: Omit<ServicioAdicional, 'id' | 'fecha'>) => void;
  onQuitarServicio: (reservaId: string, servicioId: string) => void;
  onRegistrarPago: (reservaId: string, datos: {
    monto: number;
    metodo: MetodoPago;
  }) => Pago;
  onAplicarDescuento: (reservaId: string, monto: number) => void;
}
type BffProps = { codigo: string; onCerrar: () => void; onExistingAction: (detail: ReservationDetail, action: ExistingAction) => void };
export default function DetalleReserva(props: Props | BffProps) {
  return 'codigo' in props ? <ReceptionDetailBff {...props} /> : <LocalDetail {...props} />;
}
function LocalDetail(props: Props) {
  const { reserva, huesped, habitaciones, reservas, onCerrar } = props;
  const [tab, setTab] = useState<Tab>(props.initialTab ?? 'resumen');
  const [comprobante, setComprobante] = useState<Pago | null>(null);
  const habitacion = habitaciones.find(h => h.id === reserva.habitacionId) ?? null;
  const cuenta = calcularCuenta(reserva, habitacion);
  const meta = RESERVA_META[reserva.estado];
  const cerrada = reserva.estado === 'finalizada' || reserva.estado === 'cancelada';
  return (<div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center sm:p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />

    <div className="relative z-10 bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-5xl max-h-[88vh] flex flex-col">

      <div className="flex items-start justify-between gap-2 px-4 sm:px-5 py-1.5 border-b border-[#E5E0D8] shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-[24px] font-semibold text-[#18345C] leading-none">
              {reserva.codigo}
            </h2>
            <Chip cls={meta.chip}>
              {meta.label}
            </Chip>
          </div>
          <p className="text-[13px] text-[#AEBCC1] mt-1">
            {huesped.nombre} · {formatoFecha(reserva.fechaEntrada)} → {formatoFecha(reserva.fechaSalida)}
          </p>
        </div>
        <button aria-label="Cerrar detalle de reserva" onClick={onCerrar} className="text-[#AEBCC1] hover:text-[#1F2933] p-1 shrink-0">
          <CloseIcon />
        </button>
      </div>

      <div className="flex gap-1 px-3 sm:px-4 pt-1 border-b border-[#E5E0D8] shrink-0 overflow-x-auto">
        {([
          ['resumen', 'Resumen'],
          ['actividad', 'Actividad'],
          ['cuenta', 'Cuenta y pagos'],
          ['servicios', 'Servicios'],
          ['huespedes', 'Ocupantes'],
          ['cambios', 'Cambios'],
        ] as [
          Tab,
          string
        ][]).filter(([id]) => !props.bffAction || (props.bffAction === 'cuenta' ? id === 'cuenta' : id === 'resumen')).map(([id, label]) => (<button
          key={id}
          onClick={() => setTab(id)}
          className={`px-3 py-2 text-[13px] font-semibold rounded-t-md whitespace-nowrap transition-colors ${tab === id
            ? 'bg-[#18345C] text-white'
            : 'text-[#6B7280] hover:bg-[#F8F6F0]'}`}>
          {label}
        </button>))}
      </div>

      <div className="px-4 sm:px-5 py-2 overflow-y-auto flex-1">
        {tab === 'resumen' && <TabResumen {...props} habitacion={habitacion} />}
        {tab === 'actividad' && <TabActividad {...props} />}
        {tab === 'cuenta' && (<TabCuenta {...props} habitacion={habitacion} onVerComprobante={setComprobante} onPagoRegistrado={setComprobante} />)}
        {tab === 'servicios' && <TabServicios {...props} />}
        {tab === 'huespedes' && <TabHuespedes {...props} />}
        {tab === 'cambios' && <TabCambios {...props} />}
      </div>

      {cerrada && (<div className="px-5 sm:px-6 py-2 bg-[#F8F6F0] border-t border-[#E5E0D8] text-[12px] text-[#6B7280] shrink-0">
        {reserva.estado === 'cancelada'
          ? `Reserva cancelada: ${reserva.motivoCancelacion ?? '—'}`
          : `Estancia finalizada · check-out ${formatoFechaHora(reserva.checkOutEn ?? '')}`}
      </div>)}
    </div>

    {comprobante && (<Comprobante pago={comprobante} reserva={reserva} huesped={huesped} habitacion={habitacion} onCerrar={() => setComprobante(null)} />)}
  </div>);
}
function TabActividad({ reserva, huesped, reservas, solicitudes }: Props) {
  const movimientos = useMemo(() => {
    const propias = reservas.filter(r => r.huespedId === huesped.id);
    const items: {
      id: string;
      fecha: string;
      titulo: string;
      detalle: string;
      tipo: string;
    }[] = [];
    propias.forEach(r => {
      items.push({
        id: `res-${r.id}`,
        fecha: r.creadoEn,
        titulo: 'Reserva creada',
        detalle: `${r.codigo} · ${formatoFecha(r.fechaEntrada)} → ${formatoFecha(r.fechaSalida)} · ${RESERVA_META[r.estado].label}`,
        tipo: 'Reserva'
      });
      if (r.checkInWeb?.enviadoEn)
        items.push({
          id: `web-${r.id}`,
          fecha: r.checkInWeb.enviadoEn,
          titulo: 'Check-in web enviado',
          detalle: `${r.codigo} · ${(checkInRealizado(r) || r.checkInWeb.estado === 'aprobado') ? 'Validado por Recepción' : r.checkInWeb.estado === 'rechazado' ? 'Rechazado para corrección' : 'Pendiente de validación'}`,
          tipo: 'Check-in'
        });
      if (r.checkInEn)
        items.push({
          id: `in-${r.id}`,
          fecha: r.checkInEn,
          titulo: 'Entrada registrada',
          detalle: `${r.codigo} · ${r.origenCheckIn === 'portal' ? 'Realizada desde el portal' : 'Realizada en Recepción'}`,
          tipo: 'Check-in'
        });
      if (r.checkOutEn)
        items.push({ id: `out-${r.id}`, fecha: r.checkOutEn, titulo: 'Salida registrada', detalle: `${r.codigo} · estancia finalizada`, tipo: 'Check-out' });
      r.pagos.forEach(p => items.push({
        id: `p-${r.id}-${p.id}`,
        fecha: p.fecha,
        titulo: 'Pago registrado',
        detalle: `${r.codigo} · ${dinero(p.monto)} · ${METODO_LABEL[p.metodo]} · ${p.comprobante}`,
        tipo: 'Pago'
      }));
      r.servicios.forEach(s => items.push({
        id: `s-${r.id}-${s.id}`,
        fecha: s.fecha,
        titulo: `Servicio: ${s.tipo}`,
        detalle: `${s.descripcion} · ${s.cantidad} × ${dinero(s.precioUnitario)}`,
        tipo: 'Servicio'
      }));
      ;
      (r.actividadPortal ?? []).forEach(a => items.push({
        id: `a-${a.id}`,
        fecha: a.fechaHora,
        titulo: `${a.tipo === 'pedido' ? 'Solicitud' : 'Reservación'} desde el portal`,
        detalle: `${a.categoria} · ${a.detalle} · ${a.estado}`,
        tipo: 'Portal'
      }));
    });
    solicitudes.filter(s => s.huespedId === huesped.id).forEach(s => items.push({
      id: `sol-${s.id}`,
      fecha: s.fecha,
      titulo: `Solicitud a ${s.area}`,
      detalle: `Hab. ${s.habitacionNumero} · ${s.descripcion} · ${s.estado.replace('-', ' ')}`,
      tipo: 'Solicitud'
    }));
    return items.sort((a, b) => b.fecha.localeCompare(a.fecha));
  },
    [huesped.id, reservas, solicitudes]);
  const colores: Record<string, string> = {
    Reserva: 'bg-[#E9F0F7] text-[#18345C]',
    Solicitud: 'bg-[#FFF3D5] text-[#8A6200]',
    Servicio: 'bg-[#F3E8FF] text-[#6B21A8]',
    Pago: 'bg-[#DCFCE7] text-[#166534]',
    Portal: 'bg-[#E0F2FE] text-[#075985]',
    'Check-in': 'bg-[#DBEAFE] text-[#1E40AF]',
    'Check-out': 'bg-[#F1F5F9] text-[#475569]'
  };
  return <div className="space-y-2">
    <div className="rounded-xl border border-[#BFD4EA] bg-[#F5FAFF] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm text-[#71839B]">Historial completo de</p>
          <h3 className="text-xl font-semibold text-[#18345C]">
            {huesped.nombre}
          </h3>
        </div>
        <div className="flex gap-2 text-center">
          <div>
            <b className="block text-xl text-[#18345C]">
              {reservas.filter(r => r.huespedId === huesped.id).length}
            </b>
            <small className="text-[#71839B]">reservas</small>
          </div>
          <div>
            <b className="block text-xl text-[#18345C]">
              {solicitudes.filter(s => s.huespedId === huesped.id).length}
            </b>
            <small className="text-[#71839B]">solicitudes</small>
          </div>
        </div>
      </div>
    </div>
    <div className="relative ml-3 border-l-2 border-[#E5E0D8] pl-6">
      {movimientos.map((m,
        i) => <div key={m.id} className="relative pb-3 last:pb-0">
          <span className={`absolute -left-[33px] top-1 grid h-4 w-4 place-items-center rounded-full border-4 border-white ${i === 0 ? 'bg-[#D8B94E]' : 'bg-[#9AA9BB]'}`} />
          <div className={`rounded-xl border p-3 ${m.id === `res-${reserva.id}` ? 'border-[#9BC5F2] bg-[#F8FBFF]' : 'border-[#E5E0D8] bg-white'}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="font-semibold text-[#18345C]">
                    {m.titulo}
                  </h4>
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${colores[m.tipo] ?? 'bg-gray-100 text-gray-600'}`}>
                    {m.tipo}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[#52677F]">
                  {m.detalle}
                </p>
              </div>
              <time className="text-xs text-[#8290A3]">
                {formatoFechaHora(m.fecha)}
              </time>
            </div>
          </div>
        </div>)}
      {movimientos.length === 0 && <p className="pb-4 text-sm text-[#8290A3]">Todavía no hay movimientos registrados.</p>}
    </div>
  </div>;
}
function TabResumen({ bffAction, reserva, huesped, habitacion, habitaciones, reservas, onAsignarHabitacion, onCheckIn, onValidarCheckInWeb, onRechazarCheckInWeb, onCheckOut, onCancelar, }: Props & {
  habitacion: HabitacionHotel | null;
}) {
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [errMotivo, setErrMotivo] = useState(false);
  const [rechazandoCheckIn, setRechazandoCheckIn] = useState(false);
  const [motivoCheckIn, setMotivoCheckIn] = useState('');
  const [facturaCheckout, setFacturaCheckout] = useState(false);
  const cerrada = reserva.estado === 'finalizada' || reserva.estado === 'cancelada';
  const disponiblesParaAsignar = habitacionesDisponibles(reserva.fechaEntrada, reserva.fechaSalida, habitaciones, reservas, { personas: reserva.personas, ignorarReservaId: reserva.id });
  const puedeCheckIn = !checkInRealizado(reserva) && (reserva.estado === 'confirmada' || reserva.estado === 'pendiente') && !!reserva.habitacionId && reserva.checkInWeb?.estado !== 'pendiente';
  const puedeCheckOut = reserva.estado === 'en-curso';
  const cuentaCheckout = calcularCuenta(reserva, habitacion);
  function confirmarCancelacion() {
    if (!motivo.trim()) {
      setErrMotivo(true);
      return;
    }
    onCancelar(reserva.id, motivo.trim());
  }
  return (<div className="space-y-1">
    <div className={`rounded-xl border px-3 py-1 ${reserva.estado === 'cancelada' ? 'border-[#FCA5A5] bg-[#FEF2F2]' : reserva.estado === 'finalizada' ? 'border-[#D1D5DB] bg-[#F8FAFC]' : 'border-[#BFD4EA] bg-[#F5FAFF]'}`}>
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 leading-snug">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[#71839B]">Estado de la estancia</p>
          <p className="mt-0.5 text-[15px] font-semibold text-[#18345C]">
            {metaEstadoDetalle(reserva.estado)}
          </p>
        </div>
      <p className="min-w-0 flex-1 text-sm text-[#52677F]">
        {descripcionEstado(reserva)}
      </p>

        <Chip cls={RESERVA_META[reserva.estado].chip}>
          {RESERVA_META[reserva.estado].label}
        </Chip>
      </div>
     {reserva.estado === 'cancelada' && <p className="mt-2 rounded-lg bg-white px-3 py-2 text-sm text-[#991B1B]">
        <b>Motivo de cancelación:</b>
        {reserva.motivoCancelacion || 'No se registró un motivo.'}
      </p>}
    </div>

    <div className="min-w-0 rounded-xl border border-[#E5E0D8] bg-[#FCFBF8] px-3 py-1 leading-tight [&>div>p]:mb-0.5 [&_div>p]:leading-tight">
      <Seccion titulo="Huésped titular">
        <div className="grid max-w-[760px] grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3 [&>div]:min-w-0">
        <Dato k="Nombre" v={huesped.nombre} />
        <Dato k="Documento" v={`${huesped.tipoDocumento} •••• ${huesped.documento.slice(-4)}`} />
        <Dato k="Teléfono" v={huesped.telefono.replace(/\d(?=.*\d{2})/g, '•')} />
        <Dato k="Correo" v={huesped.correo.replace(/^(.{2}).*(@.*)$/, '$1••••••$2')} />
        <Dato k="Nacionalidad" v={huesped.nacionalidad} />
        </div>
      </Seccion>
      <div className="mt-1 border-t border-[#E5E0D8] pt-1">
        <Seccion titulo="Estancia / Reserva">
          <div className="grid max-w-[760px] grid-cols-1 gap-x-4 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-3 [&>div]:min-w-0">
        <Dato k="Entrada" v={formatoFecha(reserva.fechaEntrada)} />
        <Dato k="Salida" v={formatoFecha(reserva.fechaSalida)} />
        <Dato k="Noches" v={String(nochesEntre(reserva.fechaEntrada, reserva.fechaSalida))} />
        <Dato k="Huéspedes" v={`${reserva.adultos ?? reserva.personas} adultos · ${reserva.ninos ?? 0} niños`} />
        <Dato k="Categoría" v={reserva.tipoHabitacion} />
        <Dato k="Creada" v={formatoFecha(reserva.creadoEn)} />
        {reserva.checkInEn && <Dato k="Check-in" v={formatoFechaHora(reserva.checkInEn)} />}
        {reserva.checkOutEn && <Dato k="Check-out" v={formatoFechaHora(reserva.checkOutEn)} />}
          </div>
        </Seccion>
      </div>
    </div>

    <Seccion titulo="Habitación asignada">
      {habitacion ? ((() => {
        const visual = visualHabitacion(habitacion);
        return <div className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-[#F8F6F0] sm:flex">
          <img src={visual.image} alt={`Habitación ${habitacion.numero}`} className="h-24 w-full shrink-0 object-cover sm:h-28 sm:w-36" />
          <div className="flex-1 p-3">
            <p className="text-[12px] font-semibold uppercase tracking-[.16em] text-[#B38719]">Piso {habitacion.piso}</p>
            <p className="text-[17px] font-bold text-[#18345C]">Habitación {habitacion.numero}</p>
            <p className="text-[14px] text-[#18345C] mt-1">
              {visual.name}
            </p>
            <p className="mt-2 text-[13px] text-[#52677F]">{visual.beds} · hasta {habitacion.capacidad} huéspedes · {visual.size} m²</p>
            <p className="mt-2 text-[18px] font-bold text-[#18345C]">
              {dinero(habitacion.precioNoche)}
              <span className="text-xs font-normal text-[#71839B]">por noche</span>
            </p>
          </div>
        </div>;
      })()) : (<p className="text-[13px] text-[#9A3412] bg-[#FFF7ED] border border-[#FDBA74] rounded-lg px-3 py-1">
        Sin habitación asignada. Asigna una para poder hacer el check-in.
      </p>)}

      {!bffAction && !cerrada && (<div className="mt-1">
        <SelectorHabitacion
          habitaciones={disponiblesParaAsignar}
          seleccionadaId={reserva.habitacionId ?? ''}
          onSeleccionar={id => onAsignarHabitacion(reserva.id, id)}
          titulo={habitacion ? 'Cambiar habitación' : 'Asignar habitación disponible'} />
        {disponiblesParaAsignar.length === 0 && (<p className="text-[12px] text-[#991B1B] mt-1">
          No hay habitaciones libres para estas fechas y capacidad.
        </p>)}
      </div>)}
    </Seccion>

    {reserva.checkInWeb && (<Seccion titulo="Check-in enviado desde el portal">
      <div className="rounded-xl border border-[#9BC5F2] bg-[#F5FAFF] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-semibold text-[#18345C]">Evidencias para validación</p>
            <p className="text-xs text-[#71839B]">Enviado {formatoFechaHora(reserva.checkInWeb.enviadoEn)}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${(checkInRealizado(reserva) || reserva.checkInWeb.estado === 'aprobado') ? 'bg-[#DCFCE7] text-[#166534]' : 'bg-[#FFF3D5] text-[#8A6200]'}`}>
            {(checkInRealizado(reserva) || reserva.checkInWeb.estado === 'aprobado') ? 'Validado' : reserva.checkInWeb.estado === 'rechazado' ? 'Corrección solicitada' : 'Pendiente de validar'}
          </span>
        </div>
        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <DocumentosCheckIn key={reserva.checkInWeb.enviadoEn} checkInWeb={reserva.checkInWeb} tipoDocumento={huesped.tipoDocumento}
            onSolicitarReenvio={checkInWebPendiente(reserva) ? motivo => onRechazarCheckInWeb(reserva.id, motivo) : undefined} />
          <div className="rounded-lg border border-[#DCE3EA] bg-white p-2">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#71839B]">Aceptación registrada</p>
            <div className="grid place-items-center rounded-md bg-[#F0FAF4] px-3 text-center text-sm font-semibold text-[#166534]">✓ El huésped aceptó los términos y condiciones de la estancia</div>
            <p className="mt-2 text-xs text-[#52677F]">La fecha y hora del envío quedan registradas en el sistema.</p>
          </div>
        </div>
        {reserva.checkInWeb.peticiones.length > 0 && <div className="mt-2 rounded-lg bg-white p-3 text-sm text-[#52677F]">
          <b className="text-[#18345C]">Peticiones:</b>
          {reserva.checkInWeb.peticiones.join(', ')}
          {reserva.checkInWeb.notaPeticiones ? ` · ${reserva.checkInWeb.notaPeticiones}` : ''}
        </div>}
        {checkInWebPendiente(reserva) && !rechazandoCheckIn && <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <button
            disabled={!reserva.habitacionId}
            onClick={() => onValidarCheckInWeb(reserva.id)}
            className="rounded-lg bg-[#18345C] py-2 font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9AA9BB]">Activar</button>
          <button onClick={() => setRechazandoCheckIn(true)} className="rounded-lg border border-[#DC2626] py-2 font-semibold text-[#B42318]">Rechazar activación</button>
        </div>}
        {checkInWebPendiente(reserva) && rechazandoCheckIn && <div className="mt-2 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] p-3">
          <p className="font-semibold text-[#991B1B]">Motivo del rechazo</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {['El nombre no coincide con el documento',
              'El número de DPI o pasaporte no coincide',
              'La imagen del documento no es legible',
              'El documento está vencido',
              'Otro motivo'].map(m => <button
                key={m}
                onClick={() => setMotivoCheckIn(m)}
                className={`rounded-full border px-3 py-1.5 text-xs ${motivoCheckIn === m ? 'border-[#991B1B] bg-[#991B1B] text-white' : 'border-[#FCA5A5] bg-white text-[#7F1D1D]'}`}>
                {m}
              </button>)}
          </div>
          <textarea
            value={motivoCheckIn}
            onChange={e => setMotivoCheckIn(e.target.value)}
            rows={2}
            className="mt-2 w-full rounded-lg border border-[#FCA5A5] bg-white p-3 text-sm"
            placeholder="Explica qué debe corregir el huésped" />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button onClick={() => {
              setRechazandoCheckIn(false);
              setMotivoCheckIn('');
            }} className="rounded-lg border bg-white py-2">Volver</button>
            <button
              disabled={!motivoCheckIn.trim()}
              onClick={() => {
                onRechazarCheckInWeb(reserva.id, motivoCheckIn.trim());
                setRechazandoCheckIn(false);
              }}
              className="rounded-lg bg-[#B42318] py-2 font-semibold text-white disabled:opacity-40">Confirmar rechazo</button>
          </div>
        </div>}
        {checkInWebPendiente(reserva) && !reserva.habitacionId && <p className="mt-2 text-xs text-[#9A3412]">Primero asigna una habitación para poder activar la llave.</p>}
      </div>
    </Seccion>)}

    {!cerrada && !cancelando && (<div className="flex flex-col sm:flex-row gap-2">
      {puedeCheckIn && (!bffAction || bffAction === 'check-in') && (<button
        onClick={() => onCheckIn(reserva.id)}
        className="flex-1 py-2 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
        Realizar check-in
      </button>)}
      {puedeCheckOut && (!bffAction || bffAction === 'check-out') && (<button
        onClick={() => setFacturaCheckout(true)}
        className="flex-1 py-2 text-[15px] font-semibold bg-[#166534] text-white rounded-md hover:bg-[#14532D] transition-colors">
        Revisar factura y check-out
      </button>)}
      {!bffAction && <button
        onClick={() => setCancelando(true)}
        className="flex-1 sm:flex-none sm:px-5 py-2 text-[15px] font-semibold border border-[#FCA5A5] text-[#991B1B] rounded-md hover:bg-[#FEF2F2] transition-colors">
        Cancelar reserva
      </button>}
    </div>)}

    {!cerrada && !cancelando && !reserva.habitacionId && (reserva.estado === 'confirmada' || reserva.estado === 'pendiente') && (<p className="text-[12px] text-[#9A3412]">Asigna una habitación para habilitar el check-in.</p>)}

    {cancelando && (<div className="border border-[#FCA5A5] bg-[#FEF2F2] rounded-xl px-4 py-2 space-y-2">
      <p className="text-[15px] font-semibold text-[#991B1B]">Cancelar {reserva.codigo}</p>
      <p className="text-[13px] text-[#7F1D1D]">
        Selecciona un motivo. La habitación quedará liberada y la reserva no podrá reactivarse.
      </p>
      <div className="flex flex-wrap gap-2">
        {MOTIVOS_CANCELACION.map(m => (<button
          key={m}
          type="button"
          onClick={() => {
            setMotivo(m);
            setErrMotivo(false);
          }}
          className={`text-[12px] font-medium px-2.5 py-1 rounded-md border transition-colors ${motivo === m
            ? 'bg-[#991B1B] text-white border-[#991B1B]'
            : 'bg-white text-[#7F1D1D] border-[#FCA5A5] hover:bg-[#FEE2E2]'}`}>
          {m}
        </button>))}
      </div>
      <textarea
        rows={2}
        value={motivo}
        onChange={e => {
          setMotivo(e.target.value);
          setErrMotivo(false);
        }}
        placeholder="Detalle del motivo…"
        className="w-full border border-[#FCA5A5] rounded-md px-3 py-2 text-sm text-[#1F2933] resize-none focus:outline-none focus:border-[#991B1B] bg-white" />
      {errMotivo && <p className="text-xs text-[#991B1B]">El motivo es obligatorio.</p>}
      <div className="flex gap-2">
        <button
          onClick={() => {
            setCancelando(false);
            setMotivo('');
            setErrMotivo(false);
          }}
          className="flex-1 py-2 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md bg-white hover:bg-[#F8F6F0] transition-colors">
          Volver
        </button>
        <button
          onClick={confirmarCancelacion}
          className="flex-1 py-2 text-sm font-semibold bg-[#991B1B] text-white rounded-md hover:bg-[#7F1D1D] transition-colors">
          Confirmar cancelación
        </button>
      </div>
    </div>)}

    {facturaCheckout && <div className="fixed inset-0 z-[70] grid place-items-center bg-[#071D34]/55 p-3" onMouseDown={() => setFacturaCheckout(false)}>
      <section className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onMouseDown={e => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b px-5 py-2">
          <div>
            <h2 className="text-2xl font-semibold text-[#18345C]">Factura del check-out</h2>
            <p className="text-sm text-[#71839B]">Revisa la cuenta antes de finalizar la estancia.</p>
          </div>
          <button onClick={() => setFacturaCheckout(false)} className="text-2xl text-[#71839B]">×</button>
        </div>
        <div className="p-3 sm:p-4">
          <div className="grid gap-2 border-b border-[#D8B94E] pb-3 sm:grid-cols-[150px_1fr_1fr]">
            <div className="flex items-center justify-center sm:border-r">
              <img src="/villa-serena-logo.png" alt="Villa Serena Hotel" className="max-h-24 max-w-[135px] object-contain" />
            </div>
            <div className="text-sm leading-relaxed text-[#18345C]">
              <h3 className="text-lg font-semibold">Villa Serena Hotel</h3>
              <p>Huehuetenango, Guatemala</p>
              <p>NIT: {HOTEL.nit}</p>
              <p>Correo: villaserenagt@gmail.com</p>
            </div>
            <div className="text-sm leading-relaxed text-[#18345C] sm:text-right">
              <h3 className="font-serif text-xl font-bold">FACTURA DE CHECK-OUT</h3>
              <p className="text-[10px] uppercase tracking-wider text-[#71839B]">Resumen previo a finalizar la estancia</p>
              <p className="mt-2">
                <b>Reserva:</b>
                {reserva.codigo}
              </p>
              <p>
                <b>Habitación:</b>
                {habitacion?.numero ?? '—'}
              </p>
              <p>
                <b>Huésped:</b>
                {huesped.nombre}
              </p>
            </div>
          </div>
          <div className="mt-5 overflow-hidden rounded-xl border border-[#E5E0D8]">
            <FilaCuenta k={`Alojamiento · ${cuentaCheckout.noches} noches`} v={dinero(cuentaCheckout.alojamiento)} />
            {reserva.servicios.map(s => <FilaCuenta key={s.id} k={`${s.tipo} · ${s.descripcion}`} v={dinero(s.cantidad * s.precioUnitario)} sub />)}
            <FilaCuenta k="Subtotal" v={dinero(cuentaCheckout.subtotal)} />
            <FilaCuenta k="Descuento" v={`- ${dinero(cuentaCheckout.descuento)}`} />
            <FilaCuenta k="Total" v={dinero(cuentaCheckout.total)} fuerte />
            <FilaCuenta k="Pagado" v={dinero(cuentaCheckout.pagado)} />
            <div className={`flex items-center justify-between px-4 py-2 font-bold ${cuentaCheckout.saldo <= 0 ? 'bg-[#EAF6EC] text-[#166534]' : 'bg-[#FFF3D5] text-[#8A6200]'}`}>
              <span>Saldo pendiente</span>
              <span className="text-xl">
                {dinero(Math.max(0, cuentaCheckout.saldo))}
              </span>
            </div>
          </div>
          {cuentaCheckout.saldo > 0 && <p className="mt-2 rounded-lg border border-[#F6C453] bg-[#FFF9E8] px-4 py-2 text-sm text-[#78450A]">Para finalizar el check-out primero debe registrarse el pago completo en “Cuenta y pagos”.</p>}
          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button onClick={() => window.print()} className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C]">Imprimir factura</button>
            <button
              onClick={() => window.alert(`La factura se enviará a ${huesped.correo}.`)}
              className="rounded-lg border border-[#18345C] px-4 py-2 text-sm font-semibold text-[#18345C]">Enviar por correo</button>
            <button
              disabled={cuentaCheckout.saldo > 0}
              onClick={() => {
                onCheckOut(reserva.id);
                setFacturaCheckout(false);
              }}
              className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-[#9AA9BB]">Finalizar check-out</button>
          </div>
        </div>
      </section>
    </div>}
  </div>);
}
function TabCuenta({ reserva, habitacion, onRegistrarPago, onAplicarDescuento, onVerComprobante, onPagoRegistrado, }: Props & {
  habitacion: HabitacionHotel | null;
  onVerComprobante: (p: Pago) => void;
  onPagoRegistrado: (p: Pago) => void;
}) {
  const cuenta = calcularCuenta(reserva, habitacion);
  const cerrada = reserva.estado === 'cancelada';
  const [pagando, setPagando] = useState(false);
  const [monto, setMonto] = useState('');
  const [metodo, setMetodo] = useState<MetodoPago>('efectivo');
  const [errPago, setErrPago] = useState('');
  const [descMonto, setDescMonto] = useState(String(reserva.descuento || ''));
  function registrar() {
    const n = Number(monto);
    if (!n || n <= 0) {
      setErrPago('Ingresa un monto válido.');
      return;
    }
    if (Math.abs(n - cuenta.saldo) > 0.01) {
      setErrPago('Registra el saldo completo; el hotel no maneja anticipos ni pagos parciales.');
      return;
    }
    const pago = onRegistrarPago(reserva.id, { monto: Math.round(n * 100) / 100, metodo });
    setPagando(false);
    setMonto('');
    setMetodo('efectivo');
    setErrPago('');
    onPagoRegistrado(pago);
  }
  return (<div className="space-y-2">

    <div className="border border-[#E5E0D8] rounded-xl overflow-hidden">
      <FilaCuenta
        k={`Alojamiento · ${cuenta.noches} noche${cuenta.noches !== 1 ? 's' : ''} × ${dinero(cuenta.precioNoche)}`}
        v={dinero(cuenta.alojamiento)} />
      {reserva.servicios.map(s => (<FilaCuenta
        key={s.id}
        k={`${s.tipo} · ${s.descripcion} (${s.cantidad} × ${dinero(s.precioUnitario)})`}
        v={dinero(s.cantidad * s.precioUnitario)}
        sub />))}
      <FilaCuenta k="Subtotal" v={dinero(cuenta.subtotal)} />
      <FilaCuenta k="Descuento" v={cuenta.descuento > 0 ? `- ${dinero(cuenta.descuento)}` : dinero(0)} />
      <FilaCuenta k="Total de la cuenta" v={dinero(cuenta.total)} fuerte />
      <FilaCuenta k="Pagado" v={dinero(cuenta.pagado)} />
      <div className="flex items-center justify-between px-4 py-2 bg-[#18345C]">
        <span className="text-[13px] font-semibold text-white uppercase tracking-wide">Saldo pendiente</span>
        <span className="text-[20px] font-bold text-white">
          {dinero(Math.max(0, cuenta.saldo))}
        </span>
      </div>
    </div>

    {!cerrada && (<div className="flex flex-wrap gap-2">
      <button
        onClick={() => {
          setPagando(v => !v);
          setMonto(cuenta.saldo > 0 ? String(cuenta.saldo) : '');
        }}
        className="px-4 py-2 text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
        Registrar pago
      </button>
    </div>)}

    {!cerrada && (<div className="rounded-xl border border-[#E5E0D8] bg-[#FCFBF8] p-3">
      <p className="mb-2 text-[14px] font-semibold text-[#18345C]">Descuento autorizado</p>
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Campo label="Monto de descuento">
            <input type="number" min="0" value={descMonto} onChange={e => setDescMonto(e.target.value)} className={INPUT_CLS} />
          </Campo>
        </div>
        <button
          onClick={() => onAplicarDescuento(reserva.id, Math.max(0, Number(descMonto) || 0))}
          className="px-4 py-2 text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          Guardar
        </button>
      </div>
      <p className="mt-2 text-xs text-[#71839B]">El descuento queda registrado antes de cobrar el saldo.</p>
    </div>)}

    {pagando && !cerrada && (<div className="border border-[#E5E0D8] rounded-xl p-3 space-y-2">
      <p className="text-[14px] font-semibold text-[#18345C]">Registrar pago</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Campo label="Monto" error={errPago}>
          <input type="number" min="0" value={monto} onChange={e => {
            setMonto(e.target.value);
            setErrPago('');
          }} className={INPUT_CLS} />
        </Campo>
        <Campo label="Método de pago">
          <select value={metodo} onChange={e => setMetodo(e.target.value as MetodoPago)} className={INPUT_CLS}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta de crédito o débito</option>
          </select>
        </Campo>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            setPagando(false);
            setErrPago('');
          }}
          className="flex-1 py-2 text-sm border border-[#E5E0D8] text-[#6B7280] rounded-md hover:bg-[#F8F6F0] transition-colors">
          Cancelar
        </button>
        <button onClick={registrar} className="flex-1 py-2 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          Registrar y generar comprobante
        </button>
      </div>
    </div>)}

    <div>
      <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-1">Pagos registrados</p>
      {reserva.pagos.length === 0 ? (<p className="text-[13px] text-[#AEBCC1]">Aún no hay pagos.</p>) : (<div className="border border-[#E5E0D8] rounded-xl divide-y divide-[#F0EBE3]">
        {reserva.pagos.map(p => (<div key={p.id} className="flex items-center gap-2 px-4 py-2">
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#1F2933]">
              {dinero(p.monto)} · {METODO_LABEL[p.metodo]}
            </p>
            <p className="text-[12px] text-[#AEBCC1]">
              {formatoFechaHora(p.fecha)} · {p.comprobante}
            </p>
          </div>
          <button onClick={() => onVerComprobante(p)} className="text-[13px] font-semibold text-[#18345C] hover:underline shrink-0">
            Ver comprobante
          </button>
        </div>))}
      </div>)}
    </div>
  </div>);
}
function TabServicios({ reserva, onAgregarServicio, onQuitarServicio }: Props) {
  const cerrada = reserva.estado === 'finalizada' || reserva.estado === 'cancelada';
  const catalogo: Record<string, {
    nombre: string;
    precio: number;
  }[]> = {
    Restaurante: [{ nombre: 'Desayuno', precio: 85 }, { nombre: 'Almuerzo', precio: 125 }, { nombre: 'Cena', precio: 145 }, { nombre: 'Consumo adicional', precio: 75 }],
    Gimnasio: [{ nombre: 'Acceso incluido', precio: 0 },
    { nombre: 'Sesión con entrenador', precio: 120 },
    { nombre: 'Clase de movilidad', precio: 75 },
    { nombre: 'Clase funcional', precio: 90 }],
    Piscina: [{ nombre: 'Acceso incluido', precio: 0 }, { nombre: 'Reserva de área privada', precio: 175 }],
    Spa: [{ nombre: 'Masaje relajante', precio: 425 },
    { nombre: 'Masaje de espalda y cuello', precio: 250 },
    { nombre: 'Masaje con piedras calientes', precio: 475 },
    { nombre: 'Reflexología', precio: 225 },
    { nombre: 'Facial relajante', precio: 325 },
    { nombre: 'Exfoliación corporal', precio: 350 },
    { nombre: 'Masaje para dos', precio: 800 },
    { nombre: 'Experiencia de relajación', precio: 550 }],
    Lavandería: [{ nombre: 'Lavado', precio: 35 }, { nombre: 'Planchado', precio: 25 }],
    Estacionamiento: [{ nombre: 'Estacionamiento por hora', precio: 12 }, { nombre: 'Estacionamiento por día', precio: 50 }],
    Minibar: [{ nombre: 'Consumo de minibar', precio: 65 }],
    Transporte: [{ nombre: 'Traslado local', precio: 180 }],
  };
  const [tipo, setTipo] = useState('Restaurante');
  const [opcion, setOpcion] = useState('Desayuno');
  const [cantidad, setCantidad] = useState('1');
  const [agregandoServicio, setAgregandoServicio] = useState(false);
  const opciones = catalogo[tipo] || [];
  const elegido = opciones.find(x => x.nombre === opcion) || opciones[0];
  const etiquetaCantidad = tipo === 'Lavandería' ? 'Prendas' : tipo === 'Estacionamiento' ? (opcion.includes('hora') ? 'Horas' : 'Días') : tipo === 'Spa' ? 'Personas' : tipo === 'Gimnasio' || tipo === 'Piscina' ? 'Sesiones' : 'Cantidad';
  function cambiarTipo(v: string) {
    setTipo(v);
    setOpcion((catalogo[v] || [])[0]?.nombre || '');
    setCantidad('1');
  }
  function agregar() {
    const c = Math.max(1, Number(cantidad) || 1);
    if (!elegido)
      return;
    onAgregarServicio(reserva.id, { tipo, descripcion: elegido.nombre, cantidad: c, precioUnitario: elegido.precio });
    setCantidad('1');
    setAgregandoServicio(false);
  }
  return <div className="space-y-2">
    {(reserva.actividadPortal?.length ?? 0) > 0 && <section>
      <p className="mb-2 text-[10px] uppercase tracking-widest text-[#AEBCC1]">Actividad realizada por el huésped</p>
      <div className="divide-y divide-[#F0EBE3] rounded-xl border border-[#E5E0D8]">
        {reserva.actividadPortal!.map(a => <div key={a.id} className="flex flex-wrap items-center gap-2 px-4 py-2">
          <div className="min-w-0 flex-1">
            <p className="font-medium text-[#18345C]">{a.tipo === 'pedido' ? 'Pedido' : 'Reservación'} · {a.categoria}</p>
            <p className="text-xs text-[#71839B]">{a.detalle} · {formatoFechaHora(a.fechaHora)}</p>
          </div>
          {typeof a.total === 'number' && <b className="text-[#18345C]">
            {dinero(a.total)}
          </b>}
          <span className="rounded-full bg-[#F1F7FE] px-2.5 py-1 text-xs font-semibold text-[#1E4E8C]">
            {a.estado}
          </span>
        </div>)}
      </div>
    </section>}
    {reserva.servicios.length === 0 ? <p className="text-[13px] text-[#AEBCC1]">No hay servicios adicionales cargados.</p> : <div className="border border-[#E5E0D8] rounded-xl divide-y divide-[#F0EBE3]">
      {reserva.servicios.map(s => <div key={s.id} className="flex items-center gap-2 px-4 py-2">
        <div className="flex-1">
          <p className="text-[14px] font-medium">{s.tipo} · {s.descripcion}</p>
          <p className="text-[12px] text-[#AEBCC1]">{s.cantidad} × {dinero(s.precioUnitario)} = {dinero(s.cantidad * s.precioUnitario)}</p>
        </div>
        {!cerrada && <button onClick={() => onQuitarServicio(reserva.id, s.id)} className="text-[13px] font-semibold text-[#991B1B]">Quitar</button>}
      </div>)}
    </div>}
    {!cerrada && <div className="flex justify-end">
      <button onClick={() => setAgregandoServicio(true)} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white hover:bg-[#102747]">+ Agregar servicio</button>
    </div>}
    {agregandoServicio && <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#071D34]/45 p-3"
      onMouseDown={e => e.target === e.currentTarget && setAgregandoServicio(false)}>
      <section className="relative w-full max-w-lg rounded-2xl bg-white p-3 shadow-2xl sm:p-5">
        <button aria-label="Cerrar" onClick={() => setAgregandoServicio(false)} className="absolute right-4 top-3 text-2xl text-[#71839B]">×</button>
        <h3 className="pr-8 text-lg font-semibold text-[#18345C]">Agregar servicio</h3>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <Campo label="Servicio">
            <select value={tipo} onChange={e => cambiarTipo(e.target.value)} className={INPUT_CLS}>
              {Object.keys(catalogo).map(t => <option key={t}>
                {t}
              </option>)}
            </select>
          </Campo>
          <Campo label="Concepto">
            <select value={opcion} onChange={e => setOpcion(e.target.value)} className={INPUT_CLS}>
              {opciones.map(o => <option key={o.nombre}>
                {o.nombre}
              </option>)}
            </select>
          </Campo>
          <Campo label={etiquetaCantidad}>
            <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)} className={INPUT_CLS} />
          </Campo>
          <div className="flex items-end">
            <div className="flex min-h-0 w-full items-center justify-between rounded-lg bg-[#F8F6F0] px-3 py-2">
              <span className="text-sm text-[#6B7280]">Precio unitario</span>
              <b className="text-[#18345C]">
                {dinero(elegido?.precio || 0)}
              </b>
            </div>
          </div>
        </div>
        {tipo === 'Restaurante' && opcion === 'Desayuno' && <p className="mt-2 text-xs text-[#6B7280]">Si la categoría reservada incluye desayuno, no se cobrará nuevamente.</p>}
        <div className="mt-2 flex justify-end gap-2 border-t pt-2">
          <button onClick={() => setAgregandoServicio(false)} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm">Cancelar</button>
          <button onClick={agregar} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Agregar a la cuenta</button>
        </div>
      </section>
    </div>}
  </div>;
}
function TabHuespedes({ reserva, huesped, onAgregarAcompanante, onQuitarAcompanante }: Props) {
  const cerrada = reserva.estado === 'finalizada' || reserva.estado === 'cancelada';
  const [nombre, setNombre] = useState('');
  const [documento, setDocumento] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState<'DPI' | 'Pasaporte'>('DPI');
  const [telefono, setTelefono] = useState('');
  const [err, setErr] = useState('');
  const [registrandoHuesped, setRegistrandoHuesped] = useState(false);
  const totalPersonas = reserva.acompanantes.length + 1;
  function agregar() {
    if (!nombre.trim())
      return setErr('Nombre obligatorio.');
    if (!documento.trim())
      return setErr('Número de documento obligatorio.');
    onAgregarAcompanante(reserva.id, { nombre: nombre.trim(), tipoDocumento, documento: documento.trim(), telefono: telefono.trim() });
    setNombre('');
    setDocumento('');
    setTelefono('');
    setErr('');
    setRegistrandoHuesped(false);
  }
  return (<div className="space-y-2">
    <div className="border border-[#E5E0D8] rounded-xl divide-y divide-[#F0EBE3]">
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#1E40AF] flex items-center justify-center shrink-0">
          <UserIcon size={15} />
        </span>
        <div className="flex-1">
          <p className="text-[14px] font-medium text-[#1F2933]">
            {huesped.nombre}
          </p>
          <p className="text-[12px] text-[#AEBCC1]">Titular · {huesped.tipoDocumento} •••• {huesped.documento.slice(-4)}</p>
        </div>
      </div>
      {reserva.acompanantes.map((a,
        i) => (<div key={i} className="flex items-center gap-2 px-4 py-2">
          <span className="w-8 h-8 rounded-lg bg-[#F8F6F0] text-[#6B7280] flex items-center justify-center shrink-0">
            <UserIcon size={15} />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-[#1F2933]">
              {a.nombre}
            </p>
            <p className="text-[12px] text-[#AEBCC1]">{a.tipoDocumento || 'Documento'} •••• {a.documento.slice(-4)}{a.telefono ? ` · ${a.telefono}` : ''}</p>
          </div>
          {!cerrada && (<button onClick={() => onQuitarAcompanante(reserva.id, i)} className="text-[13px] font-semibold text-[#991B1B] hover:underline shrink-0">
            Quitar
          </button>)}
        </div>))}
    </div>

    <p className="text-[12px] text-[#6B7280]">
      {totalPersonas} de {reserva.personas} personas registradas para esta habitación.
    </p>
    <p className="rounded-lg bg-[#F1F7FE] px-3 py-2 text-xs text-[#52677F]">Estos datos fueron enviados durante el check-in en línea. Recepción puede revisarlos o corregirlos si el huésped lo solicita.</p>

    {!cerrada && <div className="flex justify-end">
      <button onClick={() => setRegistrandoHuesped(true)} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">+ Registrar huésped adicional</button>
    </div>}
    {registrandoHuesped && <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#071D34]/45 p-3"
      onMouseDown={e => e.target === e.currentTarget && setRegistrandoHuesped(false)}>
      <section className="relative w-full max-w-lg rounded-2xl bg-white p-3 shadow-2xl sm:p-5">
        <button aria-label="Cerrar" onClick={() => setRegistrandoHuesped(false)} className="absolute right-4 top-3 text-2xl text-[#71839B]">×</button>
        <h3 className="pr-8 text-lg font-semibold text-[#18345C]">Registrar huésped adicional</h3>
        <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Campo label="Nombre completo">
            <input type="text" value={nombre} onChange={e => {
              setNombre(e.target.value);
              setErr('');
            }} className={INPUT_CLS} />
          </Campo>
          <Campo label="Tipo de documento">
            <select value={tipoDocumento} onChange={e => setTipoDocumento(e.target.value as 'DPI' | 'Pasaporte')} className={INPUT_CLS}>
              <option>DPI</option>
              <option>Pasaporte</option>
            </select>
          </Campo>
          <Campo label="Número de documento">
            <input
              type="text"
              value={documento}
              onChange={e => setDocumento(e.target.value.replace(tipoDocumento === 'DPI' ? /\D/g : /[^A-Za-z0-9]/g, '').slice(0, tipoDocumento === 'DPI' ? 13 : 20))}
              maxLength={tipoDocumento === 'DPI' ? 13 : 20}
              className={INPUT_CLS} />
          </Campo>
          <Campo label="Teléfono (opcional)">
            <input
              value={telefono}
              onChange={e => setTelefono(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
              inputMode="numeric"
              className={INPUT_CLS} />
          </Campo>
        </div>
        {err && <p className="mt-2 text-xs text-[#991B1B]">
          {err}
        </p>}
        <div className="mt-2 flex justify-end gap-2 border-t pt-2">
          <button onClick={() => setRegistrandoHuesped(false)} className="rounded-lg border border-[#E5E0D8] px-4 py-2 text-sm">Cancelar</button>
          <button onClick={agregar} className="rounded-lg bg-[#18345C] px-4 py-2 text-sm font-semibold text-white">Agregar a la reserva</button>
        </div>
      </section>
    </div>}
  </div>);
}
function TabCambios({ reserva, habitaciones, reservas, onModificar }: Props) {
  const cerrada = reserva.estado === 'finalizada' || reserva.estado === 'cancelada';
  const [entrada, setEntrada] = useState(reserva.fechaEntrada);
  const [salida, setSalida] = useState(reserva.fechaSalida);
  const [adultos, setAdultos] = useState(String(reserva.adultos ?? reserva.personas));
  const [ninos, setNinos] = useState(String(reserva.ninos ?? 0));
  const [habId, setHabId] = useState<string>(reserva.habitacionId ?? '');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState(false);
  const nAdultos = Math.max(1, Number(adultos) || 1);
  const nNinos = Math.max(0, Number(ninos) || 0);
  const nPersonas = nAdultos + nNinos;
  const rangoValido = entrada < salida;
  const disponibles = rangoValido
    ? habitacionesDisponibles(entrada, salida, habitaciones, reservas, {
      personas: nPersonas,
      ignorarReservaId: reserva.id,
    })
    : [];
  const habActualEnConflicto = !!habId &&
    rangoValido &&
    habitacionTieneConflicto(habId, entrada, salida, reservas, reserva.id);
  function guardar() {
    setOk(false);
    if (!rangoValido)
      return setErr('La fecha de salida debe ser posterior a la de entrada.');
    if (habId && habActualEnConflicto) {
      return setErr('La habitación elegida ya tiene una reserva en esas fechas. Elige otra.');
    }
    onModificar(reserva.id,
      {
        fechaEntrada: entrada,
        fechaSalida: salida,
        personas: nPersonas,
        adultos: nAdultos,
        ninos: nNinos,
        habitacionId: habId || null,
      });
    setErr('');
    setOk(true);
  }
  if (cerrada) {
    return <p className="text-[13px] text-[#AEBCC1]">Esta reserva está cerrada y no puede modificarse.</p>;
  }
  return (<div className="space-y-2">
    <p className="text-[13px] text-[#6B7280]">
      Al guardar, el sistema verifica de nuevo la disponibilidad para las fechas y la habitación elegidas.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <Campo label="Fecha de entrada">
        <input type="date" value={entrada} onChange={e => {
          setEntrada(e.target.value);
          setOk(false);
        }} className={INPUT_CLS} />
      </Campo>
      <Campo label="Fecha de salida">
        <input type="date" value={salida} min={entrada} onChange={e => {
          setSalida(e.target.value);
          setOk(false);
        }} className={INPUT_CLS} />
      </Campo>
      <Campo label="Adultos">
        <div className="flex items-center gap-3 py-1">
          <button type="button" aria-label="Reducir adultos" disabled={nAdultos <= 1} onClick={() => {
            setAdultos(String(Math.max(1, nAdultos - 1)));
            setOk(false);
          }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D8B94E] text-lg text-[#18345C] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18345C]">−</button>
          <span aria-live="polite" className="min-w-6 text-center text-sm font-semibold text-[#18345C]">{nAdultos}</span>
          <button type="button" aria-label="Aumentar adultos" onClick={() => {
            setAdultos(String(nAdultos + 1));
            setOk(false);
          }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D8B94E] text-lg text-[#18345C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18345C]">+</button>
        </div>
      </Campo>
      <Campo label="Niños">
        <div className="flex items-center gap-3 py-1">
          <button type="button" aria-label="Reducir niños" disabled={nNinos <= 0} onClick={() => {
            setNinos(String(Math.max(0, nNinos - 1)));
            setOk(false);
          }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D8B94E] text-lg text-[#18345C] disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18345C]">−</button>
          <span aria-live="polite" className="min-w-6 text-center text-sm font-semibold text-[#18345C]">{nNinos}</span>
          <button type="button" aria-label="Aumentar niños" onClick={() => {
            setNinos(String(nNinos + 1));
            setOk(false);
          }} className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-[#D8B94E] text-lg text-[#18345C] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18345C]">+</button>
        </div>
      </Campo>
    </div>

    <SelectorHabitacion
      habitaciones={disponibles}
      seleccionadaId={habId}
      onSeleccionar={id => {
        setHabId(id);
        setOk(false);
      }}
      titulo="Habitación disponible para las nuevas fechas"
      permitirSinAsignar />

    {habActualEnConflicto && (<p className="text-[12px] text-[#991B1B]">
      La habitación actual no está libre para el nuevo rango de fechas.
    </p>)}
    {err && <p className="text-[13px] text-[#991B1B]">
      {err}
    </p>}
    {ok && <p className="text-[13px] text-[#166534]">Cambios guardados y disponibilidad verificada.</p>}

    <button onClick={guardar} className="w-full py-2 text-sm font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
      Guardar cambios
    </button>
  </div>);
}
function Seccion({ titulo, children }: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (<div>
    <p className="text-[10px] text-[#AEBCC1] uppercase tracking-widest mb-2">
      {titulo}
    </p>
    {children}
  </div>);
}
function Dato({ k, v }: {
  k: string;
  v: string;
}) {
  return (<div>
    <p className="text-[11px] text-[#AEBCC1]">
      {k}
    </p>
    <p className="text-[13px] text-[#1F2933] font-medium break-words">
      {v}
    </p>
  </div>);
}
function FilaCuenta({ k, v, sub, fuerte }: {
  k: string;
  v: string;
  sub?: boolean;
  fuerte?: boolean;
}) {
  return (<div className={`flex items-baseline justify-between gap-2 px-4 py-2 border-b border-[#F0EBE3] last:border-0 ${fuerte ? 'bg-[#F8F6F0]' : ''}`}>
    <span className={`${sub ? 'text-[12px] text-[#6B7280] pl-3' : 'text-[13px] text-[#1F2933]'} ${fuerte ? 'font-semibold' : ''}`}>
      {k}
    </span>
    <span className={`text-[13px] ${fuerte ? 'font-bold text-[#18345C]' : 'text-[#1F2933]'}`}>
      {v}
    </span>
  </div>);
}
function visualHabitacion(habitacion: HabitacionHotel) {
  return publicRoomForHotelType(habitacion.tipo);
}
function metaEstadoDetalle(estado: Reserva['estado']) { return estado === 'pendiente' ? 'Reserva pendiente de confirmación' : estado === 'confirmada' ? 'Reserva confirmada · check-in pendiente' : estado === 'en-curso' ? 'Estancia en curso' : estado === 'finalizada' ? 'Estancia finalizada' : 'Reserva cancelada'; }
function descripcionEstado(reserva: Reserva) {
  if (reserva.estado === 'pendiente')
    return 'Debe confirmarse la reserva y asignarse una habitación antes del check-in.';
  if (reserva.estado === 'confirmada')
    return 'La reserva está confirmada, pero el huésped todavía no ha realizado el check-in.';
  if (reserva.estado === 'en-curso')
    return 'El huésped ya realizó el check-in y todavía no ha completado el check-out.';
  if (reserva.estado === 'finalizada')
    return `El check-out fue completado${reserva.checkOutEn ? ` el ${formatoFechaHora(reserva.checkOutEn)}` : ''}. La información queda disponible solo para consulta.`;
  return 'La reserva ya no está activa y la habitación quedó liberada.';
}
function SelectorHabitacion({ habitaciones, seleccionadaId, onSeleccionar, titulo, permitirSinAsignar = false }: {
  habitaciones: HabitacionHotel[];
  seleccionadaId: string;
  onSeleccionar: (id: string) => void;
  titulo: string;
  permitirSinAsignar?: boolean;
}) {
  const [piso, setPiso] = useState('todos');
  const [categoria, setCategoria] = useState('todas');
  const pisos = useMemo(() => [...new Set(habitaciones.map(h => h.piso))].sort(), [habitaciones]);
  const categorias = useMemo(() => [...new Set(habitaciones.map(h => h.tipo))], [habitaciones]);
  const filtradas = habitaciones.filter(h => (piso === 'todos' || h.piso === Number(piso)) && (categoria === 'todas' || h.tipo === categoria));
  return <div className="rounded-xl border border-[#E5E0D8] bg-white p-2.5">
    <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[#18345C]">
          {titulo}
        </p>
        <p className="text-xs text-[#71839B]">Solo se muestran habitaciones disponibles y con capacidad suficiente.</p>
      </div>
      <div className="grid grid-cols-2 gap-2 lg:w-[280px] lg:shrink-0">
        <Campo label="Piso">
          <select value={piso} onChange={e => setPiso(e.target.value)} className={`${INPUT_CLS} !py-1.5`}>
            <option value="todos">Todos</option>
            {pisos.map(p => <option key={p} value={p}>Piso {p}</option>)}
          </select>
        </Campo>
        <Campo label="Categoría">
          <select value={categoria} onChange={e => setCategoria(e.target.value)} className={`${INPUT_CLS} !py-1.5`}>
            <option value="todas">Todas</option>
            {categorias.map(c => <option key={c} value={c}>
              {c}
            </option>)}
          </select>
        </Campo>
      </div>
    </div>
    {permitirSinAsignar && <button
      type="button"
      onClick={() => onSeleccionar('')}
      className={`mt-2 rounded-lg border px-4 py-2 text-sm ${!seleccionadaId ? 'border-[#18345C] bg-[#EEF4FB] font-semibold text-[#18345C]' : 'border-[#E5E0D8] text-[#52677F]'}`}>Dejar sin asignar</button>}
    <div className="mt-1.5 grid grid-cols-1 items-start gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
      {filtradas.map(h => {
        const visual = visualHabitacion(h);
        const activa = h.id === seleccionadaId;
        return <button
          type="button"
          key={h.id}
          onClick={() => onSeleccionar(h.id)}
          className={`flex flex-col lg:flex-row lg:items-start overflow-hidden rounded-xl border text-left transition ${activa ? 'border-[#18345C] ring-2 ring-[#18345C]/20' : 'border-[#E5E0D8] hover:border-[#B38719]'}`}>
          <img src={visual.image} alt={`Habitación ${h.numero}`} className="block h-24 w-full shrink-0 object-cover lg:h-[105px] lg:w-[110px]" />
          <div className="flex min-w-0 flex-1 flex-col px-2 py-1.5 leading-snug break-words">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#B38719]">Piso {h.piso}</p>
                <p className="font-bold text-[#18345C]">Habitación {h.numero}</p>
              </div>
            </div>
            <p className="mt-0.5 text-sm text-[#52677F]">{h.tipo} · {visual.beds}</p>
            <p className="mt-0.5 text-xs text-[#71839B]">Hasta {h.capacidad} huéspedes · {visual.size} m²</p>
            <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1">
              <p className="font-bold text-[#18345C]">
              {dinero(h.precioNoche)}
              <span className="text-xs font-normal">por noche</span>
              </p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${activa ? 'bg-[#18345C] text-white' : 'bg-[#EEF4FB] text-[#18345C]'}`}>{activa ? 'Seleccionada' : 'Seleccionar'}</span>
            </div>
          </div>
        </button>;
      })}
    </div>
    {!filtradas.length && <p className="mt-2 rounded-lg bg-[#FFF7ED] p-3 text-sm text-[#9A3412]">No hay habitaciones disponibles con estos filtros.</p>}
  </div>;
}
