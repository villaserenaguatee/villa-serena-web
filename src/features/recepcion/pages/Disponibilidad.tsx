import { useMemo, useState } from 'react';
import { Minus, Plus, Users } from 'lucide-react';
import type { HabitacionHotel, Reserva, TipoHabitacion } from '@/lib/pms/types';
import { fechaHoyISO, fechaRelativaISO, nochesEntre } from '@/data/pms';
import { Campo, INPUT_CLS, habitacionesDisponibles } from '@/features/recepcion/pages/recUtils';
import { publicRoomForHotelType, money } from '@/data/publicRooms';
interface Props {
  habitaciones: HabitacionHotel[];
  reservas: Reserva[];
  onReservar: (preset: {
    entrada: string;
    salida: string;
    tipo: TipoHabitacion;
    habitacionId: string;
    adultos?: number;
    ninos?: number;
  }) => void;
}
const TIPOS: (TipoHabitacion | 'Todos')[] = ['Todos', 'Standard', 'Superior', 'Deluxe', 'Suite Deluxe', 'Suite'];
export default function Disponibilidad({ habitaciones, reservas, onReservar }: Props) {
  const [entrada, setEntrada] = useState(fechaHoyISO());
  const [salida, setSalida] = useState(fechaRelativaISO(2));
  const [adultos, setAdultos] = useState('1');
  const [ninos, setNinos] = useState('0');
  const [huespedesAbierto, setHuespedesAbierto] = useState(false);
  const [tipo, setTipo] = useState<TipoHabitacion | 'Todos'>('Todos');
  const nPersonas = Math.max(1, (Number(adultos) || 0) + (Number(ninos) || 0));
  const rangoValido = entrada < salida;
  const noches = rangoValido ? nochesEntre(entrada, salida) : 0;
  const resultados = useMemo(() => rangoValido
    ? habitacionesDisponibles(entrada, salida, habitaciones, reservas, {
      personas: nPersonas,
      tipo: tipo === 'Todos' ? undefined : tipo,
    }).sort((a, b) => a.numero.localeCompare(b.numero))
    : [],
    [rangoValido, entrada, salida, habitaciones, reservas, nPersonas, tipo]);
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <div className="px-4 sm:px-6 py-5 bg-white border-b border-[#E5E0D8]">
      <h1 className="text-[32px] font-semibold text-[#18345C] leading-tight">Consultar disponibilidad</h1>
      <p className="text-[15px] text-[#AEBCC1] mt-1">Habitaciones libres para un rango de fechas</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.2fr_1fr] gap-3 mt-4 items-end">
        <Campo label="Entrada">
          <input type="date" value={entrada} onChange={e => setEntrada(e.target.value)} className={INPUT_CLS} />
        </Campo>
        <Campo label="Salida">
          <input type="date" value={salida} min={entrada} onChange={e => setSalida(e.target.value)} className={INPUT_CLS} />
        </Campo>
        <Campo label="Huéspedes">
          <div className="relative">
            <button type="button" onClick={() => setHuespedesAbierto(v => !v)} className={`${INPUT_CLS} flex items-center gap-2 text-left`}>
              <Users size={18} />
              <span>{nPersonas} huésped{nPersonas === 1 ? '' : 'es'}</span>
            </button>
            {huespedesAbierto && <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-[310px] bg-white rounded-xl shadow-2xl border border-[#EEE7DA] p-4 text-[#102747]">
              {[['Adultos', adultos, setAdultos, 1], ['Niños', ninos, setNinos, 0]].map(([etiqueta, valor, setter, min]: any) => <div key={etiqueta} className="flex items-center justify-between py-3">
                <span className="text-[17px]">
                  {etiqueta}
                </span>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setter(String(Math.max(min, Number(valor) - 1)))}
                    className="w-10 h-10 rounded-full border border-[#D8B94E] grid place-items-center">
                    <Minus size={18} />
                  </button>
                  <b>
                    {valor}
                  </b>
                  <button
                    type="button"
                    disabled={nPersonas >= 5}
                    onClick={() => nPersonas < 5 && setter(String(Number(valor) + 1))}
                    className="w-10 h-10 rounded-full border border-[#D8B94E] grid place-items-center disabled:opacity-30">
                    <Plus size={18} />
                  </button>
                </div>
              </div>)}
              <p className="text-xs text-[#7B8796] mb-3">Máximo 5 huéspedes en total.</p>
              <button type="button" onClick={() => setHuespedesAbierto(false)} className="w-full bg-[#D8B94E] text-[#102747] py-3 font-semibold">Confirmar</button>
            </div>}
          </div>
        </Campo>
        <Campo label="Categoría">
          <select value={tipo} onChange={e => setTipo(e.target.value as TipoHabitacion | 'Todos')} className={INPUT_CLS}>
            {TIPOS.map(t => (<option key={t} value={t}>
              {t === 'Todos' ? 'Todas' : t}
            </option>))}
          </select>
        </Campo>
      </div>
    </div>

    <div className="px-4 sm:px-6 py-5">
      {!rangoValido ? (<p className="text-[14px] text-[#991B1B]">La fecha de salida debe ser posterior a la de entrada.</p>) : (<>
        <p className="text-[14px] text-[#6B7280] mb-4">
          {resultados.length} habitación(es) disponible(s) · {noches} noche{noches !== 1 ? 's' : ''}
        </p>
        {resultados.length === 0 ? (<div className="bg-white border border-[#E5E0D8] rounded-xl p-6 text-center">
          <p className="text-[15px] text-[#AEBCC1]">No hay habitaciones libres con esos criterios.</p>
        </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {resultados.map(h => {
            const visual = visualHabitacion(h);
            return (<div key={h.id} className="bg-white border border-[#E5E0D8] rounded-xl overflow-hidden">
              <img src={visual.image} alt={`Habitación ${h.numero}`} className="w-full h-44 object-cover" />
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[11px] tracking-[.14em] text-[#B38719]">HABITACIÓN {h.numero} · PISO {h.piso}</p>
                    <p className="text-[20px] font-semibold text-[#18345C]">
                      {visual.name}
                    </p>
                    <p className="text-[12px] text-[#6B7280]">{h.tipo} · {visual.beds} · hasta {h.capacidad} huéspedes · {visual.size} m²</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-[#52677F]">
                  {visual.description}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {visual.features.slice(0, 4).map(f => <span key={f} className="rounded-full border border-[#E5E0D8] bg-[#F8F6F0] px-2.5 py-1 text-[11px] text-[#52677F]">
                    {f}
                  </span>)}
                </div>
                <div className="flex items-end justify-between mt-3 pt-3 border-t border-[#F0EBE3]">
                  <div>
                    <p className="text-[18px] font-bold text-[#18345C]">
                      {money(visual.price)}
                      <span className="text-[12px] font-normal text-[#AEBCC1]">/ noche</span>
                    </p>
                    <p className="text-[12px] text-[#AEBCC1]">{money(visual.price * noches)} por {noches} noche{noches !== 1 ? 's' : ''}</p>
                  </div>
                  <button
                    onClick={() => onReservar({ entrada, salida, tipo: h.tipo, habitacionId: h.id, adultos: Number(adultos), ninos: Number(ninos) })}
                    className="px-4 py-2 text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors shrink-0">
                    Reservar
                  </button>
                </div>
              </div>
            </div>);
          })}
        </div>)}
      </>)}
    </div>
  </div>);
}
function visualHabitacion(h: HabitacionHotel) {
  return publicRoomForHotelType(h.tipo);
}
