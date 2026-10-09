'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { getAccount, getCheckout, addCharge, voidCharge, confirmCheckout, type Account, type CheckoutPreview, type CheckoutInput } from '@/lib/api/cuenta';
import { validGuatemalaNit } from '@/lib/pms/nit';

export const quetzales = (cents: number) => `Q ${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dateInGuatemala = (date: string) => new Intl.DateTimeFormat('es-GT', {
  timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(date));
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2';
const buttonClass = 'rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';

export default function AccountConnected({ code }: { code: string }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [voiding, setVoiding] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [checkout, setCheckout] = useState(false);
  const [preview, setPreview] = useState<CheckoutPreview | null>(null);
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    setAccount(null); setError(''); setPreview(null); setInvoiceId(null); setCheckout(false);
    getAccount(code, controller.signal).then(value => { if (!controller.signal.aborted) setAccount(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [code]);
  async function update(action: () => Promise<unknown>) {
    if (locked.current) return false;
    locked.current = true; setBusy(true); setError('');
    try {
      await action();
      setAccount(await getAccount(code));
      return true;
    } catch (cause) {
      setError(`${cause instanceof Error ? cause.message : 'No se pudo completar la operación.'} Consulta el estado antes de volver a intentarlo.`);
      return false;
    } finally { locked.current = false; setBusy(false); }
  }
  async function openCheckout() {
    await update(async () => {
      const value = await getCheckout(code);
      // El saldo y los bloqueos se consultan de nuevo al abrir el diálogo.
      setPreview(value); setCheckout(true);
    });
  }
  if (!account) return <main className="p-6"><p role={error ? 'alert' : 'status'}>{error || 'Cargando cuenta…'}</p><button onClick={() => window.location.reload()} className={buttonClass}>Consultar de nuevo</button></main>;
  const totals = { charges: account.totalCargosVigentes * 100, payments: account.totalPagosAprobados * 100, balance: account.saldo * 100 };
  const blocked = account.estadoCuenta !== 'ABIERTA' || account.estadoReserva !== 'EN_ESTADIA' ? 'El check-out requiere una reserva en estadía y una cuenta abierta.' : null;
  const issuedId = invoiceId ?? account.facturaId;
  return <main className="mx-auto max-w-4xl space-y-5 p-4 text-[#18345C] sm:p-6">
    <Link href="/recepcion" className="underline">Volver a Recepción</Link>
    <header>
      <h1 className="text-3xl font-semibold">Cuenta de {account.codigoReserva}</h1>
      <p>{account.nombreHuesped} · {account.estadoReserva} · Cuenta {account.estadoCuenta.toLowerCase()}</p>
    </header>
    <button disabled={busy} className={buttonClass} onClick={() => void update(async () => { setCheckout(false); setPreview(null); })}>Consultar estado otra vez</button>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    <fieldset disabled={busy} aria-labelledby="charges-title" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 id="charges-title" className="mb-3 text-xl font-semibold">Cargos</h2>
      {account.detalleNoches.length > 0 && <details className="mb-3"><summary>Detalle por noche</summary>{account.detalleNoches.map(night => <p key={night.fecha}>{night.fecha} · {quetzales(night.precio * 100)}{night.temporada ? ` · ${night.temporada}` : ''}</p>)}</details>}
      <ul className="divide-y divide-slate-200">
        {account.cargos.map(charge => <li key={charge.id} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={charge.estado === 'ANULADO' ? 'line-through text-slate-500' : 'font-semibold'}>{charge.concepto}</p>
              <p className="text-sm text-slate-600">{charge.cantidad} × {quetzales(charge.precioUnitario * 100)}</p>
            </div>
            <span className={`shrink-0 tabular-nums ${charge.estado === 'ANULADO' ? 'line-through text-slate-500' : 'font-semibold'}`}>{quetzales(charge.monto * 100)}</span>
          </div>
          <p className="text-xs text-slate-600">{dateInGuatemala(charge.fechaHora)} · {charge.responsable}</p>
          {charge.estado === 'ANULADO' ? <p className="mt-1 text-sm text-slate-600">Anulado: {charge.motivoAnulacion} · {charge.anuladoPor}</p> : account.estadoCuenta === 'ABIERTA' && charge.tipo !== 'ALOJAMIENTO' &&
            <button type="button" className="mt-2 text-sm text-red-800 underline" aria-label={`Anular ${charge.concepto}`} onClick={() => { setVoiding(charge.id); setReason(''); setError(''); }}>Anular</button>}
          {voiding === charge.id && <form className="mt-2 space-y-2" onSubmit={async event => {
            event.preventDefault();
            if (await update(() => voidCharge(code, charge.id, reason))) setVoiding(null);
          }}>
            <label className="block">Motivo de anulación<input required maxLength={500} value={reason} onChange={event => setReason(event.target.value)} className={inputClass} /></label>
            <button disabled={busy} className={buttonClass}>Confirmar anulación</button>{' '}
            <button type="button" onClick={() => setVoiding(null)} className="underline">Volver</button>
          </form>}
        </li>)}
      </ul>
      {account.estadoCuenta === 'ABIERTA' && account.estadoReserva === 'EN_ESTADIA' && <button className={`mt-3 ${buttonClass}`} onClick={() => setAdding(!adding)}>Agregar cargo</button>}
      {adding && account.estadoCuenta === 'ABIERTA' && <form className="mt-3 grid gap-3 sm:grid-cols-3" onSubmit={async event => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        if (await update(() => addCharge(code, { concepto: String(values.get('concept')), cantidad: Number(values.get('quantity')), precioUnitario: Number(values.get('price')) }))) setAdding(false);
      }}>
        <label>Concepto<select aria-label="Concepto" name="concept" className={inputClass}><option>Restaurante</option><option>Lavandería</option><option>Estacionamiento</option><option>Otro</option></select></label>
        <label>Cantidad<input name="quantity" type="number" min="0.01" step="any" required value={quantity} onChange={event => setQuantity(event.target.value)} className={inputClass} /></label>
        <label>Precio unitario (Q)<input name="price" type="number" min="0.01" step="0.01" required value={price} onChange={event => setPrice(event.target.value)} className={inputClass} /></label>
        <p className="text-sm text-slate-600 sm:col-span-3">Total del cargo: {quetzales(Math.round(Number(quantity) * Math.round(Number(price) * 100)))}</p>
        <button disabled={busy} className={buttonClass}>Guardar cargo</button><button type="button" onClick={() => setAdding(false)} className="underline">Volver</button>
      </form>}
    </fieldset>
    <section aria-labelledby="payments-title" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 id="payments-title" className="text-xl font-semibold">Pagos</h2>
      <ul className="divide-y divide-slate-200">
        {account.pagos.map(payment => <li key={payment.id} className="flex justify-between gap-3 py-3">
          <div><p>{payment.metodo} · {payment.estado.toLowerCase()}</p><p className="text-xs text-slate-600">{dateInGuatemala(payment.fechaHora)}{payment.referencia ? ` · Ref. ${payment.referencia}` : ''}</p></div>
          <span className="shrink-0 tabular-nums">{quetzales(payment.monto * 100)}</span>
        </li>)}
      </ul>
      <p className="text-sm text-slate-600">Solo los pagos aprobados reducen el saldo.</p>
    </section>
    <dl className="space-y-2 rounded-xl bg-[#18345C] p-4 text-white">
      <div className="flex justify-between"><dt>Cargos vigentes</dt><dd>{quetzales(totals.charges)}</dd></div>
      <div className="flex justify-between"><dt>Pagos aprobados</dt><dd>{quetzales(totals.payments)}</dd></div>
      <div className="flex justify-between text-xl font-semibold"><dt>Saldo pendiente</dt><dd data-testid="account-balance">{quetzales(totals.balance)}</dd></div>
    </dl>
    {issuedId ? <section className="rounded-xl border border-green-300 bg-green-50 p-4">
      <h2 className="text-xl font-semibold">Estancia finalizada</h2>
      <p>La factura emitida está disponible para consultar e imprimir.</p>
      <Link href={`/panel/recepcion/facturas/${issuedId}`} className={`mt-3 inline-block ${buttonClass}`}>Ver factura e imprimir</Link>
    </section> : <>
      {blocked && <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">{blocked}</p>}
      <button disabled={busy || Boolean(blocked)} className={buttonClass} onClick={() => void openCheckout()}>Realizar check-out</button>
    </>}
    {checkout && preview && !issuedId && <CheckoutDialog preview={preview} busy={busy} onClose={() => setCheckout(false)} onConfirm={async input => {
      if (await update(async () => {
        const result = await confirmCheckout(code, input);
        setInvoiceId(result.factura.id);
        setAccount(current => current ? { ...current, estadoReserva: result.estadoReserva, estadoCuenta: result.estadoCuenta, saldo: result.saldo, facturaId: result.factura.id } : current);
        setCheckout(false); setAdding(false); setVoiding(null);
      })) setPreview(null);
    }} error={error} />}
  </main>;
}

function CheckoutDialog({ preview, busy, error, onClose, onConfirm }: {
  preview: CheckoutPreview; busy: boolean; error: string; onClose: () => void;
  onConfirm: (input: CheckoutInput) => Promise<void>;
}) {
  const [cf, setCf] = useState(true);
  const [nit, setNit] = useState('');
  const [buyer, setBuyer] = useState(preview.nombreCompradorSugerido);
  const [method, setMethod] = useState<'EFECTIVO' | 'TARJETA' | 'OTRO'>('EFECTIVO');
  const [reference, setReference] = useState('');
  const balance = preview.saldo * 100;
  const nitInvalid = !cf && !validGuatemalaNit(nit);
  function submit(event: FormEvent) {
    event.preventDefault();
    if (busy || nitInvalid || !buyer.trim() || !preview.puedeConfirmar || preview.pedidoEnCamino || balance < 0) return;
    void onConfirm({ comprador: { nombreComprador: buyer.trim(), nit: cf ? 'CF' : nit.trim().toUpperCase() }, ...(balance > 0 ? { pago: { metodo: method, ...(reference.trim() ? { referencia: reference.trim() } : {}) } } : {}) });
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <form role="dialog" aria-modal="true" aria-labelledby="checkout-title" onSubmit={submit} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-5">
      <h2 id="checkout-title" className="text-2xl font-semibold">Confirmar check-out</h2>
      {(preview.pedidoEnCamino || !preview.puedeConfirmar) && <p role="alert" className="text-red-800">{preview.pedidoEnCamino ? 'Hay un pedido en camino. Espera su entrega antes de realizar el check-out.' : preview.motivosBloqueo.join(' · ') || 'No se puede confirmar el check-out.'}</p>}
      <p>Saldo total: <b>{quetzales(balance)}</b></p>
      {balance > 0 ? <>
        <p>Se registrará un único pago por el saldo completo al confirmar el check-out.</p>
        <label className="block">Método de pago<select aria-label="Método de pago" className={inputClass} value={method} onChange={event => setMethod(event.target.value as typeof method)}><option value="EFECTIVO">Efectivo</option><option value="TARJETA">Tarjeta</option><option value="OTRO">Otro</option></select></label>
        <label className="block">Referencia (opcional)<input maxLength={150} className={inputClass} value={reference} onChange={event => setReference(event.target.value)} /></label>
      </> : <p>El saldo es cero; no se registrará ningún pago adicional.</p>}
      <label className="flex items-center gap-2"><input type="checkbox" checked={cf} onChange={event => setCf(event.target.checked)} />Consumidor Final</label>
      {!cf && <label className="block">NIT<input aria-label="NIT" autoFocus className={inputClass} value={nit} aria-invalid={nitInvalid} aria-describedby={nitInvalid ? 'nit-error' : undefined} onChange={event => setNit(event.target.value)} />{nitInvalid && <span id="nit-error" className="text-sm text-red-800">NIT inválido: revisa su dígito verificador, incluido K.</span>}</label>}
      <label className="block">Nombre del comprador<input required className={inputClass} value={buyer} onChange={event => setBuyer(event.target.value)} /></label>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Al confirmar se cancelarán sin cargo los pedidos nuevos o en preparación y las solicitudes pendientes o en proceso.</p>
      {error && <p role="alert" className="text-red-800">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={busy || nitInvalid || !buyer.trim() || !preview.puedeConfirmar || preview.pedidoEnCamino || balance < 0} className={buttonClass}>Confirmar y emitir factura</button>
        <button type="button" className="underline" onClick={onClose}>Volver a la cuenta</button>
      </div>
    </form>
  </div>;
}
