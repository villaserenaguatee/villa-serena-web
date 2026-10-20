"use client";
import { useEffect } from 'react';
import { activeBookingDraft, bookingReceipt } from '@/lib/bookingDraft';
export default function BookingDraftLifecycle() {
  useEffect(()=>{const clean=()=>{const before=sessionStorage.getItem('vs-public-booking-draft');const active=activeBookingDraft();if(before&&!active&&!sessionStorage.getItem('vs-public-booking-draft')&&location.pathname.startsWith('/reservar/')){const receipt=bookingReceipt();location.replace(receipt?.code?'/reserva/resultado?codigo='+encodeURIComponent(receipt.code):receipt?'/reservar/pendiente':'/');}};clean();const timer=setInterval(clean,60000);document.addEventListener('visibilitychange',clean);return()=>{clearInterval(timer);document.removeEventListener('visibilitychange',clean);};},[]);
  return null;
}
