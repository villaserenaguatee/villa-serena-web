"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LockKeyhole, X } from "lucide-react";
import VillaSerenaCard from "@/components/common/VillaSerenaCard";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { money, usePublicRooms } from "@/data/publicRooms";
import { leerPromociones } from "@/store/promotionStore";
import { fechaHotel } from "@/lib/hotel";
import { confirmarReservaPublica, PublicBookingError } from "@/lib/publicBooking";
export default function Pago() {
  const publicRooms = usePublicRooms();
  const ui = useUiText();
  const bookingText = useTranslations("publicBooking");
  const { en } = usePublicLanguage();
  const r = useRouter(), sp = useSearchParams();
  const [saving, setSaving] = useState(false),
    [accepted, setAccepted] = useState(false),
    [card, setCard] = useState(""),
    [holder, setHolder] = useState(""),
    [expiry, setExpiry] = useState(""),
    [cvv, setCvv] = useState(""),
    [legal, setLegal] = useState<'terms' | 'privacy' | null>(null),
    [promo, setPromo] = useState(""),
    [promoPct, setPromoPct] = useState(0),
    [promoMsg, setPromoMsg] = useState(""),
    [paymentError, setPaymentError] = useState("");
  const room = publicRooms.find((x) => x.name === (sp.get("habitacion") || ""));
  const total = Number(sp.get("total") || room?.price || 0);
  const promoTotal = Math.max(0, total * (1 - promoPct / 100));
  const nights = useMemo(() => {
    const a = sp.get("llegada"), b = sp.get("salida");
    if (!a || !b)
      return 1;
    return Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
  },
    [sp]);
  const canPay = accepted &&
    card.replace(/\s/g, "").length === 16 &&
    holder.trim().length > 2 &&
    /^\d{2}\/\d{2}$/.test(expiry) &&
    cvv.length >= 3;
  async function finish() {
    if (!canPay || saving)
      return;
    setSaving(true);
    setPaymentError("");
    try {
      const reservation = await confirmarReservaPublica(
        new URLSearchParams(sp.toString()),
        promoPct > 0 ? promo.trim() : "",
      );
      r.push(`/reservar/confirmacion?${new URLSearchParams({ reservaId: reservation.id })}`);
    }
    catch (error) {
      setPaymentError(
        error instanceof PublicBookingError
          ? bookingText(error.code)
          : bookingText("saveFailed"),
      );
    }
    finally {
      setSaving(false);
    }
  }
  function exp(v: string) {
    const n = v.replace(/\D/g, "").slice(0, 4);
    return n.length > 2 ? n.slice(0, 2) + "/" + n.slice(2) : n;
  }
  return (<main className="reserve-public booking-checkout">
    <header className="reserve-nav">
      <button className="icon-back" onClick={() => r.back()} aria-label={ui("Volver")}>
        <ArrowLeft />
      </button>
      <VillaSerenaLogo />
    </header>
    <div className="checkout-layout">
      <aside className="booking-summary-card">
        <h2>
          <UiText text="Tu reserva" />
        </h2>
        {room && <img src={room.image} alt={ui(room.name)} />}
        <h3>
          {ui(sp.get("habitacion") ?? "")}
        </h3>
        <div className="summary-dates">
          <span>
            <small>
              <UiText text="Llegada" />
            </small>
            <b>
              {sp.get("llegada")}
            </b>
          </span>
          <span>
            <small>
              <UiText text="Salida" />
            </small>
            <b>
              {sp.get("salida")}
            </b>
          </span>
          <span>
            <small>
              <UiText text="Adultos" />
            </small>
            <b>
              {sp.get("adultos") || sp.get("huespedes") || "1"}
            </b>
          </span>
          <span>
            <small>
              <UiText text="Niños" />
            </small>
            <b>
              {sp.get("ninos") || "0"}
            </b>
          </span>
          <span>
            <small>
              <UiText text="Noches" />
            </small>
            <b>
              {nights}
            </b>
          </span>
          {room && (<span>
            <small>
              <UiText text="Precio / noche" />
            </small>
            <b>
              {money(room.price)}
            </b>
          </span>)}
        </div>
        <div className="promo-public">
          <label htmlFor="booking-promo-code">
            {en ? "Discount code" : "Código de descuento"}
          </label>
          <div className="promo-public-controls">
            <input
              id="booking-promo-code"
              type="text"
              value={promo}
              onChange={(e) => {
                setPromo(e.target.value.toUpperCase());
                setPromoPct(0);
                setPromoMsg("");
              }} />
            <button
              type="button"
              onClick={() => {
                const hoy = fechaHotel();
                const activa = leerPromociones().find(p => p.activa && p.codigo.toUpperCase() === promo.trim().toUpperCase() && p.desde <= hoy && p.hasta >= hoy);
                const pct = activa?.descuentoPct || 0;
                setPromoPct(pct);
                setPromoMsg(pct
                  ? en
                    ? `${pct}% discount applied`
                    : `${pct}% de descuento aplicado`
                  : en
                    ? "Invalid or inactive code"
                    : "Código no válido o inactivo");
              }}>
              <UiText text="Aplicar" />
            </button>
          </div>
          {promoMsg && <small>
            {promoMsg}
          </small>}
        </div>
        <div className="summary-total">
          <span>
            {promoPct
              ? en
                ? "Total with discount"
                : "Total con descuento"
              : en
                ? "Estimated total"
                : "Total estimado"}
          </span>
          <b>
            {money(promoTotal)}
          </b>
        </div>
      </aside>
      <section className="reserve-form-card reserve-form-wide checkout-form">
        <span className="reserve-kicker">
          <UiText text="ÚLTIMO PASO" />
        </span>
        <h1>
          <UiText text="Selecciona el método de pago" />
        </h1>
        <p>
          <UiText text="Elige cómo deseas garantizar tu reserva." />
        </p>
        <div className="payment-methods">
          <label>
            <UiText text="Tarjeta de crédito o débito" />
          </label>
        </div>
        <>
          <div className="online-payment-head">
            <div>
              <b>
                <UiText text="Formulario de tarjeta" />
              </b>
              <span>
                <UiText text="Los datos de la tarjeta requieren confirmación del proveedor de pagos." />
              </span>
            </div>
            <div className="card-brands">
              <span className="mastercard-mark">
                <i />
                <i />
              </span>
              <b className="visa-mark">
                <UiText text="VISA" />
              </b>
            </div>
          </div>
          <div className="card-payment-layout">
            <div className="card-payment-form">
              <label>
                <UiText text="Número de tarjeta" />
                <input
                  inputMode="numeric"
                  maxLength={19}
                  value={card}
                  onChange={(e) => setCard(e.target.value
                    .replace(/\D/g, "")
                    .slice(0, 16)
                    .replace(/(.{4})/g, "$1 ")
                    .trim())}
                  placeholder="0000 0000 0000 0000" />
              </label>
              <label>
                <UiText text="Nombre del titular" />
                <input value={holder} onChange={(e) => setHolder(e.target.value)} placeholder={ui("Nombre como aparece en la tarjeta")} />
              </label>
              <div className="payment-grid">
                <label>
                  <UiText text="Vencimiento" />
                  <input value={expiry} onChange={(e) => setExpiry(exp(e.target.value))} placeholder="MM/AA" maxLength={5} />
                </label>
                <label>
                  <UiText text="CVV" />
                  <input type="password" inputMode="numeric" value={cvv} onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))} maxLength={4} />
                </label>
              </div>
            </div>
            <div className="visual-card-wrap">
              <VillaSerenaCard numero={card} titular={holder} vencimiento={expiry} />
              <span className="reservation-secure">
                <LockKeyhole />
                <UiText text=" Formulario de tarjeta" />
              </span>
            </div>
          </div>

        </>
        <label className="terms-check">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
          <span>
            {en ? "I have read and accept the " : "He leído y acepto las "}
            <button type="button" onClick={() => setLegal("terms")}>
              {en
                ? "booking and cancellation conditions"
                : "condiciones de reserva y cancelación"}
            </button>
            {en ? ", as well as the " : ", así como la "}
            <button type="button" onClick={() => setLegal("privacy")}>
              {en ? "privacy policy" : "política de privacidad"}
            </button>
            <UiText text="." />
          </span>
        </label>
        {paymentError && <p className="password-error" role="alert">
          {paymentError}
        </p>}
        <button className="reserve-primary" disabled={!canPay || saving} onClick={finish}>
          <UiText text="Confirmar reserva" />
        </button>
      </section>
    </div>
    {legal && (<div className="booking-modal-backdrop" onMouseDown={() => setLegal(null)}>
      <section className="legal-modal" onMouseDown={(e) => e.stopPropagation()}>
        <button className="booking-modal-close" onClick={() => setLegal(null)} aria-label={ui("Cerrar")}>
          <X />
        </button>
        {legal === "terms" ? (<>
          <span className="section-kicker">
            <UiText text="VILLA SERENA" />
          </span>
          <h2>
            <UiText text="Condiciones de reserva y cancelación" />
          </h2>
          <div className="legal-reservation">
            <b>
              {room?.name || sp.get("habitacion")}
            </b>
            <span>
              {sp.get("adultos") || sp.get("huespedes") || "1"}
              <UiText text=" adulto(s) · " />
              {sp.get("ninos") || "0"}
              <UiText text=" niño(s)" />
            </span>
            <span>
              {sp.get("llegada")}
              <UiText text=" → " />
              {sp.get("salida")}
            </span>
          </div>
          <h3>
            <UiText text="Condiciones de la reserva" />
          </h3>
          <p>
            <UiText text="La reserva queda sujeta a disponibilidad y a las condiciones de la tarifa seleccionada." />
          </p>
          <h3>
            <UiText text="Cancelaciones y modificaciones" />
          </h3>
          <p>
            <UiText text="Las condiciones aplicables a cancelaciones, modificaciones y posibles reembolsos se mostrarán antes de confirmar la reserva." />
          </p>
          <h3>
            <UiText text="No presentación" />
          </h3>
          <p>
            <UiText text="Las condiciones correspondientes se indicarán junto con la tarifa seleccionada." />
          </p>
        </>) : (<>
          <span className="section-kicker">
            <UiText text="VILLA SERENA" />
          </span>
          <h2>
            <UiText text="Política de privacidad" />
          </h2>
          <p>
            <UiText text="Villa Serena utiliza la información proporcionada para gestionar reservas, prestar los servicios solicitados y facilitar la atención durante la estancia." />
          </p>
          <h3>
            <UiText text="Información y uso" />
          </h3>
          <p>
            <UiText text="Podemos solicitar datos de identificación, contacto y reserva para confirmar la estancia, atender solicitudes, gestionar pagos y mantener comunicaciones relacionadas con la reserva." />
          </p>
          <h3>
            <UiText text="Protección de la información" />
          </h3>
          <p>
            <UiText text="Villa Serena procura mantener medidas adecuadas para proteger la información personal y prevenir accesos o usos no autorizados." />
          </p>
          <h3>
            <UiText text="Contacto" />
          </h3>
          <p>
            <UiText text="Villa Serena · Huehuetenango, Guatemala" />
            <br />
            <a href="mailto:villaserenagt@gmail.com">
              <UiText text="villaserenagt@gmail.com" />
            </a>
          </p>
          <a className="legal-more" href="/privacidad">
            <UiText text="Leer política completa" />
          </a>
        </>)}
      </section>
    </div>)}
  </main>);
}
