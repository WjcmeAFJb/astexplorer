import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    testTimeout: 10_000,
    include: ['tests/**/*.test.{ts,tsx}'],
    exclude: ['tests/**/*.browser.test.{ts,tsx}'],
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/app.tsx', 'src/shims/**'],
    },
  },
});
