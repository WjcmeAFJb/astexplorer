import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    testTimeout: 10_000,
    include: ['tests/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [
      ['tests/**/*.test.tsx', 'happy-dom'],
    ],
  },
  resolve: {
    alias: {
      'astexplorer-parsers': path.resolve(__dirname, '..', 'packages', 'astexplorer-parsers', 'src'),
    },
  },
});
