import test from 'node:test';
import assert from 'node:assert/strict';
import {POST} from '@/app/api/publico/[...ruta]/route';
import {parseContractBooking} from '@/lib/bff/publicContract';
const guest={nombreCompleto:'Ana Pérez',correo:'ana@example.invalid',telefono:'+502 55551234',tipoDocumento:'DPI',numeroDocumento:'0012345678901'};
const base={tipoHabitacionId:1,entrada:'2026-12-10',salida:'2026-12-12',numeroHuespedes:2,huesped:guest};
test('arrival parser accepts HH:mm/null/omission, rejects empty, seconds, zones and invalid times',()=>{
  for(const hora of [undefined,null,'00:00','18:30','23:59']) {
    const parsed=parseContractBooking({...base,horaEstimadaLlegada:hora});
    assert.equal(parsed.horaEstimadaLlegada,hora??undefined);
  }
  for(const hora of ['', '24:00','12:60','8:30','18:30:00','18:30Z',123]) assert.throws(()=>parseContractBooking({...base,horaEstimadaLlegada:hora}));
});
test('BFF forwards arrival unchanged for type and offer; preserves conflict and original idempotency',async()=>{
  const original=globalThis.fetch, mode=process.env.VILLA_SERENA_BFF_MODE, api=process.env.API_URL;
  process.env.VILLA_SERENA_BFF_MODE='api'; process.env.API_URL='https://backend.invalid';
  const draft='a853efb0-13b3-4012-aa10-fb81d2ea609b', proof='a'.repeat(43), key='arrival-original-attempt-1234';
  let calls=0;
  try {
    for(const slug of [undefined,'habitacion-estandar']) for(const hora of [undefined,null,'00:00','18:30','23:59']) for(const status of [201,409]) {
      globalThis.fetch=async(input,init)=>{
        calls++; assert.equal(new URL(String(input)).pathname,slug?`/api/v1/publico/ofertas/${slug}/reservas`:'/api/v1/publico/reservas');
        const body=JSON.parse(String(init?.body));
        assert.equal(body.horaEstimadaLlegada,hora);
        assert.equal(Object.hasOwn(body,'horaEstimadaLlegada'),hora!==undefined);
        assert.equal(body.ofertaSlug,undefined); assert.equal(body.borradorId,undefined);
        assert.equal(new Headers(init?.headers).get('Idempotency-Key'),key);
        assert.equal(new Headers(init?.headers).get('X-Booking-Email-Verification'),proof);
        return Response.json(status===409?{codigo:'BOOKING_REQUEST_CONFLICT',mensaje:'Conflicto'}:{codigo:'VS-ABC123',estado:'PENDIENTE_PAGO'},{status});
      };
      const response=await POST(new Request('http://localhost:3080/api/publico/reservas',{method:'POST',headers:{Origin:'http://localhost:3080','Content-Type':'application/json','Idempotency-Key':key,Cookie:`vs_booking_email=${draft}.${proof}`},body:JSON.stringify({...base,borradorId:draft,...(slug?{ofertaSlug:slug}:{}),...(hora===undefined?{}:{horaEstimadaLlegada:hora})})}));
      assert.equal(response.status,status);
      if(status===409) assert.equal((await response.json()).codigo,'BOOKING_REQUEST_CONFLICT');
    }
    assert.equal(calls,20);
  } finally {
    globalThis.fetch=original;
    if(mode===undefined) delete process.env.VILLA_SERENA_BFF_MODE; else process.env.VILLA_SERENA_BFF_MODE=mode;
    if(api===undefined) delete process.env.API_URL; else process.env.API_URL=api;
  }
});
