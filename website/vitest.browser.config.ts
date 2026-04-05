import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    testTimeout: 30_000,
    include: ['tests/**/*.browser.test.{ts,tsx}'],
    setupFiles: ['tests/browser-setup.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.d.ts',
        'src/app.tsx',
        'src/shims/**',
        'src/types.ts',
        'src/components/JSCodeshiftEditor.ts',
      ],
    },
  },
  optimizeDeps: {
    include: [
      'react', 'react-dom', 'react-redux', 'redux', 'prop-types',
      'codemirror', 'codemirror/keymap/vim', 'codemirror/keymap/emacs',
      'codemirror/keymap/sublime', 'codemirror/mode/javascript/javascript',
    ],
  },
  resolve: {
    alias: {
      'astexplorer-parsers': path.resolve(__dirname, '..', 'packages', 'astexplorer-parsers', 'dist', 'index.mjs'),
    },
  },
});
