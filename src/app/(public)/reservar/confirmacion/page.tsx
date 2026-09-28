"use client";
import { UiText } from "@/i18n/UiText";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { leerPortalRecepcion, type PortalReceptionData } from "@/store/portalReceptionSync";
import { calcularCuenta } from "@/features/recepcion/pages/recUtils";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
export default function Confirmacion() {
  const r = useRouter(), sp = useSearchParams();
  const t = useTranslations("publicBooking");
  const [data, setData] = useState<PortalReceptionData | null>(null);
  useEffect(() => {
    const refresh = () => setData(leerPortalRecepcion());
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('vs-portal-recepcion-actualizado', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('vs-portal-recepcion-actualizado', refresh);
    };
  },
    []);
  const reservation = data?.reservas.find(item => item.id === sp.get("reservaId"));
  const code = reservation?.codigo || sp.get("reserva") || "VS-2026-00452";
  const nombre = data?.huespedes.find(item => item.id === reservation?.huespedId)?.nombre || `${sp.get("nombre") || ""} ${sp.get("apellidos") || ""}`.trim() || "Huésped Villa Serena";
  const q = new URLSearchParams(Object.fromEntries(sp.entries()));
  q.set("reserva", code);
  const isHotelBooking = Boolean(reservation && reservation.modalidadPago === 'hotel');
  if (data && sp.get("reservaId") && (!reservation || reservation.estado === 'cancelada'))
    return <main className="reserve-public reserve-center">
      <VillaSerenaLogo />
      <p role="status">
        {t("notFound")}
      </p>
    </main>;
  const paid = reservation ? calcularCuenta(reservation, null).saldo <= 0 : false;
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
      {isHotelBooking && reservation && <>
        <div className="account-info">
          <span>
            {t("paymentMethod")}
            <b>
              {t("payAtHotel")}
            </b>
          </span>
          <span>
            {t("paymentStatus")}
            <b>
              {t(paid ? "paid" : "pending")}
            </b>
          </span>
        </div>
        {!paid && <p>
          {t("payAtReception")}
        </p>}
      </>}
      <p>
        <UiText text="Tu código de reserva:" />
      </p>
      <strong className="reserve-code">
        {code}
      </strong>
      <p>
        <UiText text="Reserva a nombre de:" />
        <br />
        <b>
          {nombre}
        </b>
      </p>
      <button className="reserve-primary" onClick={() => r.push("/reservar/activar?" + q)}>
        <UiText text="Activar mi cuenta" />
      </button>
    </section>
  </main>);
}
