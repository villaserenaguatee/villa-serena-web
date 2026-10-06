"use client";
import { useEffect, useState } from 'react';
import Link from 'next/link';
import VillaSerenaLogo from '@/components/common/VillaSerenaLogo';
import { usePublicLanguage } from '@/components/common/PublicLanguageToggle';
import { getPublicStatus } from '@/lib/api/public';
import type { PublicStatusDto } from '@/lib/bff/contracts/public';

export default function PublicPaymentStatus({ code }: { code: string }) {
  const { en } = usePublicLanguage();
  const [result, setResult] = useState<PublicStatusDto | null>(null);
  const [error, setError] = useState(''), [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setResult(null); setError('');
    getPublicStatus(code, controller.signal).then(value => {
      if (value.codigo !== code || !['PENDIENTE_PAGO', 'CANCELADA'].includes(value.estadoReserva) || value.estadoPago === 'APROBADO')
        throw new Error('El estado recibido no corresponde a esta simulación.');
      if (!controller.signal.aborted) setResult(value);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [code, reload]);
  return <main className="reserve-public reserve-center public-payment-status"><VillaSerenaLogo />
    <section className="reserve-form-card reserve-success">
      <span className="reserve-kicker">{en ? 'TEST PAYMENT' : 'PAGO DE PRUEBA'}</span>
      <h1>{result ? result.estadoReserva === 'CANCELADA' ? (en ? 'Booking expired' : 'Reserva vencida') : (en ? 'Payment pending' : 'Pago pendiente') : error ? (en ? 'Status unavailable' : 'Estado no disponible') : (en ? 'Checking booking status' : 'Consultando estado de reserva')}</h1>
      <p>{en ? 'This is a simulation. No charge was made. The real Stripe redirect and payment confirmation are pending.' : 'Esta es una simulación. No se realizó ningún cobro. La redirección real a Stripe y la confirmación después del pago están pendientes.'}</p>
      {result && <div className="account-info"><span>{en ? 'Booking' : 'Reserva'}<b>{result.estadoReserva === 'CANCELADA' ? (en ? 'Cancelled' : 'Cancelada') : (en ? 'Pending payment' : 'Pendiente de pago')}</b></span><span>{en ? 'Payment' : 'Pago'}<b>{result.estadoPago === 'PENDIENTE' ? (en ? 'Pending' : 'Pendiente') : result.estadoPago === 'FALLIDO' ? (en ? 'Expired' : 'Vencido') : (en ? 'Not started' : 'Sin iniciar')}</b></span></div>}
      <strong className="reserve-code">{code}</strong>
      {error && <p role="alert">{error}</p>}
      <div className="payment-status-actions">
        <button className="reserve-secondary" onClick={() => setReload(n => n + 1)}>{en ? 'Check status again' : 'Consultar estado otra vez'}</button>
        <Link className="reserve-primary" href="/">{en ? 'Return home' : 'Volver al inicio'}</Link>
      </div>
    </section>
  </main>;
}
