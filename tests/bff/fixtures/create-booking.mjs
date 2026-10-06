import { writeFileSync } from 'node:fs';
import { createBooking, parseBooking } from '../../../src/lib/bff/publicBooking.ts';
let status;
try { createBooking(parseBooking(JSON.parse(process.env.TEST_BOOKING))); status = 201; }
catch (error) { status = error.status ?? 500; }
writeFileSync(process.argv[2], String(status));
