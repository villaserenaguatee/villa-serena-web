import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validDocument, validNationalPhone } from '@/lib/guestValidation';
import { saveBookingDraft, readBookingDraft } from '@/lib/bookingDraft';
import { historicalPassportIssuer } from '@/lib/api/guestCompatibility';

test('historical issuer is read only when a real string exists, without extending generated DTOs', () => {
  assert.equal(historicalPassportIssuer({ paisEmisorPasaporte: 'GT' }), 'GT');
  for (const value of [null, undefined, {}, { paisEmisorPasaporte: null }, { paisEmisorPasaporte: 123 }]) {
    assert.equal(historicalPassportIssuer(value), undefined);
  }
});
test('guest document and international phone rules; unchanged draft identity on manual completion', () => {
  assert.equal(validDocument('DPI', '0000000000001'), true);
  assert.equal(validDocument('DPI', '000000000000A'), false);
  assert.equal(validDocument('DPI', '123456789012'), false);
  assert.equal(validDocument('Pasaporte', '0000123456789'), false);
  assert.equal(validDocument('Pasaporte', 'A'), false); // General storage format, not an invented national rule.
  assert.equal(validDocument('Pasaporte', 'A-123'), false);
  assert.equal(validDocument('Pasaporte', 'A'.repeat(31)), false);
  assert.equal(validNationalPhone('+502','5555 5555'),true);
  for(const input of ['5555555','555555555','50255555555','5555ABCD','5'.repeat(30),'+50255555555']) assert.equal(validNationalPhone('+502',input),false);
  assert.equal(validNationalPhone('+1','2025550123'),true);assert.equal(validNationalPhone('+44','2079460018'),true);assert.equal(validNationalPhone('+1','12345'),false);
  const previous=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage'), data=new Map<string,string>();
  Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>data.set(k,v)}});
  try { const params=new URLSearchParams({correo:'visitor@example.test',slug:'habitacion-estandar'}), first=saveBookingDraft(params),id=first.get('draft')!;params.set('documento','0000123456789');params.set('telefono','+502 55555555');const second=saveBookingDraft(params,id);assert.equal(second.get('draft'),id);const saved=new URLSearchParams(readBookingDraft(id)!.params);assert.equal(saved.get('documento'),'0000123456789');assert.equal(saved.has('paisEmisorPasaporte'),false);assert.equal(second.has('documento'),false);assert.equal(second.has('paisEmisorPasaporte'),false); }
  finally {if(previous)Object.defineProperty(globalThis,'sessionStorage',previous);else Reflect.deleteProperty(globalThis,'sessionStorage');}
});
