import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Copy webpack async chunks from parsers dist to build output
function copyParsersChunks() {
  return {
    name: 'copy-parsers-chunks',
    writeBundle(options: { dir?: string }) {
      const parsersDir = path.resolve(__dirname, '../packages/astexplorer-parsers/dist');
      const outDir = options.dir || path.resolve(__dirname, '../out');
      const assetsDir = path.join(outDir, 'assets');
      // Copy parsers main ESM module so chunks resolve relative to it
      const parsersOut = path.join(assetsDir, 'parsers');
      fs.mkdirSync(parsersOut, { recursive: true });
      for (const file of fs.readdirSync(parsersDir)) {
        if (file.startsWith('chunk-') && (file.endsWith('.js') || file.endsWith('.js.map'))) {
          fs.copyFileSync(path.join(parsersDir, file), path.join(parsersOut, file));
        }
      }
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), copyParsersChunks()],

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
        // Place parsers main module inside assets/parsers/ so chunk paths resolve
        manualChunks(id) {
          if (id.includes('astexplorer-parsers')) return 'parsers/index';
        },
      },
    },
  },

  optimizeDeps: {
    exclude: ['astexplorer-parsers'],
  },

  server: {
    port: 8085,
    allowedHosts: ['.code.internal.local'],
    host: '0.0.0.0',
  },

  preview: {
    port: 8080,
  },
}));
