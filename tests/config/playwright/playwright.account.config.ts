import { defineConfig } from '@playwright/test';
import reception, { reporters, projectPath } from './playwright.config';

export default defineConfig({
  ...reception,
  testIgnore: [],
  testMatch: '**/account-demo.spec.ts',
  outputDir: projectPath('test-results/account'),
  reporter: reporters('account'),
});
