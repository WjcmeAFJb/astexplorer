const path = require('path');

// Resolve webpack and build tools from the website's node_modules (the host project).
// With yarn workspaces, dependencies may be hoisted to the root node_modules.
const websiteNodeModules = path.resolve(__dirname, '..', '..', 'website', 'node_modules');
const rootNodeModules = path.resolve(__dirname, '..', '..', 'node_modules');
const fs = require('fs');

/** Resolve a path under node_modules, checking website then root (hoisted). */
function nm(...segments) {
  const ws = path.join(websiteNodeModules, ...segments);
  if (fs.existsSync(ws)) return ws;
  return path.join(rootNodeModules, ...segments);
}

const webpack = require(nm('webpack'));

function resolveFromWebsite(mod) {
  return require.resolve(mod, { paths: [websiteNodeModules, rootNodeModules] });
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
    chunkFilename: 'chunk-[id].js',
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
      rootNodeModules,
      'node_modules',
    ],
    alias: {
      // webpack 4 can't resolve "exports" field in package.json for these packages
      // Only java-parser uses chevrotain; use its nested v11 globally
      // (hoisted v12 is incompatible with chevrotain-allstar's peerDep ^11)
      'chevrotain$': nm( 'java-parser', 'node_modules', 'chevrotain', 'lib', 'src', 'api.js'),
      '@chevrotain/cst-dts-gen': nm( 'java-parser', 'node_modules', '@chevrotain', 'cst-dts-gen', 'lib', 'src', 'api.js'),
      '@chevrotain/gast': nm( 'java-parser', 'node_modules', '@chevrotain', 'gast', 'lib', 'src', 'api.js'),
      '@chevrotain/regexp-to-ast': nm( 'java-parser', 'node_modules', '@chevrotain', 'regexp-to-ast', 'lib', 'src', 'api.js'),
      '@chevrotain/utils': nm( 'java-parser', 'node_modules', '@chevrotain', 'utils', 'lib', 'src', 'api.js'),
      'chevrotain-allstar$': nm( 'chevrotain-allstar', 'lib', 'index.js'),
      'meriyah$': nm( 'meriyah', 'dist', 'meriyah.esm.js'),
      'meriyah/package.json': nm( 'meriyah', 'package.json'),
      'java-parser$': nm( 'java-parser', 'src', 'index.js'),
      'java-parser/package.json': nm( 'java-parser', 'package.json'),
      // chalk v5 uses Node.js subpath imports (#imports) unsupported by webpack 4
      'chalk': nm( 'babel5', 'node_modules', 'chalk'),
      // Go WASM runtime
      'gojs': nm( 'astexplorer-go', 'go.js'),
      // Browser-safe fs shim with realpathSync.native etc.
      'fs': path.resolve(__dirname, 'src', 'shims', 'fs-browser.js'),
      // is-decimal/is-hexadecimal/is-alphabetical v2 changed to named ESM exports,
      // but remark-parse v8 (used by @mdx-js/mdx v1) expects default CJS exports.
      'is-decimal$': path.resolve(__dirname, 'src', 'shims', 'is-decimal.js'),
      'is-hexadecimal$': path.resolve(__dirname, 'src', 'shims', 'is-hexadecimal.js'),
      'is-alphabetical$': path.resolve(__dirname, 'src', 'shims', 'is-alphabetical.js'),
    },
  },

  resolveLoader: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      websiteNodeModules,
      rootNodeModules,
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
          nm( '@swc', 'wasm-web'),
          nm( 'astexplorer-syn'),
        ],
        loader: resolveFromWebsite('@open-wc/webpack-import-meta-loader'),
      },
      {
        test: /\.wasm$/,
        type: 'javascript/auto',
        include: [
          nm( '@swc', 'wasm-web'),
          nm( 'astexplorer-syn'),
          nm( 'astexplorer-go'),
          nm( '@gengjiawen', 'monkey-wasm'),
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
      // (java-parser chevrotain aliases are handled globally above)
      // eslint4's esquery and ajv imports need nested versions
      {
        issuer: /eslint4/,
        resolve: {
          alias: {
            'esquery': nm( 'esquery', 'dist', 'esquery.min.js'),
            'ajv': nm( 'eslint4', 'node_modules', 'ajv'),
          },
        },
      },
      // eslint8 needs browser-first field resolution and its nested deps
      {
        issuer: /eslint8/,
        resolve: {
          mainFields: ['browser', 'main', 'module'],
          alias: {
            'ajv': nm( 'eslint8', 'node_modules', 'ajv'),
          },
        },
      },
      // @eslint/eslintrc needs eslint8's nested deps (globals v13, ajv v6)
      {
        issuer: /@eslint[\\/]eslintrc/,
        resolve: {
          alias: {
            'globals': nm( 'eslint8', 'node_modules', 'globals'),
            'ajv': nm( 'eslint8', 'node_modules', 'ajv'),
          },
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
          nm( '@glimmer', 'compiler', 'dist'),
          nm( '@glimmer', 'syntax', 'dist'),
          nm( '@glimmer', 'util', 'dist'),
          nm( '@glimmer', 'wire-format', 'dist'),
          nm( 'ast-types'),
          nm( '@babel', 'eslint-parser'),
          nm( 'babel-eslint'),
          nm( 'babel-eslint8'),
          nm( 'jsesc'),
          nm( 'eslint-visitor-keys'),
          nm( 'babel7'),
          nm( 'babel-plugin-macros'),
          nm( 'json-parse-better-errors'),
          nm( 'babylon7'),
          nm( 'eslint', 'lib'),
          nm( 'eslint-scope'),
          nm( 'eslint3'),
          nm( 'eslint4'),
          nm( 'jscodeshift', 'src'),
          nm( 'lodash-es'),
          nm( 'prettier'),
          nm( 'recast'),
          nm( 'regexp-tree'),
          nm( 'regjsparser'),
          nm( 'regexpp'),
          nm( 'simple-html-tokenizer'),
          nm( '@swc', 'wasm-web'),
          nm( 'typescript-eslint-parser'),
          nm( 'webidl2'),
          nm( 'tslint'),
          nm( 'tslib'),
          nm( 'svelte'),
          nm( 'css-tree'),
          nm( 'astexplorer-syn'),
          nm( 'java-parser'),
          nm( 'chevrotain'),
          nm( '@chevrotain'),
          nm( 'chevrotain-allstar'),
          nm( 'meriyah'),
          nm( 'minimatch'),
          nm( 'tree-gex'),
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
            resolveFromWebsite('@babel/plugin-proposal-nullish-coalescing-operator'),
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
        const mdxNm = nm( '@mdx-js', 'mdx', 'node_modules');
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
        resource.request = nm( 'redot', 'node_modules', 'unified');
      else if (/\/remark$|\/remark\//.test(ctx))
        resource.request = nm( 'remark', 'node_modules', 'unified');
    }),
    new webpack.NormalModuleReplacementPlugin(/^trough$/, function(resource) {
      const ctx = resource.context || '';
      // remark's unified@10 needs trough@2 (ESM, named exports).
      // Other unified copies (hoisted v9, redot's v7, @mdx-js's v8) use trough@1 (CJS, default export).
      const remarkUnified = nm( 'remark', 'node_modules', 'unified');
      if (ctx.startsWith(remarkUnified + path.sep) || ctx === remarkUnified) {
        resource.request = nm('remark', 'node_modules', 'trough');
      }
    }),
    new webpack.NormalModuleReplacementPlugin(/^vfile$/, function(resource) {
      const ctx = resource.context || '';
      if (/\/redot$|\/redot\//.test(ctx))
        resource.request = nm( 'redot', 'node_modules', 'vfile');
      else if (/\/@mdx-js\/|\/remark-mdx/.test(ctx))
        resource.request = nm( '@mdx-js', 'mdx', 'node_modules', 'vfile');
      else if (/\/remark$|\/remark\//.test(ctx))
        resource.request = nm( 'remark', 'node_modules', 'vfile');
    }),
    new webpack.NormalModuleReplacementPlugin(/^remark-parse$/, function(resource) {
      const ctx = resource.context || '';
      if (/\/remark$|\/remark\//.test(ctx))
        resource.request = nm( 'remark', 'node_modules', 'remark-parse');
    }),
    new webpack.NormalModuleReplacementPlugin(/^parse-entities$/, function(resource) {
      const ctx = resource.context || '';
      const rp7 = nm( 'remark-parse');
      if (ctx.startsWith(rp7 + path.sep) || ctx === rp7)
        resource.request = path.join(rp7, 'node_modules', 'parse-entities');
    }),
    // remark-parse@7's parse-entities@1 needs CJS versions of its deps
    new webpack.NormalModuleReplacementPlugin(
      /^(character-entities-legacy|character-entities|character-reference-invalid|is-alphanumerical|is-hexadecimal)$/,
      function(resource) {
        const ctx = resource.context || '';
        const rpNm = nm( 'remark-parse', 'node_modules');
        if (ctx.startsWith(rpNm) || ctx.startsWith(nm( 'remark-parse', 'lib'))) {
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

    // remark v14's remark-stringify (and its deps) depend on ESM-only packages
    // (bail@2, ccount@2, longest-streak@3, zwitch@2, mdast-util-to-string@3, etc.)
    // that have nested versions under the unified ecosystem. Webpack 4 hoists
    // to root (older CJS versions). Walk up from the import context to find the
    // nearest nested node_modules copy, just like the unist-util-* handler above.
    ...[
      'bail', 'ccount', 'longest-streak', 'zwitch',
      'mdast-util-phrasing', 'mdast-util-to-string',
      'comma-separated-tokens', 'space-separated-tokens', 'property-information',
      'is-plain-obj',
    ].map(dep => new webpack.NormalModuleReplacementPlugin(
      new RegExp('^' + dep.replace(/-/g, '\\-') + '$'),
      function(resource) {
        let dir = resource.context || '';
        while (dir.includes('/node_modules/')) {
          const candidate = path.join(dir, 'node_modules', dep);
          try { require.resolve(candidate); resource.request = candidate; return; } catch(e) {}
          dir = path.dirname(dir);
        }
      }
    )),

    new webpack.DefinePlugin({
      'process.env.API_HOST': JSON.stringify(''),
      'process.version': JSON.stringify(process.version),
      'process.versions': JSON.stringify({ node: process.version.replace(/^v/, '') }),
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
      nm( 'astexplorer-go', 'go'),
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

    // Merge very small chunks to reduce HTTP requests
    new webpack.optimize.MinChunkSizePlugin({
      minChunkSize: 10000, // ~10KB minimum
    }),
    new webpack.ProgressPlugin({
      modules: false,
      activeModules: false,
      profile: false,
    }),
  ],
};
