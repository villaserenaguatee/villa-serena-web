"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
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

  useEffect(() => {
    const controller = new AbortController();
    const deadline = Date.now() + 60000;

    let timer: ReturnType<typeof setTimeout> | undefined;

    setResult(null);
    setView(null);
    setError('');

    async function check() {
      try {
        const value = await getPublicStatus(code, controller.signal);

        const next = paymentView(
          value,
          code,
          Date.now() >= deadline
        );

        if (controller.signal.aborted) return;

        setResult(value);
        setView(next);

        if (next === 'processing') {
          timer = setTimeout(
            check,
            Math.min(
              3000,
              Math.max(0, deadline - Date.now())
            )
          );
        }
      } catch (e) {
        if (!controller.signal.aborted) {
          setError(
            e instanceof Error
              ? e.message
              : 'No se pudo consultar el estado.'
          );
        }
      }
    }

    void check();

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [code, reload]);

  async function retry() {
    if (busy) return;

    setBusy(true);
    setError('');

    try {
      const latest = await getPublicStatus(code);

      const next = paymentView(latest, code, true);

      setResult(latest);
      setView(next);

      if (
        latest.estadoReserva !== 'PENDIENTE_PAGO' ||
        !latest.puedeReintentar
      ) {
        return;
      }

      const payment = await startPublicPayment(code);

      const target = new URL(
        payment.urlPago,
        window.location.origin
      );

      if (
        target.origin !== window.location.origin ||
        target.pathname !== '/reserva/resultado' ||
        target.searchParams.get('codigo') !== code
      ) {
        throw new Error(
          'La redirección real a Stripe está pendiente de validación.'
        );
      }

      window.location.assign(target.href);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : 'No se pudo reintentar el pago.'
      );
    } finally {
      setBusy(false);
    }
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

  if (view === 'confirmed' && result) return (
    <main className="reserve-public reserve-center public-payment-status confirmed-payment-result">
      <VillaSerenaLogo />
      <section className="reserve-form-card reserve-success" aria-live="polite">
        <Check className="confirmed-payment-icon" size={38} aria-hidden="true" />
        <h1>{title}</h1>
        <p>{en ? 'View your booking details and manage your stay.' : 'Consulta los detalles de tu reserva y gestiona tu estancia.'}</p>
        <div className="confirmed-payment-summary">
          <div><span>{en ? 'Booking' : 'Reserva'}</span><b>{en ? 'Confirmed' : 'Confirmada'}</b></div>
          <div><span>{en ? 'Payment' : 'Pago'}</span><b>{en ? 'Approved' : 'Aprobado'}</b></div>
          <div><span>{en ? 'Code' : 'Código'}</span><b>{result.codigo}</b></div>
        </div>
        <div className="payment-status-actions"><Link className="reserve-primary" href={`/reserva/detalle?codigo=${encodeURIComponent(result.codigo)}`}>{en ? 'View my booking' : 'Ver mi reserva'}</Link></div>
        <Link className="confirmed-payment-home" href="/">{en ? 'Return home' : 'Volver al inicio'}</Link>
      </section>
    </main>
  );

  return (
    <main className="reserve-public reserve-center public-payment-status">
      <VillaSerenaLogo />

      <section
        className="reserve-form-card reserve-success"
        aria-live="polite"
      >
        {view !== 'confirmed' && <span className="reserve-kicker">
          {en ? 'TEST PAYMENT' : 'PAGO DE PRUEBA'}
        </span>}

        <h1>{title}</h1>

        {view !== 'confirmed' && <p>
          {en
            ? 'This is a simulation. No charge was made. The real Stripe redirect and payment confirmation are pending.'
            : 'Esta es una simulación. No se realizó ningún cobro. La redirección real a Stripe y la confirmación después del pago están pendientes.'}
        </p>}

        {view === 'confirmed' && (
          <p>
            {en
              ? 'View your booking details and manage your stay.'
              : 'Consulta los detalles de tu reserva y gestiona tu estancia.'}
          </p>
        )}

        {view === 'processing' && (
          <p>
            {en
              ? 'Please wait. We check the status every 3 seconds for up to one minute.'
              : 'Espera un momento. Consultamos el estado cada 3 segundos durante un máximo de un minuto.'}
          </p>
        )}

        {view === 'incomplete' && (
          <p>
            {result?.estadoReserva === 'CANCELADA'
              ? en
                ? 'The 30-minute payment window expired. Make a new booking.'
                : 'Venció el plazo de 30 minutos para pagar. Realiza una nueva reserva.'
              : en
                ? 'Payment has not been confirmed. You can check again or retry by card while the booking remains pending.'
                : 'No se ha confirmado el pago. Puedes consultar otra vez o reintentar con tarjeta mientras la reserva siga pendiente.'}
          </p>
        )}

        {result && (
          <div className="account-info">
            <span>
              {en ? 'Booking' : 'Reserva'}

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
            </span>

            <span>
              {en ? 'Payment' : 'Pago'}

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
                        ? 'Expired'
                        : 'Vencido'
                      : en
                        ? 'Not started'
                        : 'Sin iniciar'}
              </b>
            </span>
          </div>
        )}

        <strong className="reserve-code">{code}</strong>

        {error && <p role="alert">{error}</p>}

        <div className="payment-status-actions">
          {view === 'confirmed' && <Link className="reserve-primary" href={`/reserva/detalle?codigo=${encodeURIComponent(code)}`}>{en ? 'View my booking' : 'Ver mi reserva'}</Link>}
          {result?.estadoReserva === 'PENDIENTE_PAGO' &&
            result.puedeReintentar && (
              <button
                className="reserve-primary"
                disabled={busy}
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
            )}

          <button
            className="reserve-secondary"
            disabled={busy}
            onClick={() => setReload(n => n + 1)}
          >
            {en
              ? 'Check status again'
              : 'Consultar estado otra vez'}
          </button>

          <Link className="reserve-primary" href="/">
            {en ? 'Return home' : 'Volver al inicio'}
          </Link>
        </div>
      </section>
    </main>
  );
}
