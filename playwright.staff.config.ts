import { defineConfig } from '@playwright/test';
import reception, { reporters } from './playwright.config';

// Compile the six staff roles in a fresh server, after reception has stopped.
export default defineConfig({
  ...reception,
  testIgnore: [],
  testMatch: '**/staff-session.spec.ts',
  outputDir: 'test-results/staff',
  reporter: reporters('staff'),
});
