'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import {
  accountTotals, addDemoCharge, chargeCents, checkoutBlock, confirmDemoCheckout, DEMO_NOW,
  validGuatemalaNit, voidDemoCharge, type DemoAccount,
} from '@/lib/mocks/cuenta';
import { readDemoAccount, saveDemoAccount } from './demoAccountStorage';

export const quetzales = (cents: number) => `Q ${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const dateInGuatemala = (date: string) => new Intl.DateTimeFormat('es-GT', {
  timeZone: 'America/Guatemala', dateStyle: 'medium', timeStyle: 'short',
}).format(new Date(date));
const inputClass = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2';
const buttonClass = 'rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';

export default function AccountDemo() {
  const [account, setAccount] = useState<DemoAccount | null>(null);
  const [error, setError] = useState('');
  const [adding, setAdding] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [voiding, setVoiding] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [checkout, setCheckout] = useState(false);
  useEffect(() => {
    try { setAccount(readDemoAccount()); }
    catch { setError('No se pudo leer la cuenta de demostración guardada en este navegador.'); }
  }, []);
  function update(action: () => DemoAccount) {
    try {
      const next = action();
      saveDemoAccount(next);
      setAccount(next);
      setError('');
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo guardar la operación.');
      return false;
    }
  }
  if (!account) return <main className="p-6"><p role={error ? 'alert' : 'status'}>{error || 'Cargando cuenta…'}</p></main>;
  const totals = accountTotals(account);
  const blocked = checkoutBlock(account);
  return <main className="mx-auto max-w-4xl space-y-5 p-4 text-[#18345C] sm:p-6">
    <Link href="/recepcion" className="underline">Volver a Recepción</Link>
    <header>
      <p className="text-sm text-slate-600">Demostración local · no registra pagos ni cambios en el API</p>
      <p className="text-sm text-slate-600">Hora simulada: {dateInGuatemala(DEMO_NOW)} (Guatemala)</p>
      <h1 className="text-3xl font-semibold">Cuenta de {account.code}</h1>
      <p>{account.guest} · {account.reservation === 'FINALIZADA' ? 'Estancia finalizada' : 'En estadía'} · Cuenta {account.status.toLowerCase()}</p>
    </header>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-red-800">{error}</p>}
    <section aria-labelledby="charges-title" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 id="charges-title" className="mb-3 text-xl font-semibold">Cargos</h2>
      <ul className="divide-y divide-slate-200">
        {account.charges.map(charge => <li key={charge.id} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className={charge.status === 'ANULADO' ? 'line-through text-slate-500' : 'font-semibold'}>{charge.concept}</p>
              <p className="text-sm text-slate-600">{charge.quantity} × {quetzales(charge.unitCents)}</p>
            </div>
            <span className={`shrink-0 tabular-nums ${charge.status === 'ANULADO' ? 'line-through text-slate-500' : 'font-semibold'}`}>{quetzales(chargeCents(charge))}</span>
          </div>
          <p className="text-xs text-slate-600">{dateInGuatemala(charge.date)} · {charge.responsible}</p>
          {charge.status === 'ANULADO' ? <p className="mt-1 text-sm text-slate-600">Anulado: {charge.voidReason} · {charge.voidResponsible}</p> : account.status === 'ABIERTA' && charge.kind === 'ADICIONAL' &&
            <button type="button" className="mt-2 text-sm text-red-800 underline" aria-label={`Anular ${charge.concept}`} onClick={() => { setVoiding(charge.id); setReason(''); setError(''); }}>Anular</button>}
          {voiding === charge.id && <form className="mt-2 space-y-2" onSubmit={event => {
            event.preventDefault();
            if (update(() => voidDemoCharge(account, charge.id, reason))) setVoiding(null);
          }}>
            <label className="block">Motivo de anulación<input required value={reason} onChange={event => setReason(event.target.value)} className={inputClass} /></label>
            <button className={buttonClass}>Confirmar anulación</button>{' '}
            <button type="button" onClick={() => setVoiding(null)} className="underline">Volver</button>
          </form>}
        </li>)}
      </ul>
      {account.status === 'ABIERTA' && account.reservation === 'EN_ESTADIA' && <button className={`mt-3 ${buttonClass}`} onClick={() => setAdding(!adding)}>Agregar cargo</button>}
      {adding && account.status === 'ABIERTA' && <form className="mt-3 grid gap-3 sm:grid-cols-3" onSubmit={event => {
        event.preventDefault();
        const values = new FormData(event.currentTarget);
        if (update(() => addDemoCharge(account, { concept: String(values.get('concept')), quantity: Number(values.get('quantity')), unitCents: Math.round(Number(values.get('price')) * 100) }, crypto.randomUUID(), DEMO_NOW))) setAdding(false);
      }}>
        <label>Concepto<select aria-label="Concepto" name="concept" className={inputClass}><option>Restaurante</option><option>Lavandería</option><option>Estacionamiento</option><option>Otro</option></select></label>
        <label>Cantidad<input name="quantity" type="number" min="0.01" step="any" required value={quantity} onChange={event => setQuantity(event.target.value)} className={inputClass} /></label>
        <label>Precio unitario (Q)<input name="price" type="number" min="0.01" step="0.01" required value={price} onChange={event => setPrice(event.target.value)} className={inputClass} /></label>
        <p className="text-sm text-slate-600 sm:col-span-3">Total del cargo: {quetzales(Math.round(Number(quantity) * Math.round(Number(price) * 100)))}</p>
        <button className={buttonClass}>Guardar cargo</button><button type="button" onClick={() => setAdding(false)} className="underline">Volver</button>
      </form>}
    </section>
    <section aria-labelledby="payments-title" className="rounded-xl border border-slate-200 bg-white p-4">
      <h2 id="payments-title" className="text-xl font-semibold">Pagos</h2>
      <ul className="divide-y divide-slate-200">
        {account.payments.map(payment => <li key={payment.id} className="flex justify-between gap-3 py-3">
          <div><p>{payment.method} · {payment.status.toLowerCase()}</p><p className="text-xs text-slate-600">{dateInGuatemala(payment.date)}{payment.reference ? ` · Ref. ${payment.reference}` : ''}</p></div>
          <span className="shrink-0 tabular-nums">{quetzales(payment.cents)}</span>
        </li>)}
      </ul>
      <p className="text-sm text-slate-600">Solo los pagos aprobados reducen el saldo.</p>
    </section>
    <dl className="space-y-2 rounded-xl bg-[#18345C] p-4 text-white">
      <div className="flex justify-between"><dt>Cargos vigentes</dt><dd>{quetzales(totals.charges)}</dd></div>
      <div className="flex justify-between"><dt>Pagos aprobados</dt><dd>{quetzales(totals.payments)}</dd></div>
      <div className="flex justify-between text-xl font-semibold"><dt>Saldo pendiente</dt><dd data-testid="account-balance">{quetzales(totals.balance)}</dd></div>
    </dl>
    {account.invoice ? <section className="rounded-xl border border-green-300 bg-green-50 p-4">
      <h2 className="text-xl font-semibold">Check-out de demostración completado</h2>
      <p>Cuenta cerrada y estancia finalizada. No se enviaron pagos, PDF ni correos al servidor.</p>
      <Link href={`/panel/recepcion/facturas/${account.invoice.id}`} className={`mt-3 inline-block ${buttonClass}`}>Ver factura e imprimir</Link>
    </section> : <>
      {blocked && <p role="status" className="rounded-lg bg-amber-50 p-3 text-amber-900">{blocked}</p>}
      <button disabled={Boolean(blocked)} className={buttonClass} onClick={() => { setCheckout(true); setError(''); }}>Realizar check-out</button>
    </>}
    {checkout && !account.invoice && <CheckoutDialog account={account} onClose={() => setCheckout(false)} onConfirm={input => {
      if (update(() => confirmDemoCheckout(account, input, DEMO_NOW))) { setCheckout(false); setAdding(false); setVoiding(null); }
    }} error={error} />}
  </main>;
}

function CheckoutDialog({ account, error, onClose, onConfirm }: {
  account: DemoAccount; error: string; onClose: () => void;
  onConfirm: (input: Parameters<typeof confirmDemoCheckout>[1]) => void;
}) {
  const [cf, setCf] = useState(true);
  const [nit, setNit] = useState('');
  const [buyer, setBuyer] = useState(account.guest);
  const [method, setMethod] = useState<'Efectivo' | 'Tarjeta' | 'Otro'>('Efectivo');
  const [reference, setReference] = useState('');
  const balance = accountTotals(account).balance;
  const nitInvalid = !cf && !validGuatemalaNit(nit);
  function submit(event: FormEvent) {
    event.preventDefault();
    onConfirm({ buyer, nit: cf ? 'CF' : nit, ...(balance > 0 ? { method, reference } : {}) });
  }
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
    <form role="dialog" aria-modal="true" aria-labelledby="checkout-title" onSubmit={submit} className="max-h-[90vh] w-full max-w-lg space-y-4 overflow-y-auto rounded-xl bg-white p-5">
      <h2 id="checkout-title" className="text-2xl font-semibold">Confirmar check-out</h2>
      <p>Saldo total: <b>{quetzales(balance)}</b></p>
      {balance > 0 ? <>
        <p>Se registrará un único pago por el saldo completo en esta demostración.</p>
        <label className="block">Método de pago<select aria-label="Método de pago" className={inputClass} value={method} onChange={event => setMethod(event.target.value as typeof method)}><option>Efectivo</option><option>Tarjeta</option><option>Otro</option></select></label>
        <label className="block">Referencia (opcional)<input className={inputClass} value={reference} onChange={event => setReference(event.target.value)} /></label>
      </> : <p>El saldo es cero; no se registrará ningún pago adicional.</p>}
      <label className="flex items-center gap-2"><input type="checkbox" checked={cf} onChange={event => setCf(event.target.checked)} />Consumidor Final</label>
      {!cf && <label className="block">NIT<input aria-label="NIT" autoFocus className={inputClass} value={nit} aria-invalid={nitInvalid} aria-describedby={nitInvalid ? 'nit-error' : undefined} onChange={event => setNit(event.target.value)} />{nitInvalid && <span id="nit-error" className="text-sm text-red-800">NIT inválido: revisa su dígito verificador, incluido K.</span>}</label>}
      <label className="block">Nombre del comprador<input required className={inputClass} value={buyer} onChange={event => setBuyer(event.target.value)} /></label>
      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Al confirmar se cancelarán sin cargo los pedidos nuevos o en preparación y las solicitudes pendientes o en proceso.</p>
      {error && <p role="alert" className="text-red-800">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <button disabled={nitInvalid || !buyer.trim() || Boolean(checkoutBlock(account))} className={buttonClass}>Confirmar y emitir factura</button>
        <button type="button" className="underline" onClick={onClose}>Volver a la cuenta</button>
      </div>
    </form>
  </div>;
}
