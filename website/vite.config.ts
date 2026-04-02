import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],

  // Treat .wasm imports as static assets (URL strings) rather than ESM WASM modules
  assetsInclude: ['**/*.wasm'],

  define: {
    'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
  },

  build: {
    outDir: '../out',
    emptyOutDir: true,
    sourcemap: mode === 'development',
    target: 'es2022',
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        // Keep stable filenames for WASM assets
        assetFileNames(info) {
          if (info.names?.[0]?.endsWith('.wasm')) return 'assets/[name][extname]';
          return 'assets/[name]-[hash][extname]';
        },
        manualChunks(id) {
          if (id.includes('astexplorer-parsers')) return 'parsers';
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ['astexplorer-parsers'],
  },

  server: {
    port: 8080,
    allowedHosts: ['8080.code.internal.local'],
    host: "0.0.0.0",
  },

  preview: {
    port: 8080,
  },
}));
