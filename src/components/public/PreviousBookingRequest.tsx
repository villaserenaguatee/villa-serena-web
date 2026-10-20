'use client';
import {useEffect,useRef,useState} from 'react';
import {useRouter} from 'next/navigation';
import {activeBookingDraft,bookingReceipt} from '@/lib/bookingDraft';
import {recoverPublicBookingAttempt} from '@/lib/publicBookingPayment';
export default function PreviousBookingRequest(){
 const [pending,setPending]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');const lock=useRef(false),router=useRouter();
 useEffect(()=>{setPending(Boolean(activeBookingDraft()?.attempt||bookingReceipt()));},[]);
 if(!pending)return null;
 return <div className="mx-auto max-w-3xl px-4 py-3 text-[#18345C]"><p>Hay una solicitud anterior. Consulta su estado antes de reservar o pagar otra vez.</p><button className="reserve-secondary mt-2" disabled={busy} onClick={async()=>{if(lock.current)return;lock.current=true;setBusy(true);setError('');try{router.push(await recoverPublicBookingAttempt());}catch(e){setError(e instanceof Error?e.message:'No se pudo consultar la solicitud.');}finally{lock.current=false;setBusy(false);}}}>{busy?'Consultando...':'Consultar solicitud anterior'}</button>{error&&<p role="alert">{error}</p>}</div>;
}
