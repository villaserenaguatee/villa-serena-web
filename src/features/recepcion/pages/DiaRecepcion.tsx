import { checkInRealizado, checkInWebPendiente } from '@/store/reservationStore';
import { fechaHotel } from "@/lib/hotel";
import { useMemo } from 'react';
import type { Reserva, Huesped, HabitacionHotel, SeccionRecepcion } from '@/lib/pms/types';
import { fechaHoyISO, fechaRelativaISO, formatoFecha } from '@/data/pms';
import { Chip, RECEPTION_RESERVA_META, habitacionesDisponibles, BedIcon, CalendarIcon } from '@/features/recepcion/pages/recUtils';
import { publicRoomForHotelType } from '@/data/publicRooms';
interface Props {
  reservas: Reserva[];
  huespedes: Huesped[];
  habitaciones: HabitacionHotel[];
  onAbrirReserva: (id: string) => void;
  onIr: (s: SeccionRecepcion) => void;
}
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export default function DiaRecepcion({ reservas, huespedes, habitaciones, onAbrirReserva, onIr }: Props) {
  const hoy = fechaHoyISO();
  const d = new Date();
  const titulo = `${DIAS[d.getDay()]}, ${d.getDate()} de ${MESES[d.getMonth()]}`;
  const huespedDe = useMemo(() => {
    const m = new Map<string, Huesped>();
    huespedes.forEach(h => m.set(h.id, h));
    return m;
  }, [huespedes]);
  const llegadas = reservas
    .filter(r => !checkInRealizado(r) && (r.estado === 'confirmada' || r.estado === 'pendiente') && (r.fechaEntrada === hoy || checkInWebPendiente(r) || r.checkInWeb?.estado === 'rechazado'))
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
  const salidas = reservas
    .filter(r => (r.fechaSalida === hoy && r.estado === 'en-curso') || r.checkOutEn?.slice(0, 10) === hoy)
    .sort((a, b) => a.codigo.localeCompare(b.codigo));
  const pendientes = reservas.filter(r => r.estado === 'pendiente');
  const libresHoy = habitacionesDisponibles(hoy, fechaRelativaISO(1), habitaciones, reservas).length;
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="bg-[#18345C] px-4 sm:px-8 py-6">
      <p className="text-[#AEBCC1] text-[10px] tracking-widest uppercase mb-1">
        {titulo}
      </p>
      <h1 className="text-white text-[32px] font-semibold leading-tight">Recepción · vista del día</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <Stat valor={llegadas.length} label="Check-in de hoy" />
        <Stat valor={salidas.length} label="Check-out de hoy" />
        <Stat valor={pendientes.length} label="Reservas pendientes" />
        <Stat valor={libresHoy} label="Habitaciones libres hoy" />
      </div>
    </div>

    <div className="px-4 sm:px-8 py-3 space-y-3">
      <Bloque
        titulo="Entradas programadas (check-in)"
        vacio="No hay llegadas para hoy."
        items={llegadas}
        huespedDe={huespedDe}
        habitaciones={habitaciones}
        onAbrirReserva={onAbrirReserva} />
      <Bloque
        titulo="Salidas programadas (check-out)"
        vacio="No hay salidas para hoy."
        items={salidas}
        huespedDe={huespedDe}
        habitaciones={habitaciones}
        onAbrirReserva={onAbrirReserva} />

      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-[20px] font-semibold text-[#18345C]">Reservas pendientes de confirmar</h2>
          <button onClick={() => onIr('reservas')} className="text-[13px] font-semibold text-[#18345C] hover:underline">
            Ver reservas ›
          </button>
        </div>
        {pendientes.length === 0 ? (<p className="text-[13px] text-[#AEBCC1]">Todo confirmado.</p>) : (<div className="space-y-1.5">
          {pendientes.map(r => {
            const h = huespedDe.get(r.huespedId);
            return (<button
              key={r.id}
              onClick={() => onAbrirReserva(r.id)}
              className="w-full text-left bg-white border border-[#E5E0D8] rounded-xl px-3 py-1.5 flex flex-wrap md:flex-nowrap items-center gap-3 hover:border-[#18345C] transition-colors">
              <img
                src={imagenReserva(r, habitaciones.find(x => x.id === r.habitacionId))}
                alt={`Habitación ${r.tipoHabitacion}`}
                className="h-14 w-20 shrink-0 rounded-lg object-cover" />
              <div className="flex-1 min-w-[160px] break-words">
                <p className="text-[14px] font-semibold text-[#18345C]">
                  {h?.nombre ?? 'Huésped'}
                </p>
                <p className="text-[12px] text-[#AEBCC1]">
                  {r.codigo} · {formatoFecha(r.fechaEntrada)} → {formatoFecha(r.fechaSalida)} · {r.tipoHabitacion}
                </p>
              </div>
              <Chip cls={RECEPTION_RESERVA_META[r.estado].chip}>
                {RECEPTION_RESERVA_META[r.estado].label}
              </Chip>
            </button>);
          })}
        </div>)}
      </section>
    </div>
  </div>);
}
function Stat({ valor, label }: {
  valor: number;
  label: string;
}) {
  return (<div className="flex flex-col items-center justify-center bg-[#102747] rounded-lg py-3 px-2 gap-1">
    <span className="text-2xl sm:text-3xl font-bold leading-none text-[#D8B94E]">
      {valor}
    </span>
    <span className="text-[9px] sm:text-[10px] text-center leading-tight text-[#AEBCC1]">
      {label}
    </span>
  </div>);
}
function Bloque({ titulo, vacio, items, huespedDe, habitaciones, onAbrirReserva, }: {
  titulo: string;
  vacio: string;
  items: Reserva[];
  huespedDe: Map<string, Huesped>;
  habitaciones: HabitacionHotel[];
  onAbrirReserva: (id: string) => void;
}) {
  return (<section>
    <h2 className="text-[20px] font-semibold text-[#18345C] mb-2">
      {titulo}
    </h2>
    {items.length === 0 ? (<p className="text-[13px] text-[#AEBCC1]">
      {vacio}
    </p>) : (<div className="space-y-1.5">
      {items.map(r => {
        const h = huespedDe.get(r.huespedId);
        const hab = habitaciones.find(x => x.id === r.habitacionId);
        return (<button
          key={r.id}
          onClick={() => onAbrirReserva(r.id)}
          className="w-full text-left bg-white border border-[#E5E0D8] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-[#18345C] transition-colors">
          <div className="relative h-16 w-[72px] shrink-0 overflow-hidden rounded-lg">
            <img src={imagenReserva(r, hab)} alt={hab ? `Habitación ${hab.numero}` : `Categoría ${r.tipoHabitacion}`} className="h-full w-full object-cover" />
            <span className="absolute bottom-1 left-1 rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-[#18345C]">
              {hab?.numero ?? '—'}
            </span>
          </div>
          <div className="flex-1 min-w-[160px] break-words">
            <p className="text-[14px] font-semibold text-[#18345C]">
              {h?.nombre ?? 'Huésped'}
            </p>
            <p className="text-[12px] text-[#AEBCC1]">
              {r.codigo} · {r.personas} pers. · {r.tipoHabitacion}
            </p>
          </div>
          {checkInWebPendiente(r)
            ? <Chip cls="bg-[#FFF3D5] text-[#8A6200] border-[#F0C95A]">CHECK-IN WEB POR VALIDAR</Chip>
            : !checkInRealizado(r) && r.checkInWeb?.estado === 'rechazado'
              ? <Chip cls="bg-[#FEE2E2] text-[#991B1B] border-[#FCA5A5]">CORRECCIÓN SOLICITADA</Chip>
              : r.checkOutEn?.slice(0, 10) === fechaHotel()
                ? <Chip cls="bg-[#F3F4F6] text-[#374151] border-[#D1D5DB]">CHECK-OUT WEB REALIZADO</Chip>
                : r.checkInEn?.slice(0, 10) === fechaHotel()
                  ? <Chip cls="bg-[#DCFCE7] text-[#166534] border-[#86EFAC]">CHECK-IN {r.origenCheckIn === 'portal' ? 'WEB ' : ''}REALIZADO</Chip>
                  : <Chip cls={RECEPTION_RESERVA_META[r.estado].chip}>
                    {RECEPTION_RESERVA_META[r.estado].label}
                  </Chip>}
          <span className="ml-auto shrink-0 text-xs font-semibold text-[#18345C]">Ver detalle ›</span>
        </button>);
      })}
    </div>)}
  </section>);
}
function imagenReserva(r: Reserva, hab?: HabitacionHotel) { return publicRoomForHotelType(hab?.tipo ?? r.tipoHabitacion).image; }
