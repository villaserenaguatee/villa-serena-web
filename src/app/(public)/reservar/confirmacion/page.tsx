"use client";
import { UiText } from "@/i18n/UiText";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { leerReservas, RESERVAS_EVENT } from "@/store/reservationStore";
import { leerHuespedes, HUESPEDES_EVENT } from "@/store/guestStore";
import { leerHabitaciones, HABITACIONES_EVENT } from "@/store/roomStore";
import { calcularCuenta } from "@/features/recepcion/pages/recUtils";
import type { HabitacionHotel, Huesped, Reserva } from "@/lib/pms/types";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
export default function Confirmacion() {
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
    nombre: data.huesped.nombre,
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
