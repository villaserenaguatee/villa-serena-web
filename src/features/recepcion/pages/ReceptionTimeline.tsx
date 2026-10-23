'use client';
import { Fragment, useState } from 'react';
import type { Reserva, Huesped } from '@/lib/pms/types';
import { CALENDAR_STATUS as RESERVA_META } from '../calendarStatus';
import { BedDouble } from 'lucide-react';
import {calendarRangeError,nextCalendarDay,type CalendarRoom,type CalendarPreset} from '../calendarSelection';
import {fechaHoyISO} from '@/data/pms';

type Props = { days: string[]; groupByFloor: boolean; reservas: Reserva[]; huespedes: Huesped[]; habitaciones: CalendarRoom[]; onSelect: (r: Reserva) => void; onCreate?:(preset:CalendarPreset)=>void; busy?:boolean };
const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export default function ReceptionTimeline({ days, groupByFloor, reservas, huespedes, habitaciones, onSelect, onCreate, busy=false }: Props) {
  const [range,setRange]=useState<{roomId:string;entrada:string;last:string}>(),[error,setError]=useState('');
  function choose(room:CalendarRoom,day:string){
    const entrada=range?.roomId===room.id?range.entrada:day;
    const message=calendarRangeError(room,entrada,nextCalendarDay(day),reservas,fechaHoyISO());
    if(message){setError(message);return;}
    setError('');setRange({roomId:room.id,entrada,last:day});
  }
  function create(){
    const room=habitaciones.find(r=>r.id===range?.roomId);if(!room||!range||!onCreate)return;
    const salida=nextCalendarDay(range.last),message=calendarRangeError(room,range.entrada,salida,reservas,fechaHoyISO());
    if(message){setError(message);return;}
    onCreate({entrada:range.entrada,salida,habitacionId:room.id,tipo:room.tipo,tipoHabitacionId:room.tipoId});
  }
  const floors = [...new Set(habitaciones.map(h => h.piso))].sort((a,b) => a-b);
  return <div tabIndex={0} aria-label="Desplazamiento del calendario por habitaciones" className="vs-table-scroll h-full min-h-0 max-h-[640px] overflow-auto overscroll-contain scroll-pt-10 scroll-pl-24"><table data-vs-table="recepcion" aria-label="Reservas por habitación y día" className="w-max border-separate border-spacing-0 text-xs">
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
          {onCreate&&!reservas.some(r=>r.habitacionId===room.id&&['pendiente','confirmada','en-curso'].includes(r.estado)&&r.fechaEntrada<=day&&r.fechaSalida>day)&&<button type="button"
            disabled={busy||room.seleccionable===false||day<fechaHoyISO()}
            aria-label={`Seleccionar noche ${day}, habitación ${room.numero}`}
            aria-pressed={Boolean(range?.roomId===room.id&&day>=range.entrada&&day<=range.last)}
            onClick={()=>choose(room,day)} className={`min-h-10 w-full rounded border px-1 text-xs disabled:opacity-35 ${range?.roomId===room.id&&day>=range.entrada&&day<=range.last?'border-[#18345C] bg-[#DDE9F5] text-[#18345C]':'border-transparent text-[#536579] hover:bg-[#EFF3F7]'} focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#18345C]`}>Libre</button>}
        </td>)}
      </tr>)}
    </Fragment>)}</tbody>
  </table>{onCreate&&<div role="group" aria-label="Selección de noches" className="sticky left-0 max-w-[calc(100vw-3rem)] space-y-2 border-t bg-white p-3 text-sm">
    <p role="status">{range?`Llegada: ${range.entrada} · Salida: ${nextCalendarDay(range.last)}. Selecciona otra noche para ampliar el rango.`:'Selecciona la primera y la última noche libre de una habitación.'}</p>
    {error&&<p role="alert" className="text-red-800">{error}</p>}
    <div className="flex flex-wrap gap-2"><button type="button" disabled={!range||busy} onClick={create} className="rounded bg-[#18345C] px-3 py-2 text-white disabled:opacity-40">Reservar selección</button>
    {range&&<button type="button" disabled={busy} onClick={()=>{setRange(undefined);setError('');}} className="rounded border px-3 py-2">Limpiar selección</button>}</div>
  </div>}</div>;
}
