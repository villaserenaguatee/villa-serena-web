'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getInvoice, type Invoice } from '@/lib/api/cuenta';
import { quetzales, dateInGuatemala } from './AccountConnected';

export default function InvoiceConnected({ id }: { id: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [format, setFormat] = useState<'ticket' | 'letter'>('ticket');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setInvoice(null); setError('');
    getInvoice(id, controller.signal).then(value => { if (!controller.signal.aborted) setInvoice(value); })
      .catch(cause => { if (!controller.signal.aborted) setError(cause.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  return <main className="mx-auto max-w-4xl space-y-5 p-4 text-[#18345C] sm:p-6">
    <Link href={invoice ? `/panel/recepcion/reservas/${invoice.codigoReserva}/cuenta` : "/recepcion"} className="underline">{invoice ? "Volver a la cuenta" : "Volver a Recepción"}</Link>
    <h1 className="text-3xl font-semibold">Factura de demostración</h1>
    {loading ? <p role="status">Cargando factura…</p> : !invoice ? <p role="alert">{error || 'Todavía no existe una factura emitida para esta cuenta.'}</p> : <>
      <div className="flex flex-wrap items-end gap-3">
        <label>Formato de impresión<select aria-label="Formato de impresión" value={format} onChange={event => setFormat(event.target.value as typeof format)} className="mt-1 block rounded-lg border border-slate-300 px-3 py-2">
          <option value="ticket">Ticket de 80 mm</option><option value="letter">Hoja carta</option>
        </select></label>
        <button className="rounded-lg bg-[#18345C] px-4 py-2 font-semibold text-white" onClick={() => window.print()}>Imprimir</button>
      </div>
      <p className="text-sm text-slate-600">Vista de impresión · fecha y hora de Guatemala · imprimir no cambia la factura</p>
      <div className="overflow-x-auto"><InvoicePaper invoice={invoice} format={format} /></div>
      <style>{`
        .invoice-print { display: none; }
        @page { size: ${format === 'ticket' ? '80mm 297mm' : 'letter'}; margin: ${format === 'ticket' ? '4mm' : '12mm'}; }
        @media print {
          html, body { margin: 0 !important; padding: 0 !important; background: white !important; }
          body > * { display: none !important; }
          body > .invoice-print { display: block !important; }
          .invoice-paper { width: ${format === 'ticket' ? '72mm' : '100%'} !important; max-width: 100% !important; margin: 0 !important; padding: 0 !important; border: 0 !important; box-shadow: none !important; color: black !important; font-family: Arial, sans-serif; font-size: ${format === 'ticket' ? '10px' : '12px'} !important; }
          .invoice-paper h2 { font-size: ${format === 'ticket' ? '16px' : '22px'}; }
          .invoice-paper .invoice-line { break-inside: avoid; }
          .invoice-paper * { overflow-wrap: anywhere; }
          .invoice-paper .invoice-money { white-space: nowrap; overflow-wrap: normal; }
        }
      `}</style>
      {createPortal(<div className="invoice-print"><InvoicePaper invoice={invoice} format={format} /></div>, document.body)}
    </>}
  </main>;
}

function InvoicePaper({ invoice, format }: { invoice: Invoice; format: 'ticket' | 'letter' }) {
  return <article aria-label="Factura emitida" className="invoice-paper box-border rounded-lg border border-slate-200 bg-white text-slate-900" style={{
    width: format === 'ticket' ? '80mm' : '100%', maxWidth: '216mm', padding: format === 'ticket' ? '4mm' : '12mm', fontSize: format === 'ticket' ? '12px' : '14px',
  }}>
    <header className="space-y-1 border-b border-slate-300 pb-3">
      <h2 className="text-xl font-bold">{invoice.hotel.nombreComercial}</h2>
      <p>{invoice.hotel.razonSocial}</p><p>{invoice.hotel.direccionFiscal}</p><p>NIT del hotel: {invoice.hotel.nit}</p><p>{invoice.hotel.correo}</p><p>{invoice.hotel.telefono}</p>
      <p className="font-semibold">Serie {invoice.serie} · Número {String(invoice.numero).padStart(6, '0')}</p>
      <p>{dateInGuatemala(invoice.emitidaEn)}</p>
    </header>
    <section className="space-y-1 border-b border-slate-300 py-3">
      <p>Reserva: {invoice.codigoReserva}</p><p>Comprador: {invoice.comprador.nombreComprador}</p>
      <p>NIT: {invoice.comprador.nit === 'CF' ? 'CF — Consumidor Final' : invoice.comprador.nit}</p>
    </section>
    <section className="space-y-2 border-b border-slate-300 py-3" aria-label="Cargos facturados">
      <h3 className="font-bold">Cargos</h3>
      {invoice.cargos.map((charge, index) => <div key={index} className="invoice-line flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1"><p>{charge.concepto}</p><p className="text-slate-600">{charge.cantidad} × {quetzales(charge.precioUnitario * 100)}</p></div>
        <span className="invoice-money shrink-0 tabular-nums">{quetzales(charge.monto * 100)}</span>
      </div>)}
      <div className="invoice-line flex justify-between gap-2 pt-2 font-bold"><p>Total · IVA incluido</p><p className="invoice-money shrink-0 tabular-nums">{quetzales(invoice.total * 100)}</p></div>
    </section>
    <section className="space-y-2 py-3" aria-label="Pagos facturados">
      <h3 className="font-bold">Pagos aprobados</h3>
      {invoice.pagos.map((payment, index) => <div key={index} className="invoice-line flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1"><p>{payment.metodo}</p></div>
        <span className="invoice-money shrink-0 tabular-nums">{quetzales(payment.monto * 100)}</span>
      </div>)}
    </section>
    <p className="border-t border-slate-300 pt-3 text-center font-semibold">Factura de demostración — no válida ante la SAT</p>
  </article>;
}
