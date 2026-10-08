"use client";
import { UiText, useUiText } from "@/i18n/UiText";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LockKeyhole, X } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";
import { money } from "@/data/publicRooms";
import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { prepareStripeBooking } from "@/lib/publicStripeBooking";
import { useBookingDraft, readBookingDraft } from "@/lib/bookingDraft";
export default function Pago() {
  const { rooms: publicRooms } = usePublicCatalog();
  const ui = useUiText();
  const bookingText = useTranslations("publicBooking");
  const { en } = usePublicLanguage();
  const r = useRouter(), query = useSearchParams();
  const draft = useBookingDraft(query.toString());
  const sp = draft ?? new URLSearchParams(query.toString());
  const busy = useRef(false);
  const [canRecover, setCanRecover] = useState(false);
  const [saving, setSaving] = useState(false),
    [accepted, setAccepted] = useState(false),
    [legal, setLegal] = useState<'terms' | 'privacy' | null>(null),
    [paymentError, setPaymentError] = useState("");
  const room = publicRooms.find((x) => x.name === (sp.get("habitacion") || ""));
  const quoteResult = usePublicQuotes(sp.get("llegada") || "", sp.get("salida") || "", Number(sp.get("adultos") || sp.get("huespedes") || 1), Number(sp.get("ninos") || 0), room?.capacity ?? 0);
  const quote = quoteResult.quotes.find(q => q.tipoHabitacion.id === room?.apiTypeId);
  const total = quote?.total ?? 0;
  const nights = useMemo(() => {
    const a = sp.get("llegada"), b = sp.get("salida");
    if (!a || !b)
      return 1;
    return Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
  },
    [sp]);
  const canPay = accepted && Boolean(draft) && Boolean(quote) && !canRecover;
  useEffect(() => {
    const attempt = readBookingDraft(query.get("draft") || "")?.attempt;
    setCanRecover(Boolean(attempt));
  }, [draft, query]);
  async function recoverPrevious() {
    if (!accepted || busy.current) return;
    busy.current = true; setSaving(true); setPaymentError("");
    try {
      r.push(await prepareStripeBooking(sp, query.get("draft") || "", true));
    }
    catch (error) { setPaymentError(error instanceof Error ? error.message : bookingText("saveFailed")); }
    finally { busy.current = false; setSaving(false); }
  }
  async function finish() {
    if (!canPay || busy.current)
      return;
    busy.current = true;
    setSaving(true);
    setPaymentError("");
    try {
      r.push(await prepareStripeBooking(sp, query.get("draft") || ""));
    }
    catch (error) {
      setCanRecover(Boolean(readBookingDraft(query.get("draft") || "")?.attempt));
      setPaymentError(
        error instanceof Error ? error.message : bookingText("saveFailed"),
      );
    }
    finally {
      busy.current = false;
      setSaving(false);
    }
  }
  return (<main className="reserve-public booking-checkout payment-page">
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
        <div className="summary-total">
          <span>
            {en ? "Total to pay" : "Total a pagar"}
          </span>
          <b>
            {money(total)}
          </b>
        </div>
      </aside>
      <section className="reserve-form-card reserve-form-wide checkout-form">
        <span className="reserve-kicker">{en ? "Last step" : "Último paso"}</span>
        <h1>
          {en ? "Card payment" : "Pago con tarjeta"}
        </h1>
        <p>
          {en ? "Continue to Stripe to enter your card and complete payment." : "Continúa a Stripe para ingresar tu tarjeta y completar el pago"}
        </p>
        <p className="payment-processor"><LockKeyhole size={16} aria-hidden="true" /><span>{en ? "Payment processed by Stripe" : "Pago procesado por Stripe"}</span></p>
        {!draft && <p role="alert">{en ? "Your details are unavailable or expired. Return to the guest form." : "Tus datos no están disponibles o vencieron. Vuelve al formulario de huésped."}</p>}
        {quoteResult.error && !canRecover && <p role="alert">{quoteResult.error}</p>}
        {quoteResult.loading && <p role="status">{en ? "Checking price..." : "Consultando precio..."}</p>}
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
        {canRecover && <button className="reserve-secondary" disabled={!accepted || saving} onClick={recoverPrevious}>
          {en ? "Recover previous attempt" : "Recuperar intento anterior"}
        </button>}
        <button className="reserve-primary" disabled={!canPay || saving} onClick={finish}>
          {saving ? (en ? "Processing..." : "Procesando...") : (en ? "Continue payment →" : "Continuar pago →")}
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
