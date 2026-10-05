import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { fotoHabitacion } from "@/store/roomStore";
import { UiText, useUiText } from "@/i18n/UiText";
import { useState } from "react";
import type { Reserva, HabitacionHotel, Domotica, TurnoAmenidad, ReservaAmenidad, } from "@/lib/pms/types";
import { WIFI_RED, WIFI_PASSWORD, formatoFecha, formatoFechaHora } from "@/data/pms";
import { Chip, Cabecera, Tarjeta, Aviso, BotonFiltro, BotonPrimario, CodigoQR, plazasLibres, turnoLleno, KeyIcon, DoorIcon, ThermoIcon, LightIcon, CurtainIcon, WifiIcon, CheckIcon, SparkIcon, } from "@/features/huesped/pages/huespedUtils";
const TEMP_MIN = 16;
const TEMP_MAX = 30;
interface Props {
  reserva?: Reserva;
  onCompartirExperiencia?: () => void;
  onReservarEstancia?: () => void;
  onVerCuentaFinal?: () => void;
  habitacion: HabitacionHotel;
  domotica: Domotica;
  turnos: TurnoAmenidad[];
  reservasAmenidad: ReservaAmenidad[];
  llaveActiva: boolean;
  codigoLlave?: string;
  estanciaCerrada: boolean;
  onActualizarDomotica: (cambios: Partial<Domotica>) => void;
  onActualizarLuz: (id: string, cambios: {
    encendida?: boolean;
    intensidad?: number;
  }) => void;
  onConectarWifi: () => void;
  onReservarTurno: (turnoId: string, personas: number) => void;
  onCancelarTurno: (reservaId: string) => void;
  onIrCheckin: () => void;
}
export default function MiHabitacion({ reserva, onCompartirExperiencia, onReservarEstancia, onVerCuentaFinal, habitacion, domotica, turnos, reservasAmenidad, llaveActiva, codigoLlave, estanciaCerrada, onActualizarDomotica, onActualizarLuz, onConectarWifi, onReservarTurno, onCancelarTurno, onIrCheckin, }: Props) {
  const ui = useUiText();
  const { en } = usePublicLanguage();
  const [puerta, setPuerta] = useState<"cerrada" | "abriendo" | "abierta">("cerrada");
  const [verQR, setVerQR] = useState(false);
  const [verWifi, setVerWifi] = useState(false);
  const bloqueado = !llaveActiva;
  function abrirPuerta() {
    if (bloqueado || puerta !== "cerrada")
      return;
    setPuerta("abriendo");
    window.setTimeout(() => setPuerta("abierta"), 1200);
    window.setTimeout(() => setPuerta("cerrada"), 5000);
  }
  if (reserva?.estado === 'finalizada') return <div className="flex-1 overflow-y-auto bg-[#F8F6F0]">
    <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      <header className="space-y-2">
        <Chip cls="border-[#D8B94E] bg-[#F8F1DE] text-[#7A6327]">{en ? 'Stay completed' : 'Estancia finalizada'}</Chip>
        <h1 className="text-2xl font-semibold text-[#18345C] sm:text-3xl">{en ? 'Thank you for staying at Villa Serena' : 'Gracias por hospedarte en Villa Serena'}</h1>
        <p className="text-sm text-[#52677F]">{en ? 'Your room is now part of your stay history. Access and controls are deactivated.' : 'Tu habitación forma parte del historial de esta estancia. El acceso y los controles están desactivados.'}</p>
      </header>
      <section className="grid gap-3 rounded-xl border border-[#E5E0D8] bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div><p className="text-xs text-[#72829A]">{en ? 'Reservation' : 'Reserva'}</p><p className="font-semibold text-[#18345C]">{reserva.codigo}</p></div>
        <div><p className="text-xs text-[#72829A]">{en ? 'Arrival' : 'Entrada'}</p><p className="font-semibold text-[#18345C]">{formatoFecha(reserva.fechaEntrada)}</p></div>
        <div><p className="text-xs text-[#72829A]">{en ? 'Departure' : 'Salida'}</p><p className="font-semibold text-[#18345C]">{formatoFecha(reserva.fechaSalida)}</p></div>
        <div><p className="text-xs text-[#72829A]">{en ? 'Check-out' : 'Check-out'}</p><p className="font-semibold text-[#18345C]">{reserva.checkOutEn ? formatoFechaHora(reserva.checkOutEn) : (en ? 'Stay completed' : 'Estancia finalizada')}</p></div>
      </section>
      <section className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white sm:flex">
        <img src={fotoHabitacion(habitacion.numero)} alt={en ? 'Room ' + habitacion.numero : 'Habitación ' + habitacion.numero} className="h-48 w-full object-cover sm:h-auto sm:w-64 sm:shrink-0" />
        <div className="space-y-3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#A77E20]">{en ? 'Your room during this stay' : 'Tu habitación durante esta estancia'}</p>
          <h2 className="text-xl font-semibold text-[#18345C]">{en ? 'Room ' : 'Habitación '}{habitacion.numero}</h2>
          <p className="text-[#52677F]">{habitacion.tipo} · {en ? 'Floor' : 'Piso'} {habitacion.piso} · {habitacion.capacidad} {en ? 'guests' : 'huéspedes'}</p>
        </div>
      </section>
      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onCompartirExperiencia} className="rounded-lg bg-[#B59A52] px-4 py-3 font-semibold text-white">{en ? 'Share your experience' : 'Compartir tu experiencia'}</button>
        <button type="button" onClick={onReservarEstancia} className="rounded-lg bg-[#18345C] px-4 py-3 font-semibold text-white">{en ? 'Book another stay' : 'Reservar otra estancia'}</button>
        <button type="button" onClick={onVerCuentaFinal} className="rounded-lg border border-[#18345C] px-4 py-3 font-semibold text-[#18345C]">{en ? 'View final account' : 'Ver cuenta final'}</button>
      </div>
    </div>
  </div>;
  if (estanciaCerrada) return <div className="flex-1 overflow-y-auto bg-[#F8F6F0]">
    <Cabecera titulo="Mi habitación" subtitulo={`Habitación ${habitacion.numero} · ${habitacion.tipo}`} />
    <div className="p-4 space-y-3">
      <Aviso tono="alerta"><UiText text="Tu estancia finalizó. Gracias por hospedarte con nosotros." /></Aviso>
      <Tarjeta titulo="Mi habitación">
        <p className="text-lg font-semibold text-[#18345C]">{habitacion.numero} · {habitacion.tipo}</p>
        <p className="text-sm text-[#52677F]"><UiText text="Piso" /> {habitacion.piso} · {habitacion.capacidad} <UiText text="huéspedes" /></p>
      </Tarjeta>
    </div>
  </div>;
  return (<div className="flex-1 overflow-y-auto bg-[#F8F6F0]" style={{ fontFamily: '"Afacad", "Segoe UI", Arial, sans-serif' }}>
    <Cabecera titulo="Mi habitación" subtitulo={`Habitación ${habitacion.numero} · ${habitacion.tipo} · piso ${habitacion.piso}`} />

    <div className="px-4 sm:px-5 py-3.5 space-y-3">
      {estanciaCerrada && (<Aviso tono="alerta">
        <UiText text="             Tu estancia finalizó: la llave digital y los controles de la habitación quedaron desactivados.           " />
      </Aviso>)}

      {!estanciaCerrada && bloqueado && (<div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#F4D77B] bg-[#FFF9E5] px-3 py-2">
        <p className="text-[13px] font-medium text-[#18345C]">
          <UiText text="Completa tu check-in para activar la llave digital y los controles de la habitación." />
        </p>
        <button
          type="button"
          onClick={onIrCheckin}
          className="min-h-[36px] rounded-md bg-[#D8B94E] px-3 py-1.5 text-[12px] font-semibold text-[#18345C] hover:brightness-95">
          <UiText text="Completar check-in" />
        </button>
      </div>)}

      <section className="overflow-hidden rounded-xl border border-[#E5E0D8] bg-white">
        <div className="grid md:grid-cols-[220px_1fr]">
          <img
            src="https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=900&h=520&fit=crop&auto=format"
            alt={ui(`Habitación ${habitacion.numero}`)}
            className="h-36 w-full object-cover md:h-full" />
          <div className="p-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[12px] uppercase tracking-[0.14em] text-[#AEBCC1]">
                  <UiText text="Tu alojamiento actual" />
                </p>
                <h2 className="mt-1 text-xl font-semibold text-[#18345C]">Habitación {habitacion.numero} · {habitacion.tipo}</h2>
                <p className="mt-1 text-sm text-[#6B7280]">Piso {habitacion.piso} · Hasta {habitacion.capacidad} huéspedes</p>
              </div>
              <Chip cls={llaveActiva ? "border-[#86EFAC] bg-[#F0FAF4] text-[#166534]" : "border-[#F4D77B] bg-[#FFF9E5] text-[#7A5200]"}>
                {ui(llaveActiva ? "Llave activa" : "Activando llave")}
              </Chip>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#6B7280]">
              {ui("Controla la puerta, temperatura, luces, cortinas y avisos de limpieza desde esta pantalla.")}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-[#F8F6F0] px-2 py-2">
                <p className="font-semibold text-[#18345C]">{domotica.temperatura}°</p>
                <p className="text-[11px] text-[#6B7280]">Temperatura</p>
              </div>
              <div className="rounded-lg bg-[#F8F6F0] px-2 py-2">
                <p className="font-semibold text-[#18345C]">{domotica.luces.filter((l) => l.encendida).length}/{domotica.luces.length}</p>
                <p className="text-[11px] text-[#6B7280]">Luces</p>
              </div>
              <div className="rounded-lg bg-[#F8F6F0] px-2 py-2">
                <p className="font-semibold text-[#18345C]">{domotica.cortinas}%</p>
                <p className="text-[11px] text-[#6B7280]">Cortinas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Tarjeta titulo="Acceso a la habitación">
        {bloqueado ? (<div className="text-center py-3.5">
          <div className="w-10 h-10 rounded-full bg-[#F8F6F0] flex items-center justify-center mx-auto text-[#AEBCC1]">
            <KeyIcon size={22} />
          </div>
          <p className="text-[15px] font-medium text-[#18345C] mt-3">
            {estanciaCerrada
              ? "Llave desactivada"
              : "Todavía no tienes llave digital"}
          </p>
          <p className="text-[14px] text-[#AEBCC1] mt-1 max-w-md mx-auto">
            {estanciaCerrada
              ? "Se desactivó al procesar el pago del check-out, como medida de seguridad."
              : "Completa el check-in. Al aprobarlo, recepción activará la llave en este mismo teléfono."}
          </p>
          {!estanciaCerrada && (<div className="mt-4">
            <BotonPrimario onClick={onIrCheckin}>
              <UiText text="Ir al check-in" />
            </BotonPrimario>
          </div>)}
        </div>) : (<div className="grid gap-3 sm:grid-cols-2 items-start">
          <div className="text-center">
            <button
              onClick={abrirPuerta}
              className="w-28 h-28 rounded-full mx-auto flex flex-col items-center justify-center gap-1 transition-colors"
              style={{
                backgroundColor: puerta === "abierta" ? "#F0FAF4" : "#18345C",
                color: puerta === "abierta" ? "#166534" : "#FFFFFF",
                border: puerta === "abierta"
                  ? "2px solid #86EFAC"
                  : "2px solid #18345C",
              }}>
              {puerta === "abierta" ? (<CheckIcon size={30} />) : (<DoorIcon size={30} />)}
              <span className="text-[14px] font-semibold mt-1">
                {ui(puerta === "cerrada"
                  ? "Abrir puerta"
                  : puerta === "abriendo"
                    ? "Conectando…"
                    : "¡Abierta!")}
              </span>
            </button>
            <p className="text-[13px] text-[#6B7280] mt-3">
              {ui(puerta === "abierta"
                ? "La cerradura se abrió. Volverá a bloquearse sola."
                : "Acerca el teléfono a la cerradura y pulsa el botón.")}
            </p>
            <div className="flex justify-center gap-1.5 mt-2 flex-wrap">
              <Chip cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">
                <UiText text="NFC" />
              </Chip>
              <Chip cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">
                <UiText text="Bluetooth" />
              </Chip>
              <Chip cls="bg-[#EFF6FF] text-[#1E40AF] border-[#93C5FD]">
                <UiText text="QR" />
              </Chip>
            </div>
          </div>

          <div>
            <p className="text-[15px] font-semibold text-[#18345C] flex items-center gap-2">
              <KeyIcon size={16} />
              <UiText text=" Llave digital activa                 " />
            </p>
            <p className="text-[14px] text-[#6B7280] mt-1">
              <UiText text="                   Si la cerradura no responde por Bluetooth, muestra el código QR en el lector.                 " />
            </p>

            {verQR && codigoLlave ? (<div className="mt-3 flex flex-col items-center gap-2">
              <CodigoQR texto={codigoLlave} tamano={150} />
              <button onClick={() => setVerQR(false)} className="text-[13px] font-semibold text-[#6B7280] hover:text-[#18345C]">
                <UiText text="                       Ocultar código                     " />
              </button>
            </div>) : (<button
              onClick={() => setVerQR(true)}
              className="mt-3 px-4 py-2.5 min-h-[44px] text-[14px] font-semibold border border-[#18345C] text-[#18345C] rounded-md hover:bg-[#18345C] hover:text-white transition-colors">
              <UiText text="                     Mostrar código QR                   " />
            </button>)}
          </div>
        </div>)}
      </Tarjeta>

      <div className="grid gap-3 lg:grid-cols-2">

        <Tarjeta
          titulo="Temperatura"
          extra={<Interruptor
            activo={domotica.climaEncendido}
            disabled={bloqueado}
            onClick={() => onActualizarDomotica({
              climaEncendido: !domotica.climaEncendido,
            })} />}>
          <div className="flex items-center justify-center gap-6">
            <button
              onClick={() => onActualizarDomotica({
                temperatura: Math.max(TEMP_MIN, domotica.temperatura - 1),
              })}
              disabled={!domotica.climaEncendido || bloqueado}
              aria-label={ui("Bajar temperatura")}
              className="w-10 h-10 rounded-full border border-[#E5E0D8] text-[22px] font-bold text-[#18345C] hover:bg-[#F8F6F0] disabled:text-[#AEBCC1]">
              <UiText text="                 −               " />
            </button>

            <div className="text-center">
              <p className="text-[40px] font-bold leading-none" style={{
                color: domotica.climaEncendido ? "#18345C" : "#AEBCC1",
              }}>
                {domotica.temperatura}
                <UiText text="°                 " />
              </p>
              <p className="text-[12px] text-[#AEBCC1] mt-1 flex items-center justify-center gap-1">
                <ThermoIcon size={12} />
                {" "}
                {domotica.climaEncendido ? "Climatización activa" : "Apagada"}
              </p>
            </div>

            <button
              onClick={() => onActualizarDomotica({
                temperatura: Math.min(TEMP_MAX, domotica.temperatura + 1),
              })}
              disabled={!domotica.climaEncendido || bloqueado}
              aria-label={ui("Subir temperatura")}
              className="w-10 h-10 rounded-full border border-[#E5E0D8] text-[22px] font-bold text-[#18345C] hover:bg-[#F8F6F0] disabled:text-[#AEBCC1]">
              <UiText text="                 +               " />
            </button>
          </div>

          <input
            type="range"
            min={TEMP_MIN}
            max={TEMP_MAX}
            value={domotica.temperatura}
            disabled={!domotica.climaEncendido || bloqueado}
            onChange={(e) => onActualizarDomotica({ temperatura: Number(e.target.value) })}
            className="w-full mt-4 accent-[#18345C]"
            aria-label={ui("Temperatura de la habitación")} />

          <div className="flex justify-between text-[11px] text-[#AEBCC1]">
            <span>
              {TEMP_MIN}
              <UiText text="°" />
            </span>
            <span>
              {TEMP_MAX}
              <UiText text="°" />
            </span>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Luces">
          <div className="space-y-3">
            {domotica.luces.map((l) => (<div key={l.id}>
              <div className="flex items-center gap-3">
                <span style={{ color: l.encendida ? "#D8B94E" : "#AEBCC1" }}>
                  <LightIcon size={17} />
                </span>
                <p className="text-[15px] font-medium text-[#18345C] flex-1">
                  {ui(l.nombre)}
                </p>
                <span className="text-[13px] text-[#AEBCC1]">
                  {l.encendida ? `${l.intensidad}%` : "Apagada"}
                </span>
                <Interruptor activo={l.encendida} disabled={bloqueado} onClick={() => onActualizarLuz(l.id, { encendida: !l.encendida })} />
              </div>
              <input
                type="range"
                min={5}
                max={100}
                value={l.intensidad}
                disabled={!l.encendida || bloqueado}
                onChange={(e) => onActualizarLuz(l.id, {
                  intensidad: Number(e.target.value),
                })}
                className="w-full mt-2 accent-[#D8B94E]"
                aria-label={ui(`Intensidad de ${l.nombre}`)} />
            </div>))}
          </div>
        </Tarjeta>

        <Tarjeta titulo="Cortinas">
          <div className="flex items-center gap-3">
            <span className="text-[#18345C]">
              <CurtainIcon size={18} />
            </span>
            <p className="text-[15px] text-[#6B7280] flex-1">
              <UiText text="Apertura" />
            </p>
            <p className="text-[22px] font-bold text-[#18345C]">
              {domotica.cortinas}
              <UiText text="%" />
            </p>
          </div>

          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={domotica.cortinas}
            disabled={bloqueado}
            onChange={(e) => onActualizarDomotica({ cortinas: Number(e.target.value) })}
            className="w-full mt-3 accent-[#18345C]"
            aria-label={ui("Apertura de las cortinas")} />

          <div className="flex gap-2 mt-3">
            <BotonFiltro activo={domotica.cortinas === 0} onClick={() => !bloqueado && onActualizarDomotica({ cortinas: 0 })}>
              <UiText text="                 Cerrar               " />
            </BotonFiltro>
            <BotonFiltro activo={domotica.cortinas === 50} onClick={() => !bloqueado && onActualizarDomotica({ cortinas: 50 })}>
              <UiText text="                 Media               " />
            </BotonFiltro>
            <BotonFiltro activo={domotica.cortinas === 100} onClick={() => !bloqueado && onActualizarDomotica({ cortinas: 100 })}>
              <UiText text="                 Abrir               " />
            </BotonFiltro>
          </div>
        </Tarjeta>

        <Tarjeta titulo="Avisos y conexión">
          <div className="space-y-3">
            <div className="flex items-center gap-3 bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-3">
              <span className="text-[#991B1B]">
                <SparkIcon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#18345C]">
                  <UiText text="No molestar" />
                </p>
                <p className="text-[12px] text-[#AEBCC1]">
                  <UiText text="Limpieza no entrará a la habitación." />
                </p>
              </div>
              <Interruptor
                activo={domotica.noMolestar}
                disabled={bloqueado}
                onClick={() => onActualizarDomotica({
                  noMolestar: !domotica.noMolestar,
                  hacerHabitacion: domotica.noMolestar
                    ? domotica.hacerHabitacion
                    : false,
                })} />
            </div>

            <div className="flex items-center gap-3 bg-[#F8F6F0] border border-[#E5E0D8] rounded-lg px-3 py-3">
              <span className="text-[#166534]">
                <CheckIcon size={16} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-[#18345C]">
                  <UiText text="Hacer la habitación" />
                </p>
                <p className="text-[12px] text-[#AEBCC1]">
                  <UiText text="Avisa a limpieza que puede pasar." />
                </p>
              </div>
              <Interruptor
                activo={domotica.hacerHabitacion}
                disabled={bloqueado}
                onClick={() => onActualizarDomotica({
                  hacerHabitacion: !domotica.hacerHabitacion,
                  noMolestar: domotica.hacerHabitacion
                    ? domotica.noMolestar
                    : false,
                })} />
            </div>

            <div className={`rounded-xl border px-3 py-3 ${bloqueado ? "border-[#E5E0D8] bg-[#F7F7F5]" : "border-[#D8E6D9] bg-[#F4FAF5]"}`}>
              <div className="flex items-center gap-3">
                <span className={bloqueado ? "text-[#9CA3AF]" : "text-[#166534]"}>
                  <WifiIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold text-[#18345C]">
                    {ui("Wi-Fi del hotel")}
                  </p>
                  <p className="text-[12px] text-[#71839B]">
                    {bloqueado ? ui("Disponible después del check-in") : ui("Red disponible durante tu estancia")}
                  </p>
                </div>
                {!bloqueado && <button type="button" onClick={onConectarWifi} className="rounded-md bg-[#18345C] px-3 py-2 text-[12px] font-semibold text-white">
                  {ui("Conectar")}
                </button>}
              </div>
              {bloqueado ? (<div className="mt-3 rounded-lg border border-[#E5E0D8] bg-white px-3 py-3 text-center text-sm text-[#7A8798]">
                {ui("Completa el check-in para ver la red, contraseña y código QR.")}
              </div>) : (<div className="mt-3 grid gap-2 md:grid-cols-[1fr_1fr_140px] md:items-center">
                <div className="rounded-lg border border-[#E5E0D8] bg-white px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[.14em] text-[#8A96A3]">
                    {ui("Red")}
                  </p>
                  <p className="mt-1 font-semibold text-[#18345C]">
                    {WIFI_RED}
                  </p>
                </div>
                <div className="rounded-lg border border-[#E5E0D8] bg-white px-3 py-3">
                  <p className="text-[10px] uppercase tracking-[.14em] text-[#8A96A3]">
                    {ui("Contraseña")}
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate font-semibold text-[#18345C]">
                      {verWifi ? WIFI_PASSWORD : "••••••••••"}
                    </p>
                    <button type="button" onClick={() => setVerWifi(v => !v)} className="text-xs font-semibold text-[#18345C]">
                      {ui(verWifi ? "Ocultar" : "Ver")}
                    </button>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setVerQR(v => !v)}
                  className="rounded-lg border border-[#B59A52] bg-white px-3 py-3 text-sm font-semibold text-[#7A6327]">
                  {ui(verQR ? "Ocultar QR" : "Mostrar QR")}
                </button>
              </div>)}
              {!bloqueado && verQR && <div className="mt-3 flex justify-center rounded-lg border border-[#E5E0D8] bg-white p-4">
                <CodigoQR texto={`${WIFI_RED}|${WIFI_PASSWORD}`} tamano={150} />
              </div>}
            </div>
          </div>
        </Tarjeta>
      </div>
    </div>
  </div>);
}
function Interruptor({ activo, onClick, disabled = false, }: {
  activo: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (<button
    onClick={onClick}
    disabled={disabled}
    role="switch"
    aria-checked={activo}
    className="w-11 h-6 rounded-full relative transition-colors shrink-0 disabled:opacity-40"
    style={{ backgroundColor: activo ? "#18345C" : "#E5E0D8" }}>
    <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all" style={{ left: activo ? 22 : 2 }} />
  </button>);
}
function TurnoCard({ turno, reservado, deshabilitado, onReservar, }: {
  turno: TurnoAmenidad;
  reservado: boolean;
  deshabilitado: boolean;
  onReservar: (personas: number) => void;
}) {
  const ui = useUiText();
  const [personas, setPersonas] = useState(1);
  const libres = plazasLibres(turno);
  const lleno = turnoLleno(turno);
  return (<div className={`border rounded-xl px-3 py-3 ${reservado
    ? "bg-[#F0FAF4] border-[#86EFAC]"
    : lleno
      ? "bg-[#F8F6F0] border-[#E5E0D8]"
      : "bg-white border-[#E5E0D8]"}`}>
    <div className="flex items-center gap-2">
      <p className="text-[20px] font-semibold text-[#18345C] flex-1">
        {turno.hora}
      </p>
      {reservado ? (<Chip cls="bg-[#F0FAF4] text-[#166534] border-[#86EFAC]">
        <UiText text="Reservado" />
      </Chip>) : lleno ? (<Chip cls="bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]">
        <UiText text="Sin plazas" />
      </Chip>) : (<Chip cls="bg-[#F8F6F0] text-[#6B7280] border-[#E5E0D8]">
        {libres}
        <UiText text=" libres" />
      </Chip>)}
    </div>

    <div className="h-1.5 rounded-full bg-[#E5E0D8] mt-2 overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${Math.round((turno.ocupados / turno.aforo) * 100)}%`,
          backgroundColor: lleno ? "#EF4444" : "#18345C",
        }} />
    </div>

    {!reservado && !lleno && (<div className="flex items-center gap-2 mt-3">
      <select
        value={personas}
        onChange={(e) => setPersonas(Number(e.target.value))}
        disabled={deshabilitado}
        aria-label={ui("Número de personas")}
        className="border border-[#E5E0D8] rounded-md px-2 py-2 text-[14px] text-[#1F2933] bg-white">
        {Array.from({ length: Math.min(4, libres) }, (_, i) => i + 1).map((n) => (<option key={n} value={n}>
          {n}
        </option>))}
      </select>
      <button
        onClick={() => onReservar(personas)}
        disabled={deshabilitado}
        className="flex-1 px-3 py-2 min-h-[44px] text-[14px] font-semibold bg-[#18345C] text-white rounded-md hover:bg-[#102747] transition-colors disabled:bg-[#E5E0D8] disabled:text-[#AEBCC1]">
        <UiText text="             Reservar           " />
      </button>
    </div>)}
  </div>);
}
