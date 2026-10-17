import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import reception, { reporters } from './playwright.config';

const token = process.env.ISSUE48_ACCOUNT_MOCK_TOKEN ?? randomUUID();
process.env.ISSUE48_ACCOUNT_MOCK_TOKEN = token;
const next = reception.webServer;
if (!next || Array.isArray(next)) throw new Error('Account mock requires one Next server');

export default defineConfig({
  ...reception,
  testDir: './tests/integration',
  testIgnore: [],
  testMatch: '**/account-mock.spec.ts',
  outputDir: 'test-results/account-mock',
  reporter: reporters('account-mock'),
  webServer: [
    { command: 'node tests/integration/account-api-server.mjs', url: 'http://127.0.0.1:3049/health', reuseExistingServer: false, timeout: 15_000, env: { ISSUE48_ACCOUNT_MOCK_TOKEN: token }, gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 } },
    { ...next, env: { ...next.env, STAFF_AUTH_MODE: 'spring', API_URL: 'http://127.0.0.1:3049' } },
  ],
});
