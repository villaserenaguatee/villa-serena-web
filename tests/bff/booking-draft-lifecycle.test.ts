import { test } from 'node:test';
import assert from 'node:assert/strict';
import { activeBookingDraft, saveBookingDraft, readBookingDraft, bookingAttempt, finishBookingAttempt, discardBookingDraft, completeBookingDraft, bookingReceipt } from '@/lib/bookingDraft';

test('draft lifecycle removes only identified draft PII, retaining minimal uncertain-request protection',async()=>{
  const old=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage'),clock=Date.now,values=new Map<string,string>();let now=clock();
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v),removeItem:(k:string)=>values.delete(k)}});Date.now=()=>now;
  try{
    values.set('unrelated','keep');
    const params=new URLSearchParams({nombre:'PRIVATE NAME',correo:'private@example.test',documento:'0000000000123',slug:'habitacion-estandar'});
    let id=saveBookingDraft(params).get('draft')!;
    assert.equal(discardBookingDraft('another-id'),undefined);assert.ok(readBookingDraft(id));
    discardBookingDraft(id);assert.equal(activeBookingDraft(),null);assert.throws(()=>saveBookingDraft(params,id));assert.equal(values.get('unrelated'),'keep');assert.equal(bookingReceipt(),null);
    id=saveBookingDraft(params).get('draft')!;
    const fingerprint=JSON.stringify({flow:'stripe',input:{privateData:'PRIVATE NAME'}});
    const [a,b]=await Promise.all([bookingAttempt(id,fingerprint),bookingAttempt(id,fingerprint)]);assert.equal(a,b);
    assert.match(readBookingDraft(id)!.attempt!.fingerprint,/^[a-f0-9]{64}$/);assert.equal(readBookingDraft(id)!.attempt!.fingerprint.includes('PRIVATE NAME'),false);
    discardBookingDraft(id);assert.equal(activeBookingDraft(),null);assert.deepEqual(bookingReceipt(),{draftId:id,attemptId:a});assert.equal([...values.values()].join('').includes('PRIVATE NAME'),false);assert.equal([...values.values()].join('').includes('private@example.test'),false);
    finishBookingAttempt(id,a,'VS-CHECK1');assert.equal(bookingReceipt()?.code,'VS-CHECK1');assert.equal(activeBookingDraft(),null);
    const next=saveBookingDraft(params).get('draft')!;await assert.rejects(bookingAttempt(next,fingerprint));discardBookingDraft(next);assert.equal(bookingReceipt()?.attemptId,a);
    values.delete('vs-public-booking-receipt'); // Test fixture isolation, never a production recovery path.
    id=saveBookingDraft(params).get('draft')!;const attempt=await bookingAttempt(id,fingerprint);finishBookingAttempt(id,attempt,'VS-CHECK1');assert.equal(discardBookingDraft(id),'VS-CHECK1');completeBookingDraft('VS-OTHER1');assert.ok(bookingReceipt());completeBookingDraft('VS-CHECK1');assert.equal(bookingReceipt(),null);
    id=saveBookingDraft(params).get('draft')!;now+=119*60000;assert.ok(readBookingDraft(id));saveBookingDraft(params,id);now+=119*60000;assert.ok(readBookingDraft(id));now+=60000;assert.equal(readBookingDraft(id),null);assert.equal(values.has('vs-public-booking-draft'),false);assert.equal(values.get('unrelated'),'keep');
    id=saveBookingDraft(params).get('draft')!;await bookingAttempt(id,fingerprint);now+=2*60*60000;assert.equal(readBookingDraft(id),null);assert.equal(bookingReceipt()?.draftId,id);assert.equal([...values.values()].join('').includes('PRIVATE NAME'),false);
  }finally{Date.now=clock;if(old)Object.defineProperty(globalThis,'sessionStorage',old);else Reflect.deleteProperty(globalThis,'sessionStorage');}
});
