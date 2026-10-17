'use client';
import type {Reserva,HabitacionHotel} from '@/lib/pms/types';
import {UiText,useUiText} from '@/i18n/UiText';
import {usePublicLanguage} from '@/components/common/PublicLanguageToggle';
export default function ConnectedManageStay({reserva,habitacion}:{reserva:Reserva;habitacion?:HabitacionHotel}){const {en}=usePublicLanguage();const ui=useUiText();return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0] p-4 sm:p-6">
            <div className="mx-auto max-w-6xl">
              <p className="text-xs font-semibold uppercase tracking-[.28em] text-[#B38B2C]">{en?"Your stay, your way":"Tu estancia, a tu ritmo"}</p>
              <h1 className="mt-2 text-3xl font-semibold text-[#18345C] sm:text-4xl">
                <UiText text="Gestionar estancia" />
              </h1>
              <p className="mt-2 text-base text-[#6B7280]">
                <UiText text="Elige qué deseas hacer con tu alojamiento." />
              </p>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <article className="flex flex-col rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-[#D3AE55] text-[#A77E20]">
                    <GestionIcon tipo="calendario" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-[#18345C]">
                    <UiText text="Extender mi estancia" />
                  </h2>
                  <p className="mt-2 text-base text-[#6B7280]">
                    {en ? 'Keep your current room and request extra nights.' : 'Conserva tu habitación actual y solicita noches adicionales.'}
                  </p>
                  <div className="mt-4 flex items-center gap-3 rounded-lg bg-[#F8F6F0] p-3">
                    <img
                      src="https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=85"
                      alt={`Habitación ${(habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar'))}`}
                      className="h-16 w-24 rounded-md object-cover" />
                    <p className="text-sm text-[#52677F]"><b className="block text-[#18345C]">Habitación {(habitacion?.numero ?? (en ? 'Unassigned' : 'Sin asignar'))} · {reserva.tipoHabitacion}</b>Salida {reserva.fechaSalida}</p>
                  </div>
                  <button
                    disabled title={en?"Contact Reception to request an extension":"Contacta a Recepción para solicitar una extensión"}
                    className="mt-5 inline-flex w-fit items-center gap-3 self-end rounded-lg bg-[#B08A31] px-4 py-2.5 text-sm font-semibold text-white">Solicitar extensión <span>→</span></button>
                </article>
                <article className="flex flex-col rounded-xl border border-[#E5E0D8] bg-white p-5 shadow-sm sm:p-6">
                  <span className="grid h-12 w-12 place-items-center rounded-full border border-[#D3AE55] text-[#A77E20]">
                    <GestionIcon tipo="cama" />
                  </span>
                  <h2 className="mt-4 text-xl font-semibold text-[#18345C]">
                    <UiText text="Reservar otra habitación" />
                  </h2>
                  <p className="mt-2 text-base text-[#6B7280]">
                    <UiText text="Haz una reserva para ti o para otra persona." />
                  </p>
                  <div className="my-4 h-px bg-[#E5E0D8]" />
                  <p className="text-[#52677F]">{en?"Check dates, availability and rates.":"Consulta fechas, disponibilidad y tarifas."}</p>
                  <button
                    onClick={()=>window.location.assign("/catalogo")}
                    className="mt-5 inline-flex w-fit items-center gap-3 self-end rounded-lg bg-[#B08A31] px-4 py-2.5 text-sm font-semibold text-white">{en?"New reservation":"Nueva reserva"} <span>→</span></button>
                </article>
              </div>
              <section className="mt-4 flex items-center gap-4 rounded-xl border border-[#E5E0D8] bg-white p-4 shadow-sm">
                <span className="text-[#A77E20]">
                  <GestionIcon tipo="solicitud" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold text-[#18345C]">{en?"My requests":"Mis solicitudes"}</h2>
                  <p className="mt-1 text-[#6B7280]">{en?"Contact Reception to arrange an extension.":"Contacta a Recepción para coordinar una extensión."}</p>
                </div>
              </section>
            </div>
          </div>);}
function GestionIcon({ tipo }: {
  tipo: "calendario" | "cama" | "solicitud";
}) {
  const common = {
    width: 36,
    height: 36,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const
  };
  if (tipo === "calendario")
    return <svg {...common}>
      <rect x="3" y="5" width="16" height="15" rx="2" />
      <path d="M7 3v4M15 3v4M3 9h16M16 14v6M13 17h6" />
    </svg>;
  if (tipo === "cama")
    return <svg {...common}>
      <path d="M3 18v-8M21 18v-5a3 3 0 0 0-3-3H7a4 4 0 0 0-4 4v1h12M7 10V7h6a3 3 0 0 1 3 3M18 15v6M15 18h6" />
    </svg>;
  return <svg {...common}>
    <path d="M7 3h8l4 4v14H7zM15 3v5h5M10 13h6M10 17h5" />
  </svg>;
}
