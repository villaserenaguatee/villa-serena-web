import type { Pedido, TurnoRS } from '@/lib/pms/types';
import { formatoHoraISO, formatoDuracion, minutosEntre, TURNOS_HORARIO, } from '@/data/pms';
import { publicRoomForHotelType } from '@/data/publicRooms';
import { leerHabitaciones } from '@/store/roomStore';
import { ChipEstado, ESTADO_META, ClockIcon, PhoneIcon, precio, totalLineas, } from '@/features/roomservice/pages/rsUtils';
interface Props {
  pedidos: Pedido[];
  turno: TurnoRS;
  onAbrirDetalle: (id: string) => void;
  onNuevoTelefonico?: () => void;
  conectado?: boolean;
}
const ESTADOS_ACTIVOS: Pedido['estado'][] = [
  'nuevo',
  'en-preparacion',
  'en-camino',
];
export default function PedidosPendientes({ pedidos, turno, onAbrirDetalle, onNuevoTelefonico, conectado = false }: Props) {
  const pendientes = pedidos
    .filter((p) => (conectado || p.turno === turno) &&
      ESTADOS_ACTIVOS.includes(p.estado))
    .sort((a, b) => new Date(a.creadoEn).getTime() -
      new Date(b.creadoEn).getTime());
  const nuevos = pendientes.filter((p) => p.estado === 'nuevo').length;
  const totalPorAtender = pedidos.filter((p) => ESTADOS_ACTIVOS.includes(p.estado)).length;
  return (<div className="w-full bg-[#F8F6F0] pb-6" style={{
    fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif',
  }}>

    <div className="bg-white border-b border-[#E5E0D8] px-4 sm:px-6 py-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">
            Pedidos pendientes
          </h1>

          <p className="text-[15px] text-[#6B7280] mt-1">
            {conectado ? 'Pedidos activos por antigüedad' : `Turno de ${turno} · ${TURNOS_HORARIO[turno]}`}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-lg bg-[#F8F6F0] px-3 py-1.5 text-xs font-semibold text-[#52677F]">
              {pendientes.length} por atender
            </span>

            <span className="rounded-lg bg-[#EAF5FF] px-3 py-1.5 text-xs font-semibold text-[#2563A8]">
              {nuevos} nuevos
            </span>
          </div>
        </div>

        {onNuevoTelefonico && <button
          type="button"
          onClick={onNuevoTelefonico}
          className="flex items-center gap-2 px-4 py-2.5 text-[15px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors">
          <PhoneIcon />
          Registrar pedido telefónico
        </button>}
      </div>
    </div>

    <div className="w-full">

      <div className="px-4 sm:px-6 pt-4 grid grid-cols-1 md:grid-cols-2 gap-3">

        <div className="
              min-h-[115px]
              rounded-xl
              border
              border-[#E5E0D8]
              bg-white
              px-5
              py-4
              flex
              flex-col
              items-center
              justify-center
              text-center
            ">
          <p className="text-[11px] uppercase tracking-widest text-[#71839B]">
            Pedidos de restaurante
          </p>

          <p className="text-[24px] font-semibold text-[#18345C] mt-1 leading-tight">
            {pendientes.length}
          </p>

          <p className="text-[13px] text-[#6B7280] mt-1">
            Alimentos y bebidas solicitados.
          </p>
        </div>

        <div className="
              min-h-[115px]
              rounded-xl
              border
              border-[#E5E0D8]
              bg-white
              px-5
              py-4
              flex
              flex-col
              items-center
              justify-center
              text-center
            ">
          <p className="text-[11px] uppercase tracking-widest text-[#71839B]">
            Pedidos por atender
          </p>

          <p className="text-[24px] font-semibold text-[#18345C] mt-1 leading-tight">
            {totalPorAtender}
          </p>

          <p className="text-[13px] text-[#6B7280] mt-1">
            Pedidos reales que todavía requieren atención.
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-6 pt-4 flex flex-wrap gap-4">
        {(['nuevo', 'en-preparacion', 'en-camino'] as const).map((estado) => (<span key={estado} className="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
          <span className="w-2.5 h-2.5 rounded-full" style={{
            backgroundColor: ESTADO_META[estado].dot,
          }} />

          {ESTADO_META[estado].label}
        </span>))}
      </div>

      <div className="px-4 sm:px-6 pt-4 pb-2">
        {pendientes.length === 0 ? (<div className="bg-white border border-[#E5E0D8] rounded-xl px-6 py-5 text-center">
          <p className="text-[14px] text-[#AEBCC1]">
            No hay pedidos pendientes en tu turno.
          </p>
        </div>) : (<div className="space-y-3">
          {pendientes.map((p,
            idx) => {
            const meta = ESTADO_META[p.estado];
            const minutos = minutosEntre(p.creadoEn);
            const total = totalLineas(p.lineas);
            const primero = idx === 0;
            const habitacion = leerHabitaciones().find((h) => h.numero === p.habitacionNumero);
            const imagenHabitacion = publicRoomForHotelType(habitacion?.tipo ?? 'Standard').image;
            return (<button
              key={p.id}
              type="button"
              onClick={() => onAbrirDetalle(p.id)}
              className="
                      relative
                      flex
                      w-full
                      items-stretch
                      gap-4
                      overflow-hidden
                      rounded-xl
                      border
                      border-[#E5E0D8]
                      bg-white
                      py-4
                      pl-0
                      pr-4
                      text-left
                      transition-colors
                      hover:border-[#18345C]
                    ">

              <span className="w-1.5 shrink-0" style={{
                backgroundColor: meta.barra,
              }} />

              <div className="w-24 h-20 rounded-lg overflow-hidden shrink-0 self-center bg-[#F8F6F0]">
                <img src={imagenHabitacion} alt={`Habitación ${p.habitacionNumero}`} className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0 self-center">
                <div className="flex items-center gap-2 flex-wrap">
                  <div>
                    <p className="text-[11px] uppercase tracking-widest text-[#71839B]">
                      Piso {p.piso}
                    </p>

                    <p className="text-[25px] font-semibold text-[#18345C] leading-none">
                      Habitación {p.habitacionNumero}
                    </p>
                  </div>

                  <span className="text-[13px] text-[#AEBCC1]">
                    #{p.numero}
                  </span>

                  <ChipEstado estado={p.estado} />

                  {primero && (<span className="text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide bg-[#FEF2F2] text-[#991B1B] border border-[#FCA5A5]">
                    Atender primero
                  </span>)}

                  {p.origen === 'telefono' && (<span className="text-[#AEBCC1]" title="Pedido telefónico">
                    <PhoneIcon size={13} />
                  </span>)}
                </div>

                <p className="text-[14px] text-[#6B7280] mt-1.5 truncate">
                  {p.huesped} · {p.lineas
                    .map((linea) => `${linea.cantidad}× ${linea.nombre}`)
                    .join(' · ')}
                </p>

                <div className="flex items-center gap-3 flex-wrap mt-1.5 text-[13px] text-[#AEBCC1]">
                  <span className="flex items-center gap-1">
                    <ClockIcon size={12} />
                    Pedido: {formatoHoraISO(p.creadoEn)}
                  </span>

                  <span>
                    Hace {formatoDuracion(minutos)}
                  </span>
                </div>
              </div>

              <div className="self-center text-right shrink-0">
                <p className="text-[16px] font-bold text-[#18345C]">
                  {precio(total)}
                </p>

                <p className="text-[13px] text-[#18345C] font-medium mt-1">
                  Ver detalle ›
                </p>
              </div>
            </button>);
          })}
        </div>)}
      </div>
    </div>
  </div>);
}
