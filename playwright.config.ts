import { defineConfig, devices } from '@playwright/test';

const port = 3048;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1, // Las cuentas de prueba del servidor comparten estado (cambio de contraseña).
  forbidOnly: Boolean(process.env.CI),
  retries: 0, // Un reintento necesita reiniciar el proveedor demo, no reutilizar su contraseña cambiada.
  timeout: 240_000, // El recorrido compila los módulos de seis roles en un servidor nuevo.
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['github'], ['junit', { outputFile: 'test-results/e2e.xml' }], ['html', { open: 'never' }]] : [['list', { printSteps: true }], ['html', { open: 'never' }]],
  use: {
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
      VILLA_SERENA_RECEPTION_DEMO_PATH: '.data/issue48/reception.json',
      API_URL: '', NEXT_PUBLIC_WS_URL: '', DEEPL_API_KEY: '',
    },
  },
});
