import test from 'node:test';
import assert from 'node:assert/strict';
import {checkoutUrl} from '@/lib/checkoutUrl';
import {preparePublicBookingPayment} from '@/lib/publicBookingPayment';
const destination='https://app.recurrente.com/checkout-session/ch_fixture';
test('hosted checkout accepts only the authorized HTTPS origin/path; demo remains isolated',()=>{
 assert.equal(checkoutUrl(destination,'spring','http://localhost:3000','VS-ABC123'),destination);
 for(const value of ['https://checkout.stripe.com/c/pay/cs_test_old','http://app.recurrente.com/checkout-session/ch_x','//app.recurrente.com/checkout-session/ch_x','https://app.recurrente.com.evil.test/checkout-session/ch_x','https://app.recurrente.com@evil.test/checkout-session/ch_x','https://user:secret@app.recurrente.com/checkout-session/ch_x','https://app.recurrente.com:444/checkout-session/ch_x','https://app.recurrente.com/checkout-session/ch_x?redirect=https://evil.test','https://app.recurrente.com/checkout-session/ch_x#x','https://app.recurrente.com/checkout-session/ch_%2fx','https://app.recurrente.com/checkout-session/ch_x\\evil',' '+destination,'javascript:alert(1)', 'https://app.recurrente.com/checkout-session/ch_x\n'])assert.throws(()=>checkoutUrl(value,'spring','http://localhost:3000','VS-ABC123'),value);
 assert.equal(checkoutUrl('http://localhost:3000/reserva/resultado?codigo=VS-ABC123','demo','http://localhost:3000','VS-ABC123'),'http://localhost:3000/reserva/resultado?codigo=VS-ABC123');
 assert.throws(()=>checkoutUrl(destination,'demo','http://localhost:3000','VS-ABC123'));
});
const params=new URLSearchParams({slug:'habitacion-estandar',tipoHabitacionId:'1',llegada:'2026-11-16',salida:'2026-11-18',adultos:'2',ninos:'0',nombre:'Protocol',apellidos:'Fixture',correo:'protocol@example.test',telefono:'+502 55555555',documento:'0000000000001'});
function fixture(){
 const originals={fetch:globalThis.fetch,sessionStorage:Object.getOwnPropertyDescriptor(globalThis,'sessionStorage'),window:Object.getOwnPropertyDescriptor(globalThis,'window')},storage=new Map<string,string>();
 Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(k:string)=>storage.get(k)??null,setItem:(k:string,v:string)=>storage.set(k,v),removeItem:(k:string)=>storage.delete(k)}});
 Object.defineProperty(globalThis,'window',{configurable:true,value:{location:{origin:'http://localhost:3000'}}});
 const id=crypto.randomUUID();storage.set('vs-public-booking-draft',JSON.stringify({id,createdAt:Date.now(),params:params.toString()}));
 return {id,storage,restore(){globalThis.fetch=originals.fetch;for(const key of ['sessionStorage','window'] as const){const descriptor=originals[key];if(descriptor)Object.defineProperty(globalThis,key,descriptor);else Reflect.deleteProperty(globalThis,key);}}};
}
function response(value:unknown,status=200){return new Response(JSON.stringify(value),{status,headers:{'X-Villa-Serena-Mode':'spring'}});}
test('concurrent continue calls share one creation and one checkout; price comes from server',async()=>{
 const f=fixture(),calls:string[]=[];globalThis.fetch=async(input,init)=>{calls.push(String(input));if(String(input)==='/api/publico/reservas'){const body=JSON.parse(String(init?.body));assert.equal(body.total,undefined);assert.equal(body.precio,undefined);return response({codigo:'VS-ABC123',estado:'PENDIENTE_PAGO',total:840});}return response({urlPago:destination,expiraEn:'2026-11-16T00:00:00Z'});};
 try{const a=preparePublicBookingPayment(params,f.id),b=preparePublicBookingPayment(params,f.id);assert.equal(a,b);assert.deepEqual(await Promise.all([a,b]),[destination,destination]);assert.deepEqual(calls,['/api/publico/reservas','/api/publico/reservas/VS-ABC123/pago']);const d=JSON.parse(f.storage.get('vs-public-booking-draft')!);assert.equal(d.attempt.flow,'recurrente');assert.match(d.attempt.fingerprint,/^[a-f0-9]{64}$/);}finally{f.restore();}
});
for(const kind of ['pending','network','invalid'] as const)test(`known request: ${kind} cannot create another reservation or checkout`,async()=>{
 const f=fixture(),calls:string[]=[];const d=JSON.parse(f.storage.get('vs-public-booking-draft')!);d.attempt={id:crypto.randomUUID(),flow:'recurrente',code:'VS-ABC123',fingerprint:'a'.repeat(64)};f.storage.set('vs-public-booking-draft',JSON.stringify(d));
 globalThis.fetch=async(input)=>{calls.push(String(input));if(kind==='network')throw Error('connection');return response({codigo:kind==='invalid'?'VS-OTHER1':'VS-ABC123',estadoReserva:'PENDIENTE_PAGO',estadoPago:'PENDIENTE',puedeReintentar:true});};
 try{if(kind==='pending')assert.equal(await preparePublicBookingPayment(params,f.id,true),'/reserva/resultado?codigo=VS-ABC123');else await assert.rejects(preparePublicBookingPayment(params,f.id,true));assert.deepEqual(calls,['/api/publico/reservas/VS-ABC123/estado']);}finally{f.restore();}
});
test('legacy Stripe attempt is never converted into a Recurrente request',async()=>{
 const f=fixture();let calls=0;globalThis.fetch=async()=>{calls++;throw Error('unexpected');};
 try{const d=JSON.parse(f.storage.get('vs-public-booking-draft')!);d.attempt={id:crypto.randomUUID(),flow:'stripe',code:'VS-OLD123',fingerprint:'b'.repeat(64)};f.storage.set('vs-public-booking-draft',JSON.stringify(d));assert.equal(await preparePublicBookingPayment(params,f.id,true),'/reserva/resultado?codigo=VS-OLD123');delete d.attempt.code;f.storage.set('vs-public-booking-draft',JSON.stringify(d));await assert.rejects(preparePublicBookingPayment(params,f.id,true),/solicitud anterior/);assert.equal(calls,0);assert.equal(JSON.parse(f.storage.get('vs-public-booking-draft')!).attempt.id,d.attempt.id);}finally{f.restore();}
});
test('verification conflict from provider is not retried automatically',async()=>{
 const f=fixture(),calls:string[]=[];globalThis.fetch=async(input)=>{calls.push(String(input));return String(input).endsWith('/pago')?response({codigo:'PAGO_EN_VERIFICACION',mensaje:'El pago se está verificando.'},409):response({codigo:'VS-ABC123',estado:'PENDIENTE_PAGO',total:840});};
 try{await assert.rejects(preparePublicBookingPayment(params,f.id),/verificando/);assert.equal(calls.length,2);assert.equal(JSON.parse(f.storage.get('vs-public-booking-draft')!).attempt.code,'VS-ABC123');}finally{f.restore();}
});