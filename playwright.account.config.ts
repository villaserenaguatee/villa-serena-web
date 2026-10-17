import { defineConfig } from '@playwright/test';
import reception, { reporters } from './playwright.config';

export default defineConfig({
  ...reception,
  testIgnore: [],
  testMatch: '**/account-demo.spec.ts',
  outputDir: 'test-results/account',
  reporter: reporters('account'),
});
