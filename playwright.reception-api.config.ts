import { defineConfig } from '@playwright/test';
import reception, { reporters } from './playwright.config';

const next = reception.webServer;
if (!next || Array.isArray(next)) throw new Error('Reception API requires one Next server');

// Exercise the connected-mode guard with a real demo staff session. No Spring is started.
export default defineConfig({
  ...reception,
  testIgnore: [],
  testMatch: '**/connected-reception.spec.ts',
  outputDir: 'test-results/reception-api',
  reporter: reporters('reception-api'),
  webServer: { ...next, env: { ...next.env, VILLA_SERENA_BFF_MODE: 'api' } },
});
