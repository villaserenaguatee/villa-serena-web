import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    maxWorkers: 1, // Limita los entornos jsdom simultáneos en desarrollo y CI.
    restoreMocks: true,
    clearMocks: true,
    reporters: process.env.CI ? ['default', 'junit'] : ['default'],
    outputFile: { junit: 'test-results/vitest.xml' },
    projects: [
      { extends: true, test: { name: 'unit', environment: 'node', include: ['tests/unit/**/*.test.ts'] } },
      { extends: true, test: { name: 'component', environment: 'jsdom', include: ['tests/component/**/*.test.tsx'], setupFiles: ['tests/component/setup.ts'] } },
    ],
  },
});
