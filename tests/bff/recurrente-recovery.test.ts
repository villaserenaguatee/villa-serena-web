import test from 'node:test';
import assert from 'node:assert/strict';
import {GET} from '@/app/api/publico/[...ruta]/route';
import {recoverPublicBookingAttempt} from '@/lib/publicBookingPayment';
import {activeBookingDraft,bookingReceipt} from '@/lib/bookingDraft';
const id='a853efb0-13b3-4012-aa10-fb81d2ea609b',key='original-attempt-1234',proof='a'.repeat(43);
const state={codigo:'VS-ABC123',estadoReserva:'PENDIENTE_PAGO',estadoPago:null,puedeReintentar:false,estadoCheckout:'SIN_CHECKOUT',accionPago:'INICIAR',urlPago:null,expiraEn:null,pagoVenceEn:'2026-11-20T10:00:00Z'};
test('recovery BFF forwards original identity and HttpOnly proof, GET only; rejects absent or mismatched proof',async()=>{
 const original=fetch,mode=process.env.VILLA_SERENA_BFF_MODE,url=process.env.API_URL;process.env.VILLA_SERENA_BFF_MODE='api';process.env.API_URL='https://api.example.test';let calls=0;
 globalThis.fetch=async(input,init)=>{calls++;assert.equal(new URL(String(input)).pathname,'/api/v1/publico/reservas/intento');assert.equal(new URL(String(input)).search,'?origen=OFERTA');assert.equal(init?.method,undefined);const h=new Headers(init?.headers);assert.equal(h.get('Idempotency-Key'),key);assert.equal(h.get('X-Booking-Draft'),id);assert.equal(h.get('X-Booking-Email-Verification'),proof);return Response.json(state);};
 try{const request=(cookie:string,site='same-origin')=>new Request('http://localhost:3083/api/publico/reservas/intento?origen=OFERTA&correo=excluded',{headers:{'Idempotency-Key':key,'X-Booking-Draft':id,Cookie:cookie,'Sec-Fetch-Site':site}});const r=await GET(request('vs_booking_email='+id+'.'+proof));assert.equal(r.status,200);assert.deepEqual(await r.json(),state);assert.equal((await GET(request(''))).status,403);assert.equal((await GET(request('vs_booking_email=wrong.'+proof))).status,403);assert.equal((await GET(request('vs_booking_email='+id+'.'+proof,'cross-site'))).status,403);assert.equal(calls,1);
 }finally{globalThis.fetch=original;for(const [k,v]of Object.entries({VILLA_SERENA_BFF_MODE:mode,API_URL:url})){if(v===undefined)delete process.env[k];else process.env[k]=v;}}
});
for(const status of [200,404,409,502])test('original attempt recovery '+status+' never repeats creation or payment',async()=>{
 const original=fetch,descriptor=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');const storage=new Map<string,string>();Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)}});storage.set('vs-public-booking-draft',JSON.stringify({id,createdAt:Date.now(),params:'slug=habitacion-estandar',attempt:{id:key,flow:'recurrente',origin:'OFERTA',fingerprint:'a'.repeat(64)}}));let calls=0;
 globalThis.fetch=async(input,init)=>{calls++;assert.equal(String(input),'/api/publico/reservas/intento?origen=OFERTA');assert.notEqual(init?.method,'POST');return Response.json(status===200?state:{codigo:status===409?'SOLICITUD_EN_PROCESO':'NO_ENCONTRADO'},{status,headers:{'X-Villa-Serena-Mode':'spring'}});};
 try{if(status===200){const a=recoverPublicBookingAttempt(id),b=recoverPublicBookingAttempt(id);assert.equal(a,b);assert.equal(await a,'/reserva/resultado?codigo=VS-ABC123');assert.equal(activeBookingDraft()?.attempt?.code,'VS-ABC123');}else{await assert.rejects(recoverPublicBookingAttempt(id));assert.equal(activeBookingDraft()?.attempt?.id,key);}assert.equal(calls,1);
 // Retiring PII keeps only original identifiers and origin, without losing duplicate protection.
 if(status===200){const d=JSON.parse(storage.get('vs-public-booking-draft')!);d.updatedAt=Date.now()-7200000;storage.set('vs-public-booking-draft',JSON.stringify(d));assert.equal(activeBookingDraft(),null);assert.equal(bookingReceipt()?.origin,'OFERTA');}
 }finally{globalThis.fetch=original;if(descriptor)Object.defineProperty(globalThis,'sessionStorage',descriptor);else Reflect.deleteProperty(globalThis,'sessionStorage');}
});
