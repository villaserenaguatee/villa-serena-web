import test from 'node:test';
import assert from 'node:assert/strict';
import { paymentView } from '@/lib/paymentResult';
import type { PublicStatusDto } from '@/lib/bff/contracts/public';
const pending: PublicStatusDto = { codigo:'VS-STATUS', estadoReserva:'PENDIENTE_PAGO', estadoPago:'PENDIENTE', puedeReintentar:true };
test('a declined attempt is incomplete while the reservation remains pending',()=>{
  assert.equal(paymentView({...pending,estadoUltimoIntento:'RECHAZADO',motivoUltimoIntento:'TARJETA_REAL_EN_PRUEBAS'},pending.codigo),'incomplete');
  assert.equal(pending.estadoReserva,'PENDIENTE_PAGO');
});
test('Stripe success awaiting backend confirmation does not confirm the booking',()=>{
  assert.equal(paymentView({...pending,estadoUltimoIntento:'EN_VERIFICACION'},pending.codigo),'processing');
});
test('backend approval takes precedence over an old declined attempt',()=>{
  assert.equal(paymentView({...pending,estadoReserva:'CONFIRMADA',estadoPago:'APROBADO',puedeReintentar:false,estadoUltimoIntento:'RECHAZADO'},pending.codigo),'confirmed');
});
