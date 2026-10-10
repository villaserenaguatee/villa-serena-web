import { defineConfig } from '@playwright/test';
import { dirname, join } from 'node:path';
import payments from './playwright.payments.config';
import { reporters } from './playwright.config';

const webServer = payments.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error('Booking requires one demo server');
process.env.ISSUE48_GUEST_OUTBOX_PATH = join(dirname(process.env.ISSUE48_RECEPTION_STATE_PATH!), 'guest-outbox');

export default defineConfig({
  ...payments,
  testMatch: ['**/public-booking.spec.ts', '**/booking-context.spec.ts'],
  outputDir: 'test-results/booking',
  reporter: reporters('booking'),
  webServer: {
    ...webServer,
    env: { ...webServer.env, GUEST_AUTH_MODE: 'demo', VILLA_SERENA_GUEST_OUTBOX_PATH: process.env.ISSUE48_GUEST_OUTBOX_PATH },
  },
});
