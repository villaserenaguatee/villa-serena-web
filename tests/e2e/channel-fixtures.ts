import { test as receptionTest } from './reception-fixtures';
import { resetPublicState } from './public-fixtures';
export { expect, viewports, login, calendar, openDetail } from './reception-fixtures';
export { expectNoOverflow, readGuestCode, hotelDate } from './public-fixtures';

export const test = receptionTest.extend<{ isolatedPublic: void }>({
  isolatedPublic: [async ({}, use) => { await resetPublicState(); await use(); }, { auto: true }],
});
