'use client';
import { Fragment } from 'react';
import type { Reserva, Huesped, HabitacionHotel } from '@/lib/pms/types';
import { CALENDAR_STATUS as RESERVA_META } from '../calendarStatus';
import { BedDouble } from 'lucide-react';

type Props = { days: string[]; groupByFloor: boolean; reservas: Reserva[]; huespedes: Huesped[]; habitaciones: (Pick<HabitacionHotel, 'id' | 'numero' | 'piso'> & { tipo: string })[]; onSelect: (r: Reserva) => void };
const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export default function ReceptionTimeline({ days, groupByFloor, reservas, huespedes, habitaciones, onSelect }: Props) {
  const floors = [...new Set(habitaciones.map(h => h.piso))].sort((a,b) => a-b);
  return <table aria-label="Reservas por habitación y día" className="w-max border-separate border-spacing-0 text-xs">
    <thead><tr><th scope="col" className="sticky top-0 left-0 z-30 min-w-24 border border-[#E5E0D8] bg-[#F8F6F0] p-2 text-left">Habitación</th>
      {days.map(day => <th key={day} scope="col" className="sticky top-0 z-20 min-w-24 border-b border-r border-t border-[#E5E0D8] bg-[#F8F6F0] p-2 font-semibold">
        {weekdays[new Date(`${day}T12:00:00Z`).getUTCDay()]} {Number(day.slice(-2))}
      </th>)}
    </tr></thead>
    <tbody>{floors.map(floor => <Fragment key={floor}>
      {groupByFloor && <tr><th scope="rowgroup" colSpan={days.length + 1} className="border-b border-l border-r border-[#E5E0D8] bg-[#EFF3F7] py-2 text-left"><span className="sticky left-0 px-2">Piso {floor}</span></th></tr>}
      {habitaciones.filter(h => h.piso === floor).sort((a,b) => a.numero.localeCompare(b.numero)).map(room => <tr key={room.id}>
        <th scope="row" className="sticky left-0 z-10 border-b border-l border-r border-[#E5E0D8] bg-white p-2 text-left font-semibold">Hab. {room.numero}</th>
        {days.map(day => <td key={day} aria-label={`Hab. ${room.numero}, ${day}`} className="h-10 w-24 max-w-24 border-b border-r border-[#E5E0D8] p-1 align-top">
          {reservas.filter(r => r.habitacionId === room.id && r.estado !== 'cancelada' && r.fechaEntrada <= day && r.fechaSalida > day).map(r => {
            const name = huespedes.find(h => h.id === r.huespedId)?.nombre ?? 'Huésped';
            return <button key={r.id} data-reservation-code={r.codigo} aria-label={`${r.codigo}, ${RESERVA_META[r.estado].label}`} title={`${name} · ${r.codigo}`}
              onClick={() => onSelect(r)} className={`mb-1 block w-full rounded border px-1 py-1 text-left text-[11px] leading-tight break-words ${RESERVA_META[r.estado].chip}`}>
              <BedDouble size={13} aria-hidden="true" className="mr-1 inline-block align-middle" /> Hab. {room.numero} · {name}
            </button>;
          })}
        </td>)}
      </tr>)}
    </Fragment>)}</tbody>
  </table>;
}
