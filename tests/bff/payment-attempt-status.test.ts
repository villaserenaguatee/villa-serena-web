import test from 'node:test';
import assert from 'node:assert/strict';
import {paymentView} from '@/lib/paymentResult';
import type {PublicStatusDto} from '@/lib/bff/contracts/public';
const pending:PublicStatusDto={codigo:'VS-STATUS',estadoReserva:'PENDIENTE_PAGO',estadoPago:'PENDIENTE',puedeReintentar:true};
test('pending payment cannot be confirmed by a browser return',()=>assert.equal(paymentView(pending,pending.codigo),'processing'));
test('backend approval confirms; legacy confirmed booking with no Recurrente detail remains confirmed without inventing payment',()=>{
 assert.equal(paymentView({...pending,estadoReserva:'CONFIRMADA',estadoPago:'APROBADO',puedeReintentar:false},pending.codigo),'confirmed');
 assert.equal(paymentView({...pending,estadoReserva:'CONFIRMADA',estadoPago:null,puedeReintentar:false},pending.codigo),'confirmed');
});
test('cancelled and failed outcomes; mismatched code and contradictory status fail closed',()=>{
 assert.equal(paymentView({...pending,estadoReserva:'CANCELADA',estadoPago:'FALLIDO',puedeReintentar:false},pending.codigo),'incomplete');
 assert.equal(paymentView({...pending,estadoPago:'FALLIDO'},pending.codigo),'incomplete');
 assert.throws(()=>paymentView(pending,'VS-OTHER1'));
 assert.throws(()=>paymentView({...pending,estadoReserva:'CONFIRMADA'},pending.codigo));
});
