import { defineConfig } from '@playwright/test';
import reception, { reporters, projectPath } from './playwright.config';

// Compile the six staff roles in a fresh server, after reception has stopped.
export default defineConfig({
  ...reception,
  timeout: 240_000, // This one scenario visits all six roles in a cold server.
  testIgnore: [],
  testMatch: '**/staff-session.spec.ts',
  outputDir: projectPath('test-results/staff'),
  reporter: reporters('staff'),
});
