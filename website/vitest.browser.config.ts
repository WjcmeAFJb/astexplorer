import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    testTimeout: 30_000,
    include: ['tests/**/*.browser.test.{ts,tsx}'],
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
  },
  resolve: {
    alias: {
      'astexplorer-parsers': path.resolve(__dirname, '..', 'packages', 'astexplorer-parsers', 'dist', 'index.mjs'),
    },
  },
});
