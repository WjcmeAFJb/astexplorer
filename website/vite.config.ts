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
    modulePreload: {
      // Don't add <link rel="modulepreload"> for large chunks —
      // they're loaded on-demand and not needed for initial render.
      resolveDependencies: (_filename: string, deps: string[]) => {
        return deps.filter((dep) => !dep.includes('parsers/') && !dep.includes('monaco'));
      },
    },
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
        // Place parsers and Monaco into separate chunks for parallel loading & caching
        manualChunks(id) {
          if (id.includes('astexplorer-parsers')) return 'parsers/index';
          if (id.includes('monaco-editor')) return 'monaco';
        },
      },
    },
  },

  resolve: {
    alias: [
      {
        // Only alias the bare 'monaco-editor' import (exact match),
        // not subpath imports like 'monaco-editor/esm/vs/...'.
        find: /^monaco-editor$/,
        replacement: 'monaco-editor/esm/vs/editor/edcore.main.js',
      },
    ],
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
