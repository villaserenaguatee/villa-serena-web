import { defineConfig } from '@playwright/test';
import booking from './playwright.booking.config';
import { reporters } from './playwright.config';

const webServer = booking.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error('Channels requires one demo server');
export default defineConfig({
  ...booking,
  testMatch: ['**/channel-*.spec.ts', '**/login-credentials.spec.ts'],
  outputDir: 'test-results/channels',
  reporter: reporters('channels'),
  webServer: {
    ...webServer,
    env: {
      ...webServer.env,
      CANAL_BOOKING_CODIGO: 'issue48-booking-code', CANAL_BOOKING_CLAVE: 'issue48-booking-private-marker',
      CANAL_EXPEDIA_CODIGO: 'issue48-expedia-code', CANAL_EXPEDIA_CLAVE: 'issue48-expedia-private-marker',
    },
  },
});
