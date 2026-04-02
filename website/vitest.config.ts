import { defineConfig } from 'vitest/config';
import path from 'path';

const parsersAlias = {
  'astexplorer-parsers': path.resolve(__dirname, '..', 'packages', 'astexplorer-parsers', 'dist', 'index.mjs'),
};

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
  resolve: {
    alias: parsersAlias,
  },
});
