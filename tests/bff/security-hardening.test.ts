import {test} from 'node:test';
import assert from 'node:assert/strict';
import {NextRequest,NextResponse} from 'next/server';
import {writeGuestCookies} from '../../src/lib/bff/guestAccess';
import {sameOrigin,writeCookies} from '../../src/lib/bff/auth/http';
import {readLimitedBody} from '../../src/lib/bff/readLimitedBody';
import {validDocument,validPhone} from '../../src/lib/guestValidation';
test('cookies privadas persistentes y Secure fuera de localhost',()=>{
 for(const origin of ['http://localhost:3054','https://hotel.example','http://192.0.2.1']){
  const req=new NextRequest(origin+'/login');
  const r=writeGuestCookies(new NextResponse(),req,{access:'unit-access',refresh:'unit-refresh',expiresIn:900});
  for(const cookie of r.cookies.getAll()){assert.equal(cookie.httpOnly,true);assert.equal(cookie.sameSite,'lax');assert.equal(cookie.secure,origin!=='http://localhost:3054');assert.ok(cookie.maxAge!>0)}
  const staff=writeCookies(new NextResponse(),req,{accessToken:'unit-access',refreshToken:'unit-refresh',tipoToken:'Bearer',expiraEn:900});assert.equal(staff.cookies.get('vs_staff_refresh')?.maxAge,604800);
  const clear=writeGuestCookies(new NextResponse(),req);assert.ok(clear.cookies.getAll().every(c=>c.maxAge===0));
 }
});
test('origen ajeno o ausente se rechaza sin acciones',()=>{for(const origin of [undefined,'https://otro.example','null']){const r=new Request('http://localhost:3054/api/contacto',{method:'POST',headers:origin?{Origin:origin}:{}});assert.throws(()=>sameOrigin(r))}assert.doesNotThrow(()=>sameOrigin(new Request('http://localhost:3054/api/contacto',{method:'POST',headers:{Origin:'http://localhost:3054'}})))});
test('cuerpo limitado durante lectura incluso sin Content-Length',async()=>{const ok=new Request('http://localhost',{method:'POST',body:'abc'});assert.equal(await readLimitedBody(ok,3),'abc');const stream=new ReadableStream({start(c){c.enqueue(new Uint8Array(11));c.close()}});const large=new Request('http://localhost',{method:'POST',body:stream,duplex:'half'} as RequestInit);await assert.rejects(readLimitedBody(large,10),{status:413});});
test('DPI y teléfono comprueban texto pegado; pasaporte retirado del MVP',()=>{assert.equal(validDocument('DPI','0012345678901'),true);for(const d of ['123','123456789012A',"' OR 1=1--",'abc0012345678901'])assert.equal(validDocument('DPI',d),false);assert.equal(validDocument('PASAPORTE','AB0012345'),false);assert.equal(validPhone('+502 5555-1234'),true);assert.equal(validPhone('+1 (202) 555-0123'),true);for(const p of ['123','5555ABCD','++50255551234','+1234567890123456'])assert.equal(validPhone(p),false)});
