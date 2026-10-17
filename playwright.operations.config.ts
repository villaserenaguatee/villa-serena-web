import { defineConfig } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import reception, { reporters } from './playwright.config';

const token = process.env.ISSUE48_OPERATIONS_MOCK_TOKEN ?? randomUUID();
process.env.ISSUE48_OPERATIONS_MOCK_TOKEN = token;
const next = reception.webServer;
if (!next || Array.isArray(next)) throw new Error('Operations mock requires one Next server');
const nextServer = next;

export function operationsConfig(suite: 'orders' | 'rooms' | 'maintenance') {
  return defineConfig({
    ...reception, testDir: './tests/integration', testIgnore: [], testMatch: `**/operations-${suite}.spec.ts`,
    outputDir: `test-results/operations-${suite}`, reporter: reporters(`operations-${suite}`),
    webServer: [
      { command: 'node tests/integration/operations-api-server.mjs', url: 'http://127.0.0.1:3049/health', reuseExistingServer: false, timeout: 15_000, env: { ISSUE48_OPERATIONS_MOCK_TOKEN: token }, gracefulShutdown: { signal: 'SIGTERM', timeout: 5000 } },
      { ...nextServer, env: { ...nextServer.env, STAFF_AUTH_MODE: 'spring', API_URL: 'http://127.0.0.1:3049', NEXT_PUBLIC_WS_URL: 'ws://127.0.0.1:3049/ws' } },
    ],
  });
}
export default operationsConfig('orders');
