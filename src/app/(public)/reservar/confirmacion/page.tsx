"use client";
import { getBookingResult, recoverBookingCopy } from "@/lib/publicBooking";
import type { BookingResult } from "@/lib/bff/contracts/booking";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { UiText } from "@/i18n/UiText";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { leerReservas, RESERVAS_EVENT } from "@/store/reservationStore";
import { leerHuespedes, HUESPEDES_EVENT } from "@/store/guestStore";
import { leerHabitaciones, HABITACIONES_EVENT } from "@/store/roomStore";
import { calcularCuenta } from "@/features/recepcion/pages/recUtils";
import type { HabitacionHotel, Huesped, Reserva } from "@/lib/pms/types";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
function LegacyConfirmation() {
  const r = useRouter(), sp = useSearchParams();
  const t = useTranslations("publicBooking");
  const [data, setData] = useState<{
    reserva?: Reserva;
    huesped?: Huesped;
    habitacion?: HabitacionHotel;
  }>({});
  const [loaded, setLoaded] = useState(false);
  const reservaId = sp.get("reservaId");
  useEffect(() => {
    const refresh = () => {
      const reserva = reservaId ? leerReservas().find(item => item.id === reservaId) : undefined;
      setData({
        reserva,
        huesped: reserva ? leerHuespedes().find(item => item.id === reserva.huespedId) : undefined,
        habitacion: reserva?.habitacionId
          ? leerHabitaciones().find(item => item.id === reserva.habitacionId)
          : undefined,
      });
      setLoaded(true);
    };
    refresh();
    const events = [RESERVAS_EVENT, HUESPEDES_EVENT, HABITACIONES_EVENT, "storage"];
    events.forEach(event => window.addEventListener(event, refresh));
    return () => {
      events.forEach(event => window.removeEventListener(event, refresh));
    };
  },
    [reservaId]);
  const reservation = data.reserva;
  const account = reservation ? calcularCuenta(reservation, data.habitacion || null) : undefined;
  const paymentConfirmed = Boolean(account && account.pagado >= account.total && account.total > 0 &&
    reservation?.pagos.some(payment => payment.metodo === "tarjeta" && payment.monto > 0));
  const validReservation = Boolean(
    reservation &&
    reservation.origenReserva === "publica" &&
    reservation.estado === "confirmada" &&
    reservation.codigo &&
    data.huesped &&
    data.habitacion &&
    reservation.fechaEntrada &&
    reservation.fechaSalida &&
    paymentConfirmed
  );
  if (loaded && !validReservation)
    return <main className="reserve-public reserve-center">
      <VillaSerenaLogo />
      <p role="status">
        {t("notFound")}
      </p>
    </main>;
  if (!loaded || !validReservation || !reservation || !data.huesped || !data.habitacion || !account)
    return <main className="reserve-public reserve-center" aria-busy="true">
      <VillaSerenaLogo />
      <p role="status">
        {t("loading")}
      </p>
    </main>;
  const activationParams = new URLSearchParams({
    reserva: reservation.codigo,
    reservaId: reservation.id,
  });
  return (<main className="reserve-public reserve-center">
    <VillaSerenaLogo />
    <section className="reserve-form-card reserve-success">
      <CheckCircle2 size={46} />
      <h1>
        <UiText text="¡Reserva confirmada!" />
      </h1>
      <p>
        {t("roomReserved")}
      </p>
      <div className="account-info">
        <span>
          <UiText text="Huésped" />
          <b>{data.huesped.nombre}</b>
        </span>
        <span>
          <UiText text="Habitación" />
          <b>{data.habitacion.numero} · {reservation.habitacionPublica || reservation.tipoHabitacion}</b>
        </span>
        <span>
          <UiText text="Check-in" />
          <b>{reservation.fechaEntrada}</b>
        </span>
        <span>
          <UiText text="Check-out" />
          <b>{reservation.fechaSalida}</b>
        </span>
        <span>
          <UiText text="Total" />
          <b>Q {account.total.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b>
        </span>
        <span>
          <UiText text="Estado" />
          <b>{reservation.estado}</b>
        </span>
      </div>
      <p>
        <UiText text="Tu código de reserva:" />
      </p>
      <strong className="reserve-code">
        {reservation.codigo}
      </strong>
      <p>
        <UiText text="Reserva a nombre de:" />
        <br />
        <b>
          {data.huesped.nombre}
        </b>
      </p>
      <button className="reserve-primary" onClick={() => r.push("/reservar/activar?" + activationParams)}>
        <UiText text="Activar mi cuenta" />
      </button>
    </section>
  </main>);
}

export default function Confirmacion() {
  const code = useSearchParams().get("code");
  return code ? <BffConfirmation code={code} /> : <LegacyConfirmation />;
}
function BffConfirmation({ code }: { code: string }) {
  const router = useRouter(), query = useSearchParams(), t = useTranslations("publicBooking");
  const { en } = usePublicLanguage();
  const [result, setResult] = useState<BookingResult | null>(null);
  const [reload, setReload] = useState(0), [copyError, setCopyError] = useState(false);
  const busy = useRef(false);
  const [error, setError] = useState(false), [recovering, setRecovering] = useState(false);
  const [local, setLocal] = useState<{ reservation?: Reserva; guest?: Huesped; room?: HabitacionHotel }>({});
  const refreshLocal = () => {
    const reservation = leerReservas().find(r => r.codigo === code);
    setLocal({ reservation, guest: reservation ? leerHuespedes().find(g => g.id === reservation.huespedId) : undefined,
      room: reservation ? leerHabitaciones().find(r => r.id === reservation.habitacionId) : undefined });
  };
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError(false); setCopyError(false);
    void getBookingResult(code, controller.signal).then(value => { if (!controller.signal.aborted) setResult(value); }).catch(() => { if (!controller.signal.aborted) setError(true); });
    refreshLocal();
    const events = [RESERVAS_EVENT, HUESPEDES_EVENT, HABITACIONES_EVENT, "storage"];
    events.forEach(event => window.addEventListener(event, refreshLocal));
    return () => { controller.abort(); events.forEach(event => window.removeEventListener(event, refreshLocal)); };
  }, [code, reload]);
  async function recoverLocal() {
    if (busy.current) return;
    busy.current = true; setRecovering(true); setCopyError(false);
    try { await recoverBookingCopy(query.get("draft") || "", code); refreshLocal(); }
    catch { setCopyError(true); }
    finally { busy.current = false; setRecovering(false); }
  }
  if (!result || result.code !== code) return <main className="reserve-public reserve-center"><VillaSerenaLogo /><p role="status">{t(error ? "resultUnavailable" : "loading")}</p>
    {error && <button className="reserve-secondary" onClick={() => setReload(value => value + 1)}>{en ? "Retry status" : "Reintentar consulta"}</button>}
  </main>;
  const copyReady = Boolean(local.reservation && local.guest && local.room);
  return <main className="reserve-public reserve-center"><VillaSerenaLogo />
    <section className="reserve-form-card reserve-success"><CheckCircle2 size={46} />
      <h1><UiText text="¡Reserva confirmada!" /></h1>
      <p>{en ? "Demo booking saved. Pay at the hotel at check-out. No payment was collected." : "Reserva demo guardada. Paga en el hotel al check-out. No se ha cobrado ningún pago."}</p>
      <div className="account-info">
        {local.guest && <span><UiText text="Huésped" /><b>{local.guest.nombre}</b></span>}
        {local.room && <span><UiText text="Habitación" /><b>{local.room.numero} · {local.reservation?.habitacionPublica}</b></span>}
        {local.reservation && <><span><UiText text="Check-in" /><b>{local.reservation.fechaEntrada}</b></span><span><UiText text="Check-out" /><b>{local.reservation.fechaSalida}</b></span></>}
        <span><UiText text="Total" /><b>Q {result.total.toLocaleString("es-GT", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</b></span>
      </div>
      <p><UiText text="Tu código de reserva:" /></p><strong className="reserve-code">{result.code}</strong>
      {!copyReady && <><p role="status">{en ? "Your booking is saved. The local portal copy is unavailable in this browser." : "Tu reserva está guardada. La copia del portal local no está disponible en este navegador."}</p>
        {query.get("draft") && <button className="reserve-secondary" disabled={recovering} onClick={recoverLocal}>{en ? "Retry local copy" : "Reintentar copia local"}</button>}</>}
      {copyError && <p role="alert">{t("copyUnavailable")}</p>}
      {copyReady && <button className="reserve-primary" onClick={() => router.push("/reservar/activar?" + new URLSearchParams({ reserva: result.code, reservaId: local.reservation!.id }))}><UiText text="Activar mi cuenta" /></button>}
    </section>
  </main>;
}
