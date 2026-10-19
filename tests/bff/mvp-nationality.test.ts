import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createPublicReservation} from '@/lib/api/public';
import {registerGuest, addReservationGuest} from '@/lib/api/reception';
import {parseContractBooking} from '@/lib/bff/publicContract';

test('MVP requests omit nationality instead of inventing a country, including additional guests', async () => {
  const fetch = globalThis.fetch, bodies: Record<string, unknown>[] = [];
  globalThis.fetch = async (_url, init) => {
    bodies.push(JSON.parse(String(init?.body)));
    return Response.json({}, {headers:{'X-Villa-Serena-Mode':'spring'}});
  };
  const guest = {nombreCompleto:'María O’Neill',correo:'manual@example.test',telefono:'+502 55551234',tipoDocumento:'DPI' as const,numeroDocumento:'0012345678901'};
  try {
    await createPublicReservation({tipoHabitacionId:1,entrada:'2027-01-16',salida:'2027-01-18',numeroHuespedes:2,huesped:guest}, 'fixture-attempt-123456');
    await registerGuest(guest);
    await addReservationGuest('VS-ABCDEF',{nombreCompleto:guest.nombreCompleto,tipoDocumento:'DPI',numeroDocumento:guest.numeroDocumento});
    assert.equal(Object.hasOwn(bodies[0].huesped as object,'nacionalidad'),false);
    assert.equal(Object.hasOwn(bodies[1],'nacionalidad'),false);
    assert.equal(Object.hasOwn(bodies[2],'nacionalidad'),false);
    const parsed = parseContractBooking(bodies[0]);
    assert.equal(Object.hasOwn(parsed.huesped,'nacionalidad'),false);
    // A known historical value is preserved when explicitly passed by an existing flow.
    await registerGuest({...guest,nacionalidad:'Italiana'});
    assert.equal(bodies[3].nacionalidad,'Italiana');
  } finally { globalThis.fetch = fetch; }
});

test('missing nationality never converts a real API validation error into success or retries', async () => {
  const fetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls++; return Response.json({codigo:'DATOS_INVALIDOS',mensaje:'Solicitud rechazada',detalles:[{campo:'nacionalidad',mensaje:'No debe estar vacío'}]}, {status:400}); };
  try {
    await assert.rejects(registerGuest({nombreCompleto:'Visitante',correo:'manual@example.test',telefono:'+502 55551234',tipoDocumento:'DPI',numeroDocumento:'0012345678901'}), /Solicitud rechazada/);
    assert.equal(calls,1);
  } finally {globalThis.fetch=fetch;}
});
