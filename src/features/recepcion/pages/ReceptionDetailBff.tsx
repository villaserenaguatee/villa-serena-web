import { useEffect, useState } from 'react';
import { assignRoom, cancelReservation, getAssignableRooms, getCancellationPreview, getReservation, getRooms } from '@/lib/api/reception';
import { canAssign, canCancel, channelLabels, isExternal, reservationLabels } from '@/lib/receptionPresentation';
import { fechaHotel } from '@/lib/hotel';
import { formatoFecha } from '@/data/pms';
import type { CancellationPreview, ReservationDetail, RoomReference, RoomState } from '@/lib/bff/contracts/reception';
import { publicRoomForHotelType } from '@/data/publicRooms';
import type { TipoHabitacion } from '@/lib/pms/types';
const control = 'rounded-md border border-[#E5E0D8] bg-white px-3 py-2 text-sm text-[#18345C]';
const primary = 'rounded-md bg-[#18345C] px-4 py-2 text-white disabled:opacity-50';
export type ExistingAction = 'check-in' | 'cuenta' | 'check-out';
export default function ReceptionDetailBff({ codigo, onCerrar, onExistingAction }: { codigo: string; onCerrar: () => void; onExistingAction: (detail: ReservationDetail, action: ExistingAction) => void }) {
  const [detail, setDetail] = useState<ReservationDetail | null>(null), [rooms, setRooms] = useState<RoomState[]>([]);
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [notice, setNotice] = useState(''), [reload, setReload] = useState(0);
  const [preview, setPreview] = useState<CancellationPreview | null>(null), [reason, setReason] = useState('');
  const [options, setOptions] = useState<RoomReference[] | null>(null), [selected, setSelected] = useState('');
  useEffect(() => {
    const controller = new AbortController(); setDetail(null); setError(''); setPreview(null); setOptions(null);
    Promise.all([getReservation(codigo, controller.signal), getRooms(undefined, controller.signal)]).then(([value, list]) => { if (!controller.signal.aborted) { setDetail(value); setRooms(list); } }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [codigo, reload]);
  async function run(action: () => Promise<void>) {
    if (busy) return; setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo completar la operación.'); }
    finally { setBusy(false); }
  }
  const currentRoom = detail?.habitacion ? rooms.find(r => r.id === detail.habitacion!.id) : null;
  const today = fechaHotel();
  const checkIn = detail?.estado === 'CONFIRMADA' && detail.entrada <= today && today < detail.salida && currentRoom?.ocupacion === 'LIBRE' && currentRoom?.condicion === 'LIMPIA';
  const arrivalReason = detail?.estado === 'CONFIRMADA' && !checkIn ? !detail.habitacion ? 'Asigna una habitación antes del check-in.' : detail.entrada > today || today >= detail.salida ? 'El check-in se permite entre la entrada y el día anterior a la salida.' : 'El check-in requiere una habitación libre y limpia.' : '';
  return <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4">
    <div className="absolute inset-0 bg-black/40" onClick={onCerrar} />
    <section role="dialog" aria-modal="true" aria-label="Detalle de reserva" className="relative flex max-h-[90vh] w-full flex-col rounded-t-2xl bg-white text-[#18345C] shadow-2xl sm:max-w-5xl sm:rounded-2xl">
      <header className="flex items-center justify-between gap-3 border-b border-[#E5E0D8] px-5 py-3"><div><h2 className="text-2xl font-semibold">{codigo}</h2><p className="text-sm">Detalle de reserva · datos de prueba del BFF</p></div><button className={control} aria-label="Cerrar detalle de reserva" onClick={onCerrar}>Cerrar</button></header>
      <div className="space-y-5 overflow-y-auto p-4 sm:p-5">
        {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}{notice && <p role="status" className="rounded-lg bg-green-50 p-3">{notice}</p>}
        <button className={control} disabled={busy} onClick={() => setReload(n => n + 1)}>Consultar estado otra vez</button>
        {!detail && !error && <p>Consultando detalle…</p>}
        {detail && <>
          <div className="grid gap-4 rounded-xl bg-[#F8F6F0] p-4 sm:grid-cols-2"><img className="h-40 w-full rounded-xl object-cover" src={publicRoomForHotelType(detail.tipoHabitacion.nombre as TipoHabitacion).image} alt={detail.tipoHabitacion.nombre} /><div className="space-y-1 break-words"><h3 className="text-xl font-semibold">{detail.huesped.nombreCompleto}</h3><p>{reservationLabels[detail.estado]}</p><p>{formatoFecha(detail.entrada)} → {formatoFecha(detail.salida)} · {detail.noches} noches · {detail.numeroHuespedes} huéspedes</p><p>{detail.tipoHabitacion.nombre} · {detail.habitacion ? `Habitación ${detail.habitacion.numero}` : 'Sin asignar'}</p><p>Canal: {channelLabels[detail.canal]}</p>{detail.identificadorExterno && <p className="break-all">Identificador externo: {detail.identificadorExterno}</p>}<p>Total: Q {detail.total.toFixed(2)} · Saldo pendiente: Q {detail.saldoPendiente.toFixed(2)}</p></div></div>
          <section className="rounded-xl border border-[#E5E0D8] p-4"><h3 className="text-lg font-semibold">Datos del huésped</h3><p className="break-all">{detail.huesped.correo} · {detail.huesped.telefono}</p><p>{detail.huesped.nacionalidad} · {detail.huesped.tipoDocumento} {detail.huesped.numeroDocumento}</p><h4 className="mt-3 font-semibold">Huéspedes adicionales</h4>{detail.huespedesAdicionales.length ? detail.huespedesAdicionales.map(g => <p key={g.id}>{g.nombreCompleto} · {g.tipoDocumento} {g.numeroDocumento} · {g.nacionalidad}</p>) : <p>No hay huéspedes adicionales registrados.</p>}</section>
          {isExternal(detail) && <p className="rounded-lg bg-[#FFF9E8] p-3">Las reservas de canal no se cancelan desde el sistema.</p>}
          {detail.estado === 'EN_ESTADIA' && <p>No se puede cambiar la habitación durante la estadía.</p>}
          {arrivalReason && <p>{arrivalReason}</p>}
          <div className="flex flex-wrap gap-2">
            {canAssign(detail) && <button className={primary} disabled={busy} onClick={() => void run(async () => { setOptions(await getAssignableRooms(detail)); setSelected(''); setPreview(null); })}>{detail.habitacion ? 'Cambiar habitación' : 'Asignar habitación'}</button>}
            {canCancel(detail) && <button className={control} disabled={busy} onClick={() => void run(async () => { setPreview(await getCancellationPreview(detail.codigo)); setOptions(null); })}>Cancelar reserva</button>}
            {checkIn && <button className={primary} disabled={busy} onClick={() => onExistingAction(detail, 'check-in')}>Ir a check-in</button>}
            {['CONFIRMADA', 'EN_ESTADIA', 'FINALIZADA'].includes(detail.estado) && <button className={control} disabled={busy} onClick={() => onExistingAction(detail, 'cuenta')}>Ver cuenta</button>}
            {detail.estado === 'EN_ESTADIA' && <button className={primary} disabled={busy} onClick={() => onExistingAction(detail, 'check-out')}>Ir a check-out</button>}
          </div>
          {detail.estado === 'FINALIZADA' && <p className="text-sm">La consulta e impresión de una factura emitida está pendiente de integración.</p>}
          {options && <form className="space-y-3 rounded-xl border border-[#E5E0D8] p-4" onSubmit={e => { e.preventDefault(); void run(async () => { setDetail(await assignRoom(codigo, Number(selected))); setOptions(null); setNotice('Habitación asignada en la simulación.'); }); }}><h3 className="font-semibold">Habitaciones permitidas por el BFF</h3><p className="text-sm">Mismo tipo, sin traslapes y sin estar fuera de servicio. No se exige limpieza para asignar.</p>{options.length ? <><label className="block">Habitación<select aria-label="Habitación" required className={`${control} ml-2`} value={selected} onChange={e => setSelected(e.target.value)}><option value="">Seleccionar</option>{options.map(r => <option key={r.id} value={r.id}>{r.numero} · piso {r.piso}</option>)}</select></label><button className={primary} disabled={busy || !selected}>Guardar asignación</button></> : <p>No hay habitaciones permitidas para esta reserva.</p>}</form>}
          {preview && <form className="space-y-3 rounded-xl border border-[#E5E0D8] p-4" onSubmit={e => { e.preventDefault(); if (!reason.trim()) { setError('Escribe el motivo de cancelación.'); return; } void run(async () => { setDetail(await cancelReservation(codigo, reason)); setPreview(null); setNotice('Reserva cancelada en la simulación. No se devolvió dinero real.'); }); }}><h3 className="font-semibold">Antes de confirmar la cancelación</h3><p>{preview.resultado === 'REEMBOLSO_TOTAL' ? `Corresponde un reembolso total de prueba de Q ${preview.montoReembolso.toFixed(2)} (48 horas o más antes de las 15:00 de llegada).` : preview.resultado === 'SIN_REEMBOLSO' ? 'No corresponde reembolso: faltan menos de 48 horas para las 15:00 de llegada.' : 'Esta reserva no tiene pagos; no hay dinero que reembolsar.'}</p><p>Resultado calculado por el BFF. Esta prueba no devuelve dinero realmente.</p><label className="block">Motivo de cancelación<textarea required maxLength={500} className={`${control} mt-1 w-full`} value={reason} onChange={e => setReason(e.target.value)} /></label><button className={primary} disabled={busy}>Confirmar cancelación de prueba</button><button type="button" className={`${control} ml-2`} disabled={busy} onClick={() => setPreview(null)}>Volver</button></form>}
          <section className="rounded-xl border border-[#E5E0D8] p-4"><h3 className="mb-3 text-lg font-semibold">Historial de estados</h3><ol className="space-y-3">{detail.historial.map((h, i) => <li key={i} className="border-l-2 border-[#D6B96A] pl-3"><p>{h.estadoAnterior ? reservationLabels[h.estadoAnterior] : 'Creación'} → {reservationLabels[h.estadoNuevo]}</p><p className="text-sm">{new Intl.DateTimeFormat('es-GT', { timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(h.fechaHora))} · {h.responsable}</p>{h.motivo && <p className="break-words">{h.motivo}</p>}</li>)}</ol></section>
        </>}
      </div>
    </section>
  </div>;
}
