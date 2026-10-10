import { test as base, expect, type BrowserContext, type Page } from '@playwright/test';
import type { AccountSnapshot, MockOptions } from './account-api';
export { expect };
export { viewports } from '../e2e/reception-fixtures';
export { expectNoOverflow } from '../e2e/public-fixtures';

type MockControl = { state: () => Promise<AccountSnapshot>; configure: (options: Partial<MockOptions>) => Promise<void> };
async function control(path: string, method = 'GET', body?: unknown): Promise<AccountSnapshot> {
  const token = process.env.ISSUE48_ACCOUNT_MOCK_TOKEN;
  if (!token) throw new Error('Missing account mock control token');
  const response = await fetch(`http://127.0.0.1:3049/__test/${path}`, {
    method, signal: AbortSignal.timeout(5000), headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(`Account mock control ${path}: ${response.status}`);
  return response.json() as Promise<AccountSnapshot>;
}

export const test = base.extend<{ mock: MockControl; browserErrors: void }>({
  mock: [async ({}, use) => {
    await control('reset', 'POST');
    await use({ state: () => control('state'), configure: async options => { await control('configure', 'POST', options); } });
    expect((await control('state')).errors).toEqual([]);
  }, { auto: true }],
  browserErrors: [async ({ page }, use) => {
    const errors: string[] = [];
    const record = (error: Error) => errors.push(`${page.url()}: ${error.message}`);
    page.on('pageerror', record); await use(); page.off('pageerror', record);
    expect(errors).toEqual([]);
  }, { auto: true }],
});

// Authenticate through the real BFF; cookies are shared by request/page in this context.
export async function login(context: BrowserContext, baseURL: string, role: 'RECEPCION' | 'ADMIN' = 'RECEPCION') {
  const response = await context.request.post('/api/auth/login', { headers: { Origin: baseURL }, data: { correo: `${role.toLowerCase()}@example.test`, contrasena: 'de-prueba' } });
  expect(response.status()).toBe(200);
}
export async function expectNoDemoStorage(page: Page) {
  expect(await page.evaluate(() => localStorage.getItem('vs-demo-cuenta-obj4c'))).toBeNull();
}
