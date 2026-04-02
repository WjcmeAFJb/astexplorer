const path = require('path');

// Resolve webpack and build tools from the website's node_modules (the host project).
// This avoids duplicating heavy devDependencies in this package.
const websiteNodeModules = path.resolve(__dirname, '..', '..', 'website', 'node_modules');
const webpack = require(path.join(websiteNodeModules, 'webpack'));

function resolveFromWebsite(mod) {
  return require.resolve(mod, { paths: [websiteNodeModules] });
}

// ---------------------------------------------------------------------------
// Externals strategy:
//
// We bundle ALL parser dependencies into the output so that:
//   1. Consumer bundlers (website webpack) need zero parser-specific rules
//   2. The bundle works in Node.js without installing peer dependencies
//
// Only browser-runtime deps (codemirror, react) and worker-loader are
// externalized — these require a DOM or a bundler to work.
// ---------------------------------------------------------------------------

function isExternal(request) {
  // worker-loader is a webpack loader, not a runtime dep
  if (/^worker-loader/.test(request)) return true;
  return false;
}

module.exports = {
  target: 'web',

  // IMPORTANT: Never use eval-based devtool (the default in development mode).
  // eval() wraps module code in strings, hiding require() calls from consumer
  // bundlers that re-process this output.
  devtool: 'source-map',

  entry: './src/index.ts',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'astexplorer-parsers',
    libraryTarget: 'commonjs2',
    // Use globalThis so the bundle works in both browsers and Node.js.
    // Default 'window' causes ReferenceError in Node.js environments.
    globalObject: 'globalThis',
  },

  externals: [
    function (context, request, callback) {
      // Relative/absolute imports — always bundle
      if (request.startsWith('.') || request.startsWith('/')) return callback();

      if (!isExternal(request)) {
        // Bundle everything else — the parsers package owns all parser deps
        return callback();
      }

      // worker-loader: stub out
      if (/^worker-loader/.test(request)) {
        return callback(null, 'var {}');
      }

      // worker-loader: stub out
      return callback(null, 'var {}');
    },
  ],

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      websiteNodeModules,
      'node_modules',
    ],
    alias: {
      // webpack 4 can't resolve "exports" field in package.json for these packages
      'chevrotain$': path.join(websiteNodeModules, 'chevrotain', 'lib_esm', 'src', 'api.js'),
      'chevrotain-allstar$': path.join(websiteNodeModules, 'chevrotain-allstar', 'lib', 'index.js'),
      'meriyah$': path.join(websiteNodeModules, 'meriyah', 'dist', 'meriyah.esm.js'),
      'meriyah/package.json': path.join(websiteNodeModules, 'meriyah', 'package.json'),
      'java-parser/package.json': path.join(websiteNodeModules, 'java-parser', 'package.json'),
      // Go WASM runtime
      'gojs': path.join(websiteNodeModules, 'astexplorer-go', 'go.js'),
      // Browser-safe fs shim with realpathSync.native etc.
      'fs': path.resolve(__dirname, 'src', 'shims', 'fs-browser.js'),
    },
  },

  resolveLoader: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      websiteNodeModules,
      'node_modules',
    ],
  },

  module: {
    rules: [
      {
        test: /\.d\.ts$/,
        use: 'null-loader',
      },
      {
        test: /\.txt$/,
        exclude: /node_modules/,
        loader: 'raw-loader',
      },
      // WASM handling: @swc/wasm-web uses import.meta.url to locate its WASM binary.
      // The import-meta-loader polyfills import.meta for webpack 4, and file-loader
      // emits the .wasm as a separate file and returns its URL.
      {
        test: /\.js$/,
        include: [
          path.join(websiteNodeModules, '@swc', 'wasm-web'),
          path.join(websiteNodeModules, 'astexplorer-syn'),
        ],
        loader: resolveFromWebsite('@open-wc/webpack-import-meta-loader'),
      },
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        include: [
          path.join(websiteNodeModules, '@swc', 'wasm-web'),
          path.join(websiteNodeModules, 'astexplorer-syn'),
          path.join(websiteNodeModules, 'astexplorer-go'),
          path.join(websiteNodeModules, '@gengjiawen', 'monkey-wasm'),
        ],
        loader: 'file-loader',
        options: {
          name(resourcePath) {
            if (resourcePath.includes('@swc')) return 'swc.wasm';
            if (resourcePath.includes('astexplorer-syn')) return 'syn.wasm';
            if (resourcePath.includes('astexplorer-go')) return 'go.wasm';
            if (resourcePath.includes('monkey-wasm')) return 'monkey.wasm';
            return '[name].[ext]';
          },
        },
      },
      // eslint4's esquery import needs the CJS build
      {
        issuer: /eslint4/,
        resolve: {
          alias: {
            'esquery': path.join(websiteNodeModules, 'esquery', 'dist', 'esquery.min.js'),
          },
        },
      },
      // eslint8 needs browser-first field resolution
      {
        issuer: /eslint8/,
        resolve: {
          mainFields: ['browser', 'main', 'module'],
        },
      },
      // Null out Node-only modules pulled in by @typescript-eslint
      {
        test: [/\/CLIEngine/, /\/globby/],
        issuer: /\/@typescript-eslint\//,
        use: 'null-loader',
      },
      // .mjs files in node_modules need explicit module type
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      // Transpile source code AND all bundled node_modules that ship ESM or modern syntax
      {
        test: /\.(jsx?|tsx?|mjs)$/,
        type: 'javascript/auto',
        include: [
          path.resolve(__dirname, 'src'),
          // --- Parser packages that ship ESM or modern syntax ---
          /\/acorn\.es\.js$/,
          /\/acorn\.mjs$/,
          /\/acorn-loose\.mjs$/,
          path.join(websiteNodeModules, '@glimmer', 'compiler', 'dist'),
          path.join(websiteNodeModules, '@glimmer', 'syntax', 'dist'),
          path.join(websiteNodeModules, '@glimmer', 'util', 'dist'),
          path.join(websiteNodeModules, '@glimmer', 'wire-format', 'dist'),
          path.join(websiteNodeModules, 'ast-types'),
          path.join(websiteNodeModules, '@babel', 'eslint-parser'),
          path.join(websiteNodeModules, 'babel-eslint'),
          path.join(websiteNodeModules, 'babel-eslint8'),
          path.join(websiteNodeModules, 'jsesc'),
          path.join(websiteNodeModules, 'eslint-visitor-keys'),
          path.join(websiteNodeModules, 'babel7'),
          path.join(websiteNodeModules, 'babel-plugin-macros'),
          path.join(websiteNodeModules, 'json-parse-better-errors'),
          path.join(websiteNodeModules, 'babylon7'),
          path.join(websiteNodeModules, 'eslint', 'lib'),
          path.join(websiteNodeModules, 'eslint-scope'),
          path.join(websiteNodeModules, 'eslint3'),
          path.join(websiteNodeModules, 'eslint4'),
          path.join(websiteNodeModules, 'jscodeshift', 'src'),
          path.join(websiteNodeModules, 'lodash-es'),
          path.join(websiteNodeModules, 'prettier'),
          path.join(websiteNodeModules, 'recast'),
          path.join(websiteNodeModules, 'regexp-tree'),
          path.join(websiteNodeModules, 'regjsparser'),
          path.join(websiteNodeModules, 'regexpp'),
          path.join(websiteNodeModules, 'simple-html-tokenizer'),
          path.join(websiteNodeModules, '@swc', 'wasm-web'),
          path.join(websiteNodeModules, 'typescript-eslint-parser'),
          path.join(websiteNodeModules, 'webidl2'),
          path.join(websiteNodeModules, 'tslint'),
          path.join(websiteNodeModules, 'tslib'),
          path.join(websiteNodeModules, 'svelte'),
          path.join(websiteNodeModules, 'css-tree'),
          path.join(websiteNodeModules, 'astexplorer-syn'),
          path.join(websiteNodeModules, 'java-parser'),
          path.join(websiteNodeModules, 'chevrotain'),
          path.join(websiteNodeModules, 'chevrotain-allstar'),
        ],
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [
            [
              resolveFromWebsite('@babel/preset-env'),
              {
                targets: { browsers: ['defaults'], node: '14' },
                modules: 'commonjs',
              },
            ],
            resolveFromWebsite('@babel/preset-react'),
            resolveFromWebsite('@babel/preset-typescript'),
          ],
          plugins: [
            resolveFromWebsite('@babel/plugin-proposal-class-properties'),
            resolveFromWebsite('@babel/plugin-proposal-optional-chaining'),
            resolveFromWebsite('@babel/plugin-transform-runtime'),
          ],
        },
      },
    ],

    noParse: [
      /traceur\/bin/,
      /typescript\/lib/,
      /esprima\/dist\/esprima\.js/,
      /esprima-fb\/esprima\.js/,
      /flow-parser\/flow_parser\.js/,
    ],
  },

  node: {
    child_process: 'empty',
    fs: false, // resolved via alias to src/shims/fs-browser.js
    module: 'empty',
    net: 'empty',
    readline: 'empty',
  },

  plugins: [
    // Resolve nested dependency versions for packages that need specific major versions.
    // NormalModuleReplacementPlugin with a function checks the context path to
    // redirect to the correct nested copy.
    // @mdx-js/mdx has many nested deps (unified@8, unist-util-visit@2, vfile@4, etc.)
    // that differ from the hoisted ESM versions. Redirect all imports from mdx context.
    {
      apply(compiler) {
        const mdxNm = path.join(websiteNodeModules, '@mdx-js', 'mdx', 'node_modules');
        const mdxNestedDeps = new Set(require('fs').readdirSync(mdxNm));
        compiler.hooks.normalModuleFactory.tap('MdxNestedDepsPlugin', (nmf) => {
          nmf.hooks.beforeResolve.tap('MdxNestedDepsPlugin', (result) => {
            if (!result || !result.context) return;
            const ctx = result.context;
            const req = result.request;
            // Check if the import is from @mdx-js context and the dep has a nested version
            if ((ctx.includes('/@mdx-js/') || ctx.includes('/remark-mdx')) && mdxNestedDeps.has(req)) {
              result.request = path.join(mdxNm, req);
            }
          });
        });
      },
    },
    // For packages that have their own nested unist-* (CJS) vs hoisted (ESM).
    // Walk up from the importing context directory to find the nearest node_modules/<dep>.
    ...[
      'unist-util-visit',
      'unist-util-visit-parents',
      'unist-util-is',
      'unist-util-stringify-position',
    ].map(dep => new webpack.NormalModuleReplacementPlugin(
      new RegExp('^' + dep.replace(/-/g, '\\-') + '$'),
      function(resource) {
        let dir = resource.context || '';
        // Walk up directories looking for a node_modules/<dep>
        while (dir.includes('/node_modules/')) {
          const candidate = path.join(dir, 'node_modules', dep);
          try { require.resolve(candidate); resource.request = candidate; return; } catch(e) {}
          dir = path.dirname(dir);
        }
      }
    )),
    new webpack.NormalModuleReplacementPlugin(/^unified$/, function(resource) {
      const ctx = resource.context || '';
      if (/\/redot$|\/redot\//.test(ctx))
        resource.request = path.join(websiteNodeModules, 'redot', 'node_modules', 'unified');
    }),
    new webpack.NormalModuleReplacementPlugin(/^trough$/, function(resource) {
      const ctx = resource.context || '';
      // Only unified@10 (at websiteNodeModules/unified/) needs trough@2.
      // Nested unified copies (redot/node_modules/unified@7, @mdx-js/mdx/node_modules/unified@8) use trough@1.
      const unifiedV10 = path.join(websiteNodeModules, 'unified');
      if (ctx.startsWith(unifiedV10 + path.sep) || ctx === unifiedV10)
        resource.request = path.join(unifiedV10, 'node_modules', 'trough');
    }),
    new webpack.NormalModuleReplacementPlugin(/^vfile$/, function(resource) {
      const ctx = resource.context || '';
      if (/\/redot$|\/redot\//.test(ctx))
        resource.request = path.join(websiteNodeModules, 'redot', 'node_modules', 'vfile');
      else if (/\/@mdx-js\/|\/remark-mdx/.test(ctx))
        resource.request = path.join(websiteNodeModules, '@mdx-js', 'mdx', 'node_modules', 'vfile');
    }),
    new webpack.NormalModuleReplacementPlugin(/^remark-parse$/, function(resource) {
      const ctx = resource.context || '';
      if (/\/remark$|\/remark\//.test(ctx))
        resource.request = path.join(websiteNodeModules, 'remark', 'node_modules', 'remark-parse');
    }),
    new webpack.NormalModuleReplacementPlugin(/^parse-entities$/, function(resource) {
      const ctx = resource.context || '';
      const rp7 = path.join(websiteNodeModules, 'remark-parse');
      if (ctx.startsWith(rp7 + path.sep) || ctx === rp7)
        resource.request = path.join(rp7, 'node_modules', 'parse-entities');
    }),
    // remark-parse@7's parse-entities@1 needs CJS versions of its deps
    new webpack.NormalModuleReplacementPlugin(
      /^(character-entities-legacy|character-entities|character-reference-invalid|is-alphanumerical|is-hexadecimal)$/,
      function(resource) {
        const ctx = resource.context || '';
        const rpNm = path.join(websiteNodeModules, 'remark-parse', 'node_modules');
        if (ctx.startsWith(rpNm) || ctx.startsWith(path.join(websiteNodeModules, 'remark-parse', 'lib'))) {
          const nested = path.join(rpNm, resource.request);
          try { require.resolve(nested); resource.request = nested; } catch(e) {}
        }
      }
    ),
    // parse-entities@1: force browser version of decode-entity (avoids character-entities dep issues)
    new webpack.NormalModuleReplacementPlugin(
      /\.\/decode-entity$/,
      function(resource) {
        if (resource.context.includes('remark-parse/node_modules/parse-entities')) {
          resource.request = './decode-entity.browser';
        }
      }
    ),

    new webpack.DefinePlugin({
      'process.env.API_HOST': JSON.stringify(''),
      'process.version': JSON.stringify(process.version),
    }),
    new webpack.IgnorePlugin(/\.md$/),
    new webpack.IgnorePlugin(/node\/nodeLoader.js/),
    // babel-eslint tries to patch eslint, but we use "parseNoPatch"
    new webpack.IgnorePlugin(/^eslint$/, /babel-eslint/),

    // Prettier: don't bundle parsers we don't use
    new webpack.IgnorePlugin(/parser-flow/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-glimmer/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-graphql/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-markdown/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-parse5/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-postcss/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-typescript/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-vue/, /\/prettier/),
    new webpack.IgnorePlugin(/parser-yaml/, /\/prettier/),

    // Go: resolve bare 'go' import to the astexplorer-go runtime
    new webpack.NormalModuleReplacementPlugin(
      /^go$/,
      path.join(websiteNodeModules, 'astexplorer-go', 'go'),
    ),

    // ESLint: shim cli-engine (Node-only) and load-rules (bundles all rules)
    new webpack.NormalModuleReplacementPlugin(
      /cli-engine/,
      'node-libs-browser/mock/empty',
    ),
    new webpack.NormalModuleReplacementPlugin(
      /load-rules/,
      path.join(__dirname, 'src', 'shims', 'loadRulesShim.js'),
    ),

    // Prettier: stub out jest-validate
    new webpack.NormalModuleReplacementPlugin(
      /jest-validate/,
      path.join(__dirname, 'src', 'shims', 'jest-validate.js'),
    ),

    // Prevent webpack from bundling the entire ESLint rules directory
    new webpack.ContextReplacementPlugin(/eslint/, /NEVER_MATCH^/),

    // Force a single output chunk
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1,
    }),
    new webpack.ProgressPlugin({
      modules: false,
      activeModules: false,
      profile: false,
    }),
  ],
};
