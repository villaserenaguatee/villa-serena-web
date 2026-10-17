'use client';
import Link from 'next/link';
import {useEffect,useState} from 'react';
import {getInvoice,type Invoice} from '@/lib/api/cuenta';
import FacturaDocumento from '@/components/common/FacturaDocumento';
export default function InvoiceConnected({id}:{id:string}){const [invoice,setInvoice]=useState<Invoice|null>(null),[error,setError]=useState('');useEffect(()=>{const c=new AbortController();setInvoice(null);setError('');getInvoice(id,c.signal).then(setInvoice).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[id]);return <main className="mx-auto max-w-4xl space-y-5 p-4 text-[#18345C] sm:p-6"><Link href={invoice?`/panel/recepcion/reservas/${invoice.codigoReserva}/cuenta`:'/recepcion'} className="underline">{invoice?'Volver a la cuenta':'Volver a Recepción'}</Link><h1 className="text-3xl font-semibold">Factura de estancia</h1>{error?<p role="alert" className="text-red-800">{error}</p>:invoice?<><p>Factura {invoice.serie}-{invoice.numero} · Reserva {invoice.codigoReserva}</p><FacturaDocumento endpoint={`/api/facturas/${encodeURIComponent(id)}/pdf`} serie={invoice.serie} numero={invoice.numero}/></>:<p role="status">Cargando factura…</p>}</main>;}
