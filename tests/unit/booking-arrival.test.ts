import {beforeEach, afterEach, expect, test, vi} from 'vitest';
import {preparePublicBookingPayment} from '@/lib/publicBookingPayment';
import {saveBookingDraft, bookingAttempt, readBookingDraft} from '@/lib/bookingDraft';
import {createPublicReservation, startPublicPayment} from '@/lib/api/public';

vi.mock('@/lib/api/public', () => ({
  createPublicReservation: vi.fn(), startPublicPayment: vi.fn(), getPublicStatus: vi.fn(), recoverPublicAttempt: vi.fn(),
  PublicApiError: class extends Error {},
}));
beforeEach(() => {
  const data = new Map<string,string>();
  vi.stubGlobal('sessionStorage', {getItem:(k:string)=>data.get(k)??null, setItem:(k:string,v:string)=>data.set(k,v), removeItem:(k:string)=>data.delete(k)});
  vi.stubGlobal('window', {location:{origin:'http://localhost:3080'}});
  vi.mocked(createPublicReservation).mockReset().mockResolvedValue({codigo:'VS-ABC123',estado:'PENDIENTE_PAGO',total:840} as Awaited<ReturnType<typeof createPublicReservation>>);
  vi.mocked(startPublicPayment).mockReset().mockResolvedValue({urlPago:'https://app.recurrente.com/checkout-session/ch_fixture',expiraEn:null,mode:'spring'});
});
afterEach(() => vi.unstubAllGlobals());
function params(hora:string, oferta:boolean) {
  const llegada=new Date(Date.now()+86400000).toISOString().slice(0,10), salida=new Date(Date.now()+3*86400000).toISOString().slice(0,10);
  return new URLSearchParams({tipoHabitacionId:'1',llegada,salida,adultos:'2',ninos:'0',nombre:'Ana',apellidos:'Pérez',correo:'ana@example.invalid',telefono:'+502 55551234',documento:'0012345678901',hora,...(oferta?{slug:'habitacion-estandar'}:{})});
}
test.each([false,true])('public flow oferta=%s sends local HH:mm, omits blank, and never duplicates double clicks', async oferta => {
  for(const hora of ['', '00:00','18:30','23:59']) {
    sessionStorage.removeItem('vs-public-booking-draft');
    const input=params(hora,oferta), query=saveBookingDraft(input), id=query.get('draft')!;
    const first=preparePublicBookingPayment(input,id), second=preparePublicBookingPayment(input,id);
    expect(second).toBe(first);
    await first;
    const body=vi.mocked(createPublicReservation).mock.calls.at(-1)![0];
    if(hora) expect(body.horaEstimadaLlegada).toBe(hora);
    else expect(body).not.toHaveProperty('horaEstimadaLlegada');
    expect(body.ofertaSlug).toBe(oferta?'habitacion-estandar':undefined);
  }
  expect(createPublicReservation).toHaveBeenCalledTimes(4);
  expect(startPublicPayment).toHaveBeenCalledTimes(4);
});
test.each(['24:00','18:60','8:30','18:30:00','18:30Z'])('invalid arrival %s never creates a reservation/payment', async hora => {
  const input=params(hora,false), id=saveBookingDraft(input).get('draft')!;
  await expect(preparePublicBookingPayment(input,id)).rejects.toThrow('HH:mm');
  expect(createPublicReservation).not.toHaveBeenCalled(); expect(startPublicPayment).not.toHaveBeenCalled();
});
test('same payload retains idempotency; changing arrival cannot overwrite the original attempt', async () => {
  const id=saveBookingDraft(params('18:30',false)).get('draft')!;
  const fingerprint=JSON.stringify({flow:'recurrente',input:{horaEstimadaLlegada:'18:30'}});
  const key=await bookingAttempt(id,fingerprint);
  expect(await bookingAttempt(id,fingerprint)).toBe(key);
  await expect(bookingAttempt(id,JSON.stringify({flow:'recurrente',input:{horaEstimadaLlegada:'19:00'}}))).rejects.toThrow();
  expect(readBookingDraft(id)?.attempt?.id).toBe(key);
  expect(createPublicReservation).not.toHaveBeenCalled();
});
