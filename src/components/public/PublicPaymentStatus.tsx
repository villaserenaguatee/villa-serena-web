"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Clock3, CircleAlert } from 'lucide-react';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
import { getPublicStatus, startPublicPayment } from '@/lib/api/public';
import { paymentView, type PaymentView } from '@/lib/paymentResult';
import type { PublicStatusDto } from '@/lib/bff/contracts/public';

export default function PublicPaymentStatus({ code }: { code: string }) {
  const { en } = usePublicLanguage();
  const [result, setResult] = useState<PublicStatusDto | null>(null);
  const [view, setView] = useState<PaymentView | null>(null);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
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
    if (busy || consulting) return;
    setBusy(true); setError(''); setFeedback('');
    try {
      const latest = await getPublicStatus(code);
      const next = paymentView(latest, code);
      setResult(latest); setView(next);
      if (latest.estadoReserva !== 'PENDIENTE_PAGO' || !latest.puedeReintentar) return;
      const payment = await startPublicPayment(code);
      const target = new URL(payment.urlPago, window.location.origin);
      if (target.origin !== window.location.origin || target.pathname !== '/reserva/resultado' || target.searchParams.get('codigo') !== code)
        throw new Error('La redirección real a Stripe está pendiente de validación.');
      window.location.assign(target.href);
    } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo reintentar el pago.'); }
    finally { setBusy(false); }
  }

  const title =
  view === 'confirmed'
    ? en
      ? 'Your booking is confirmed'
      : 'Tu reserva está confirmada'
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
      ? 'Check the details of your stay.'
      : 'Consulta los detalles de tu estancia'
    : view === 'processing'
      ? en
        ? 'Your payment is still pending. Check its status in a moment.'
        : 'Tu pago sigue pendiente. Consulta su estado en un momento.'
      : result?.estadoReserva === 'CANCELADA'
        ? en
          ? 'The payment window expired and the booking was cancelled.'
          : 'Venció el plazo para pagar y la reserva fue cancelada.'
        : result?.estadoPago === null
          ? en
            ? 'Payment has not been started. You can retry while the booking is pending.'
            : 'El pago no se ha iniciado. Puedes reintentarlo mientras la reserva siga pendiente.'
          : result?.estadoPago === 'FALLIDO'
            ? en
              ? 'The payment attempt expired. Check its status or retry if available.'
              : 'Venció el intento de pago. Consulta su estado o reintenta si está disponible.'
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

const canRetry =
  result?.estadoReserva === 'PENDIENTE_PAGO' &&
  result.puedeReintentar;

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
          ? 'Retry payment'
          : 'Reintentar pago'}
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

    <section className="reserve-form-card reserve-success" aria-live="polite">
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
                      ? 'Not started'
                      : 'Sin iniciar'}
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
