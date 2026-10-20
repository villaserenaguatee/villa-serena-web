"use client";
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { Check, Clock3, CircleAlert } from 'lucide-react';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
import { getPublicStatus, startPublicPayment } from '@/lib/api/public';
import {paymentAction} from '@/lib/recurrenteStatus';
import { paymentView, type PaymentView } from '@/lib/paymentResult';
import type { PublicStatusDto } from '@/lib/bff/contracts/public';
import { checkoutUrl } from '@/lib/checkoutUrl';
import { completeBookingDraft, activeBookingDraft, bookingReceipt } from '@/lib/bookingDraft';

export default function PublicPaymentStatus({ code }: { code: string }) {
  const { en } = usePublicLanguage();
  const [currentRequest,setCurrentRequest]=useState(false),[legacyRequest,setLegacyRequest]=useState(false);
  const [result, setResult] = useState<PublicStatusDto | null>(null);
  const [view, setView] = useState<PaymentView | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(()=>{const receipt=bookingReceipt();const attempt=activeBookingDraft()?.attempt??(receipt?{code:receipt.code,flow:receipt.flow}:undefined);setCurrentRequest(attempt?.code===code&&attempt.flow==='recurrente');setLegacyRequest(attempt?.code===code&&attempt.flow==='stripe');},[code,reload]);

  const actionLock=useRef(false);
  const [busy, setBusy] = useState(false);
  const [consulting, setConsulting] = useState(false);
  const [feedback, setFeedback] = useState('');
  useEffect(() => { setResult(null); setView(null); }, [code]);

  useEffect(() => {
    const controller = new AbortController();
    const deadline = Date.now() + 60000;
    let timer: ReturnType<typeof setTimeout> | undefined;
    setError(''); setConsulting(true); setFeedback('');
    async function check() {
      try {
        const value = await getPublicStatus(code, controller.signal);
        const next = paymentView(value, code);
        if (controller.signal.aborted) return;
        if(next==='confirmed' || value.estadoReserva==='CANCELADA') completeBookingDraft(code);
        setResult(value); setView(next); setConsulting(false);
        if (reload > 0) setFeedback(en ? 'Status updated.' : 'Estado actualizado.');
        if (next === 'processing' && Date.now() < deadline) {
          timer = setTimeout(check, Math.min(3000, Math.max(0, deadline - Date.now())));
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setConsulting(false);
          setError(e instanceof Error ? e.message : 'No se pudo consultar el estado.');
        }
      }
    }
    void check();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [code, reload, en]);

  async function retry() {
    if (actionLock.current || busy || consulting) return;
    actionLock.current=true;
    setBusy(true); setError(''); setFeedback('');
    try {
      const latest = await getPublicStatus(code);
      const next = paymentView(latest, code);
      setResult(latest); setView(next);
      if (next==='confirmed' || latest.estadoReserva==='CANCELADA') completeBookingDraft(code);
      const attempt=activeBookingDraft()?.attempt;
      if((attempt?.code===code&&attempt.flow==='stripe')||(bookingReceipt()?.code===code&&bookingReceipt()?.flow==='stripe'))throw Error('Consulta con Recepción antes de volver a pagar esta reserva anterior.');
      const action=paymentAction(latest,currentRequest);
      if(action==='CONTINUAR'){window.location.assign(checkoutUrl(latest.urlPago!,latest.mode??'spring',window.location.origin,code));return;}
      if(!['INICIAR','REINTENTAR'].includes(action))return;
      const payment = await startPublicPayment(code);
      window.location.assign(checkoutUrl(payment.urlPago, payment.mode, window.location.origin, code));
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo reintentar el pago.'); }
    finally { actionLock.current=false;setBusy(false); }
  }

  const title =
  view === 'confirmed'
    ? en
      ? 'Your booking is confirmed'
      : 'Tu reserva está confirmada'
    : result?.estadoCheckout==='ABIERTO' ? (en?'Payment pending':'Pago pendiente')
    : view === 'processing'
      ? en
        ? 'Payment processing'
        : 'Pago en proceso'
      : view === 'incomplete'
        ? en
          ? 'Payment not completed'
          : 'Pago no completado'
        : error
          ? en
            ? 'Status unavailable'
            : 'Estado no disponible'
          : en
            ? 'Checking booking status'
            : 'Consultando estado de reserva';

const explanation =
  view === 'confirmed'
    ? en
      ? result?.estadoPago === null ? 'Your booking is confirmed. Payment details are unavailable; contact Reception if needed.' : 'Check the details of your stay.'
      : result?.estadoPago === null ? 'Tu reserva está confirmada. El detalle del pago no está disponible; si lo necesitas, contacta a Recepción.' : 'Consulta los detalles de tu estancia'
    : result?.estadoCheckout==='ABIERTO' ? (en?'You can continue on the existing payment page.':'Puedes continuar en la página de pago existente.')
    : view === 'processing'
      ? en
        ? 'Your payment is still pending. Check its status in a moment.'
        : 'Tu pago sigue pendiente. Consulta su estado en un momento.'
      : result?.estadoReserva === 'CANCELADA'
        ? en
          ? 'This booking has been cancelled. You cannot continue its payment.'
          : 'Esta reserva está cancelada. No puedes continuar su pago.'
        : result?.estadoPago === null
          ? en
            ? 'We do not have payment confirmation yet. Check the status before paying again.'
            : 'Todavía no tenemos una confirmación de pago. Consulta el estado antes de volver a pagar.'
          : result?.estadoPago === 'FALLIDO'
            ? en
              ? 'The payment attempt was not completed. Check its status or retry if available.'
              : 'El intento de pago no se completó. Consulta su estado o reintenta si está disponible.'
            : view === 'incomplete'
              ? en
                ? 'Payment was not completed. Check its status or retry if available.'
                : 'El pago no se completó. Consulta su estado o reintenta si está disponible.'
              : '';

const Icon =
  view === 'confirmed'
    ? Check
    : view === 'processing'
      ? Clock3
      : CircleAlert;

let action:ReturnType<typeof paymentAction>='NINGUNA';
try{if(result)action=paymentAction(result,currentRequest);}catch{/* Invalid responses never authorize a payment. */}
const canRetry = result?.estadoReserva==='PENDIENTE_PAGO'&&!error&&!legacyRequest&&['CONTINUAR','INICIAR','REINTENTAR'].includes(action);

const retryButton =
  canRetry && (
    <button
      className={view === 'processing' ? 'reserve-secondary' : 'reserve-primary'}
      disabled={busy || consulting}
      onClick={retry}
    >
      {busy
        ? en
          ? 'Checking…'
          : 'Consultando…'
        : en
          ? action==='CONTINUAR'?'Continue payment':action==='INICIAR'?'Start payment':'Retry payment'
          : action==='CONTINUAR'?'Continuar pago':action==='INICIAR'?'Iniciar pago':'Reintentar pago'}
    </button>
  );

const consultButton = (
  <button
    className={view === 'processing' ? 'reserve-primary' : 'reserve-secondary'}
    disabled={busy || consulting}
    onClick={() => {
      setConsulting(true);
      setReload(n => n + 1);
    }}
  >
    {consulting
      ? en
        ? 'Checking…'
        : 'Consultando…'
      : en
        ? 'Check status'
        : 'Consultar estado'}
  </button>
);

return (
  <main className="reserve-public reserve-center public-payment-status compact-payment-result">
    <VillaSerenaLogo />

    <section data-vs-ui="compact" className="reserve-form-card reserve-success" aria-live="polite">
      {view && (
        <Icon
          className="payment-result-icon"
          size={38}
          strokeWidth={1.7}
          aria-hidden="true"
        />
      )}

      <h1>{title}</h1>

      {explanation && <p>{explanation}</p>}

      {result && (
        <div className="payment-result-summary">
          <div>
            <span>{en ? 'Booking' : 'Reserva'}</span>
            <b>
              {result.estadoReserva === 'CONFIRMADA'
                ? en
                  ? 'Confirmed'
                  : 'Confirmada'
                : result.estadoReserva === 'CANCELADA'
                  ? en
                    ? 'Cancelled'
                    : 'Cancelada'
                  : en
                    ? 'Pending payment'
                    : 'Pendiente de pago'}
            </b>
          </div>

          <div>
            <span>{en ? 'Payment' : 'Pago'}</span>
            <b>
              {result.estadoPago === 'APROBADO'
                ? en
                  ? 'Approved'
                  : 'Aprobado'
                : result.estadoPago === 'PENDIENTE'
                  ? en
                    ? 'Pending'
                    : 'Pendiente'
                  : result.estadoPago === 'FALLIDO'
                    ? en
                      ? 'Failed'
                      : 'Fallido'
                    : en
                      ? 'Unavailable'
                      : 'No disponible'}
            </b>
          </div>

          <div>
            <span>{en ? 'Booking code' : 'Código de reserva'}</span>
            <b>{result.codigo}</b>
          </div>
        </div>
      )}

      {error && <p role="alert">{error}</p>}

      {(consulting || feedback) && (
        <p role="status">
          {consulting
            ? en
              ? 'Checking…'
              : 'Consultando…'
            : feedback}
        </p>
      )}

      {view === 'confirmed' && result && (
        <div className="payment-status-actions">
          <Link
            className="reserve-primary"
            href={`/reserva/detalle?codigo=${encodeURIComponent(result.codigo)}`}
          >
            {en ? 'View my booking' : 'Ver mi reserva'}
          </Link>
        </div>
      )}

      {view !== 'confirmed' && (
        <div className="payment-status-actions">
          {result?.estadoReserva === 'CANCELADA' ? (
            <Link className="reserve-primary" href="/catalogo">
              {en ? 'Make a new booking' : 'Hacer nueva reserva'}
            </Link>
          ) : view === 'processing' ? (
            <>
              {consultButton}
              {retryButton}
            </>
          ) : (
            <>
              {retryButton}
              {consultButton}
            </>
          )}
        </div>
      )}

      <Link className="payment-home-link" href="/">
        {en ? 'Return home' : 'Volver al inicio'}
      </Link>
    </section>
  </main>
);
}
