import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
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
  plugins: [
    react(),
    // Add crossorigin="use-credentials" to the manifest link so browsers send
    // cookies when fetching it. Required for auth proxies like code-server.
    {
      name: 'manifest-credentials',
      transformIndexHtml(html) {
        return html.replace(
          '<link rel="manifest"',
          '<link rel="manifest" crossorigin="use-credentials"',
        );
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: { enabled: false },
      // Only precache Vite-built assets (not the parser chunks copied later).
      // Parser chunks, Monaco, workers, and WASM are cached at runtime.
      workbox: {
        // Precache the core app shell — small files needed for first paint.
        globPatterns: ['*.html', 'assets/index-*.{js,css}', 'assets/favicon-*.png'],
        // Don't precache large assets — they're runtime-cached on first use.
        globIgnores: [
          'assets/parsers/**',
          'assets/monaco-*',
          'assets/*.worker-*',
          'assets/*.wasm',
          'assets/*-*.js.map',
        ],
        maximumFileSizeToCacheInBytes: 5_000_000,
        // Cache everything else on first use. All hashed assets are immutable
        // so CacheFirst is safe. Parser chunks, Monaco, workers, WASM — all
        // get cached permanently once fetched.
        runtimeCaching: [
          {
            // Monaco editor chunk
            urlPattern: /\/assets\/monaco-[a-zA-Z0-9]+\.(js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'monaco',
              expiration: { maxEntries: 10 },
            },
          },
          {
            // Monaco language contribution chunks (basic-languages, language services)
            urlPattern: /\/assets\/[a-zA-Z]+-[a-zA-Z0-9]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'app-chunks',
              expiration: { maxEntries: 200 },
            },
          },
          {
            // Worker scripts
            urlPattern: /\/assets\/.*worker.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'workers',
              expiration: { maxEntries: 10 },
            },
          },
          {
            // Parser chunks (loaded on demand per language/parser)
            urlPattern: /\/assets\/parsers\/chunk-\d+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'parser-chunks',
              expiration: { maxEntries: 200 },
            },
          },
          {
            // Parser index
            urlPattern: /\/assets\/parsers\/index-[a-zA-Z0-9]+\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'parser-chunks',
              expiration: { maxEntries: 5 },
            },
          },
          {
            // WASM binaries
            urlPattern: /\/assets\/.*\.wasm$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'wasm',
              expiration: { maxEntries: 10 },
            },
          },
          {
            // Web fonts
            urlPattern: /\/assets\/.*\.(woff2?|ttf|eot)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 20 },
            },
          },
        ],
        // Handle navigation requests (SPA routing)
        navigateFallback: 'index.html',
      },
      manifest: {
        name: 'AST Explorer',
        short_name: 'AST Explorer',
        description:
          'An online AST explorer — parse code, visualize ASTs, and transform code with plugins.',
        theme_color: '#efefef',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
    copyParsersChunks(),
  ],

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
    include: [
      // Monaco sub-path dynamic imports must be pre-bundled for Vite dev mode.
      // Without this, import('monaco-editor/esm/vs/...') fails at runtime.
      'monaco-editor/esm/vs/basic-languages/javascript/javascript.contribution',
      'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution',
      'monaco-editor/esm/vs/basic-languages/css/css.contribution',
      'monaco-editor/esm/vs/basic-languages/go/go.contribution',
      'monaco-editor/esm/vs/basic-languages/handlebars/handlebars.contribution',
      'monaco-editor/esm/vs/basic-languages/html/html.contribution',
      'monaco-editor/esm/vs/basic-languages/lua/lua.contribution',
      'monaco-editor/esm/vs/basic-languages/markdown/markdown.contribution',
      'monaco-editor/esm/vs/basic-languages/fsharp/fsharp.contribution',
      'monaco-editor/esm/vs/basic-languages/php/php.contribution',
      'monaco-editor/esm/vs/basic-languages/protobuf/protobuf.contribution',
      'monaco-editor/esm/vs/basic-languages/pug/pug.contribution',
      'monaco-editor/esm/vs/basic-languages/python/python.contribution',
      'monaco-editor/esm/vs/basic-languages/rust/rust.contribution',
      'monaco-editor/esm/vs/basic-languages/sql/sql.contribution',
      'monaco-editor/esm/vs/basic-languages/yaml/yaml.contribution',
      'monaco-editor/esm/vs/basic-languages/java/java.contribution',
      'monaco-editor/esm/vs/basic-languages/scala/scala.contribution',
      'monaco-editor/esm/vs/basic-languages/xml/xml.contribution',
      'monaco-editor/esm/vs/basic-languages/graphql/graphql.contribution',
      'monaco-editor/esm/vs/language/typescript/monaco.contribution',
      'monaco-editor/esm/vs/language/json/monaco.contribution',
      'monaco-editor/esm/vs/language/css/monaco.contribution',
      'monaco-editor/esm/vs/language/html/monaco.contribution',
    ],
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
