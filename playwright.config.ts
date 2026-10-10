import { defineConfig, devices, type ReporterDescription } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const port = 3048;
const baseURL = `http://localhost:${port}`;
// Inherited by test workers and Next. Never reuse a developer's demo database.
const receptionPath = process.env.ISSUE48_RECEPTION_STATE_PATH ?? join(tmpdir(), `issue48-e2e-${randomUUID()}`, 'reception.json');
process.env.ISSUE48_RECEPTION_STATE_PATH = receptionPath;

export function reporters(suite: string): ReporterDescription[] {
  return process.env.CI
    ? [['list'], ['github'], ['junit', { outputFile: `test-results/${suite}/e2e.xml` }], ['html', { open: 'never', outputFolder: `playwright-report/${suite}` }]]
    : [['list', { printSteps: true }], ['html', { open: 'never', outputFolder: `playwright-report/${suite}` }]];
}

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: ['**/reception-*.spec.ts', '**/room-detail.spec.ts'],
  testIgnore: '**/staff-session.spec.ts',
  outputDir: 'test-results/reception',
  globalTeardown: './tests/e2e/teardown.ts',
  fullyParallel: false,
  workers: 1, // Las cuentas de prueba del servidor comparten estado (cambio de contraseña).
  forbidOnly: Boolean(process.env.CI),
  retries: 0, // Un reintento necesita reiniciar el proveedor demo, no reutilizar su contraseña cambiada.
  timeout: 240_000, // El recorrido compila los módulos de seis roles en un servidor nuevo.
  expect: { timeout: 15_000 },
  reporter: reporters('reception'),
  use: {
    actionTimeout: 15_000,
    baseURL, timezoneId: 'America/Guatemala', locale: 'es-GT',
    trace: 'retain-on-failure', screenshot: 'only-on-failure', video: 'off',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } } }],
  webServer: {
    command: `pnpm exec next dev --hostname localhost --port ${port}`,
    url: `${baseURL}/panel/login`,
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      TZ: 'America/Guatemala', NEXT_TELEMETRY_DISABLED: '1',
      NODE_OPTIONS: '--max-old-space-size=1536',
      STAFF_AUTH_MODE: 'demo', VILLA_SERENA_BFF_MODE: 'demo',
      VILLA_SERENA_RECEPTION_DEMO_PATH: receptionPath,
      API_URL: '', NEXT_PUBLIC_WS_URL: '', DEEPL_API_KEY: '',
    },
  },
});
