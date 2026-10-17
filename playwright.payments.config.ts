import { defineConfig } from '@playwright/test';
import { dirname, join } from 'node:path';
import reception, { reporters } from './playwright.config';

const stateDirectory = dirname(process.env.ISSUE48_RECEPTION_STATE_PATH!);
process.env.ISSUE48_PUBLIC_CONTRACT_PATH = join(stateDirectory, 'public-contract.json');
process.env.ISSUE48_BOOKING_STATE_PATH = join(stateDirectory, 'bookings.json');
const webServer = reception.webServer;
if (!webServer || Array.isArray(webServer)) throw new Error('Payments requires one demo server');

export default defineConfig({
  ...reception,
  testIgnore: [],
  testMatch: '**/payment-*.spec.ts',
  outputDir: 'test-results/payments',
  reporter: reporters('payments'),
  webServer: {
    ...webServer,
    env: {
      ...webServer.env,
      VILLA_SERENA_PUBLIC_CONTRACT_PATH: process.env.ISSUE48_PUBLIC_CONTRACT_PATH,
      VILLA_SERENA_BFF_STATE_PATH: process.env.ISSUE48_BOOKING_STATE_PATH,
    },
  },
});
