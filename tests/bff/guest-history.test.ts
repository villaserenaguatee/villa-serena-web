import test from 'node:test';
import assert from 'node:assert/strict';
import {connectedGuestPortalData} from '@/lib/bff/guestAccess';
test('opening owned cancelled history retains all own reservations and rejects a foreign code',async()=>{
 const original=globalThis.fetch,previous=process.env.API_URL;process.env.API_URL='https://api.example.test';
 const detail=(codigo:string,estado:string)=>({codigo,estado,entrada:'2026-01-01',salida:'2026-01-02',numeroHuespedes:1,tipoHabitacion:{nombre:'Standard'},habitacion:null});
 const rows=[detail('VS-AAAAAA','CANCELADA'),detail('VS-BBBBBB','FINALIZADA')];
 const calls:string[]=[];
 globalThis.fetch=async input=>{const path=new URL(String(input)).pathname;calls.push(path);const value=path.endsWith('/perfil')?{nombreCompleto:'Local guest',correo:'local@example.test',tipoDocumento:'DPI'}:path.endsWith('/reservas')?rows:rows.find(r=>path.endsWith('/'+r.codigo));return new Response(JSON.stringify(value??{codigo:'NO_ENCONTRADO'}),{status:value?200:404});};
 try{const token='header.'+Buffer.from(JSON.stringify({sub:'fixture'})).toString('base64url')+'.signature';const data=await connectedGuestPortalData(token,'VS-AAAAAA');assert.ok(data?.supported);if(!data?.supported)throw Error('history unavailable');assert.deepEqual(data.reservas.map(r=>r.estado),['cancelada','finalizada']);assert.ok(data.reservas.every(r=>r.huespedId===data.huesped.id));assert.ok(calls.every(p=>p.startsWith('/api/v1/app/')));assert.deepEqual(await connectedGuestPortalData(token,'VS-CCCCCC'),{supported:false,reason:'reservation'});
 }finally{globalThis.fetch=original;if(previous===undefined)delete process.env.API_URL;else process.env.API_URL=previous;}
});
