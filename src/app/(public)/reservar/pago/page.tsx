"use client";
import PreviousBookingRequest from '@/components/public/PreviousBookingRequest';
import BookingTermsContent from '@/components/common/BookingTermsContent';
import PrivacyPolicyContent from '@/components/common/PrivacyPolicyContent';
import BookingSummaryCard from '@/components/public/BookingSummaryCard';
import { UiText, useUiText } from "@/i18n/UiText";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, LockKeyhole, X } from "lucide-react";
import VillaSerenaLogo from "@/components/common/VillaSerenaLogo";
import { usePublicLanguage } from "@/components/common/PublicLanguageToggle";

import { usePublicCatalog, usePublicQuotes } from "@/lib/usePublicCatalog";
import { preparePublicBookingPayment } from "@/lib/publicBookingPayment";
import { useBookingDraft, readBookingDraft, BookingAttemptPendingError } from "@/lib/bookingDraft";
import { bookingEmail } from '@/lib/bookingEmail';
export default function Pago() {
  const { rooms: publicRooms } = usePublicCatalog();
  const ui = useUiText();
  const bookingText = useTranslations("publicBooking");
  const { en } = usePublicLanguage();
  const r = useRouter(), query = useSearchParams();
  const draft = useBookingDraft(query.toString());
  const [draftCheckedFor, setDraftCheckedFor] = useState<string | null>(null);
  useEffect(() => { setDraftCheckedFor(query.toString()); }, [query]);
  const draftChecked = draftCheckedFor === query.toString();
  const sp = draft ?? new URLSearchParams(query.toString());
  const busy = useRef(false);
  const [canRecover, setCanRecover] = useState(false);
  const [reservationCode, setReservationCode] = useState('');
  const [emailVerified, setEmailVerified] = useState(false), [verificationChecked, setVerificationChecked] = useState(false);
  const [saving, setSaving] = useState(false),
    [accepted, setAccepted] = useState(false),
    [legal, setLegal] = useState<'terms' | 'privacy' | null>(null),
    [paymentError, setPaymentError] = useState("");
  const room = publicRooms.find((x) => sp.get("slug") ? x.slug === sp.get("slug") : x.name === (sp.get("habitacion") || ""));
  const quoteResult = usePublicQuotes(sp.get("llegada") || "", sp.get("salida") || "", Number(sp.get("adultos") || sp.get("huespedes") || 1), Number(sp.get("ninos") || 0), room?.capacity ?? 0);
  const quote = quoteResult.quotes.find(q => q.ofertaSlug === room?.slug);
  const total = quote?.total ?? 0;
  const nights = useMemo(() => {
    const a = sp.get("llegada"), b = sp.get("salida");
    if (!a || !b)
      return 1;
    return Math.max(1, Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
  },
    [sp]);
  const canPay = accepted && Boolean(draft) && Boolean(quote) && !canRecover && emailVerified;
  useEffect(() => {
    setEmailVerified(false); setVerificationChecked(false);
    if (!draft) return;
    let active = true;
    bookingEmail('estado', { correo: draft.get('correo') || '', borrador: query.get('draft') || '' }, en).then(result => { if (active) setEmailVerified(result.verificado === true); }).catch(() => { /* Keep creation disabled; offer verification below. */ }).finally(() => { if (active) setVerificationChecked(true); });
    return () => { active = false; };
  }, [draft, query, en]);
  useEffect(() => {
    const attempt = readBookingDraft(query.get("draft") || "")?.attempt;
    setCanRecover(Boolean(attempt));
    setReservationCode(attempt?.code ?? '');
  }, [draft, query]);
  async function recoverPrevious() {
    if (busy.current) return;
    busy.current = true; setSaving(true); setPaymentError("");
    try {
      r.push(await preparePublicBookingPayment(sp, query.get("draft") || "", true));
    }
    catch (error) { setPaymentError(error instanceof Error ? error.message : bookingText("saveFailed")); }
    finally { setReservationCode(readBookingDraft(query.get('draft') || '')?.attempt?.code ?? ''); busy.current = false; setSaving(false); }
  }
  async function finish() {
    if (!canPay || busy.current)
      return;
    busy.current = true;
    setSaving(true);
    setPaymentError("");
    try {
      r.push(await preparePublicBookingPayment(sp, query.get("draft") || ""));
    }
    catch (error) {
      setCanRecover(Boolean(readBookingDraft(query.get("draft") || "")?.attempt));
      setPaymentError(
        error instanceof BookingAttemptPendingError ? bookingText('requestUncertain') : error instanceof Error ? error.message : bookingText("saveFailed"),
      );
    }
    finally {
      setReservationCode(readBookingDraft(query.get('draft') || '')?.attempt?.code ?? '');
      busy.current = false;
      setSaving(false);
    }
  }
  return (<main className="reserve-public booking-checkout payment-page">{!canRecover&&<PreviousBookingRequest/>}
    {draft && verificationChecked && !emailVerified && !reservationCode && <p role="alert" className="mx-auto max-w-3xl p-4">{en ? 'Verify your email before creating this booking.' : 'Verifica tu correo antes de crear esta reserva.'} <a href={'/reservar/verificar?' + query.toString()} className="underline">{en ? 'Verify email' : 'Verificar correo'}</a></p>}
    <header className="reserve-nav">
      <button className="icon-back" onClick={() => r.back()} aria-label={ui("Volver")}>
        <ArrowLeft />
      </button>
      <VillaSerenaLogo />
    </header>
    <div className="checkout-layout">
      <BookingSummaryCard image={room?.image} name={room?.name || sp.get("habitacion") || ""} category={room?.type} arrival={sp.get("llegada") || ""} departure={sp.get("salida") || ""} adults={Number(sp.get("adultos") || sp.get("huespedes") || 1)} childCount={Number(sp.get("ninos") || 0)} nights={nights} nightlyPrice={room?.price} total={total} note={room?.inventoryNote}/>
      <div className="booking-form-column">
      <section data-vs-ui="compact" className="reserve-form-card reserve-form-wide checkout-form">
        <span className="reserve-kicker">{en ? "Last step" : "Último paso"}</span>
        <h1>
          {en ? "Card payment" : "Pago con tarjeta"}
        </h1>
        <p>
          {en ? "Continue to Recurrente to enter your card and complete payment." : "Continúa a Recurrente para ingresar tu tarjeta y completar el pago"}
        </p>
        <p className="payment-processor"><LockKeyhole size={16} aria-hidden="true" /><span>{en ? "Payment processed by Recurrente" : "Pago procesado por Recurrente"}</span></p>
        {draftChecked && !draft && <p className="payment-draft-error" role="alert">{en ? "Your details are unavailable or expired. Return to the guest form." : "Tus datos no están disponibles o vencieron. Vuelve al formulario de huésped."}</p>}
        {quoteResult.error && !canRecover && <p role="alert">{quoteResult.error}</p>}
        {quoteResult.loading && <p role="status">{en ? "Checking price..." : "Consultando precio..."}</p>}
        <section className="payment-cancellation" aria-labelledby="payment-cancellation-title">
          <h2 id="payment-cancellation-title">{en?'Cancellations and refunds':'Cancelaciones y reembolsos'}</h2>
          <p>{en?'To cancel a confirmed booking, contact Reception.':'Para cancelar una reserva confirmada, contacta a Recepción.'}</p>
          <dl>
            <div><dt>{en?'Full refund':'Reembolso total'}</dt><dd>{en?'When Reception cancels at least 48 hours before 3:00 p.m. on your arrival date.':'Cuando Recepción cancela al menos 48 horas antes de las 15:00 del día de llegada.'}</dd></div>
            <div><dt>{en?'No refund':'Sin reembolso'}</dt><dd>{en?'When cancellation takes place less than 48 hours before that time.':'Cuando la cancelación se realiza con menos de 48 horas de anticipación.'}</dd></div>
          </dl>
          <p className="payment-cancellation-note">{en?'Guatemala local time. Sending a request before the deadline does not guarantee a refund.':'Hora de Guatemala. Enviar una solicitud dentro del plazo no garantiza el reembolso.'}</p>
        </section>
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
        {reservationCode && <p role="status">{en ? 'Reservation code' : 'Código de reserva'}: <strong>{reservationCode}</strong></p>}
        {paymentError && <p className="password-error" role="alert">
          {paymentError}
        </p>}
        {canRecover && <button className="reserve-secondary" disabled={saving} onClick={recoverPrevious}>
          {en ? "Recover previous attempt" : "Recuperar intento anterior"}
        </button>}
        <button className="reserve-primary" disabled={!canPay || saving} onClick={finish}>
          {saving ? (en ? "Processing..." : "Procesando...") : (en ? "Continue payment" : "Continuar pago")}
        </button>
      </section>
      </div>
    </div>
    {legal && (<div className="booking-modal-backdrop" onMouseDown={() => setLegal(null)}>
      <section data-vs-ui="compact" data-vs-dialog="compact" data-vs-size="standard" className="legal-modal" onMouseDown={(e) => e.stopPropagation()}>
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
          <BookingTermsContent />
          <a className="legal-more" href="/terminos">{en?"Read full terms":"Leer términos completos"}</a>
        </>) : (<>
          <PrivacyPolicyContent />
          <a className="legal-more" href="/privacidad">
            <UiText text="Leer política completa" />
          </a>
        </>)}
      </section>
    </div>)}

  </main>);
}
