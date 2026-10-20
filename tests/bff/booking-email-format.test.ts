import test from 'node:test';
import assert from 'node:assert/strict';
import { validBookingEmail } from '@/lib/guestValidation';
test('booking email validates format without a provider allowlist', () => {
  for (const value of ['ana@gmail.com','ana@outlook.com','ana+reserva@mi-hotel.com.gt',"o'neill@universidad.edu.gt",'ana@sub.hotel.org','ana@xn--espaa-rta.es']) assert.equal(validBookingEmail(value),true,value);
  for (const value of ['', ' ', 'ana', 'ana@', '@hotel.com','ana@hotel','ana@@hotel.com','ana @hotel.com','ana..perez@hotel.com','.ana@hotel.com','ana.@hotel.com','ana@-hotel.com','ana@hotel-.com','ana@hotel..com','ana@hotel.com ','ana@hotel.com\n']) assert.equal(validBookingEmail(value),false,value);
});
