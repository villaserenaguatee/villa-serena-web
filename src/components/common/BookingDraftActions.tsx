"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePublicLanguage } from './PublicLanguageToggle';
import { bookingReceipt, discardBookingDraft } from '@/lib/bookingDraft';
export default function BookingDraftActions() {
  const query=useSearchParams(),router=useRouter(),{en}=usePublicLanguage();
  const id=query.get('draft');
  const [receipt,setReceipt]=useState<ReturnType<typeof bookingReceipt>>(null);
  useEffect(()=>{setReceipt(bookingReceipt());},[id]);
  function discard(){
    if(!window.confirm(en?'Discard these draft details? An existing booking or payment will not be deleted or cancelled.':'¿Descartar los datos de este borrador? No se eliminará ni cancelará ninguna reserva o pago existente.'))return;
    if(!id){router.replace('/');return;}
    const code=discardBookingDraft(id);const receipt=bookingReceipt();
    router.replace(code?'/reserva/resultado?codigo='+encodeURIComponent(code):receipt?'/reservar/pendiente':'/');
  }
  return <div style={{textAlign:'center',padding:'12px 16px'}}>{receipt&&<p style={{fontSize:13}}><Link href={receipt.code?'/reserva/resultado?codigo='+encodeURIComponent(receipt.code):'/reservar/pendiente'}>{en?'Check previous request':'Consultar solicitud anterior'}</Link></p>}<button type="button" onClick={discard} style={{background:'transparent',border:0,color:'#0D2D52',fontSize:13,padding:8,cursor:'pointer'}}>{en?'Discard draft':'Descartar borrador'}</button></div>;
}
