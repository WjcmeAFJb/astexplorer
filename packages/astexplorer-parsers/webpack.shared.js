/**
 * Shared webpack configuration for the parsers package.
 *
 * Used by both:
 * - The parsers' own webpack config (for building dist/index.js for Node.js)
 * - The website webpack config (for building from source with code splitting)
 *
 * Call getSharedConfig(webpack, nodeModulesDir) to get { rules, plugins, aliases, noParse }.
 */
const path = require('path');
const fs = require('fs');

function getSharedConfig(webpack, nodeModulesDir) {
  const parsersDir = path.resolve(__dirname, 'src');
  const shimsDir = path.join(parsersDir, 'shims');

  // -----------------------------------------------------------------------
  // Resolve aliases (webpack 4 can't resolve "exports" field for these)
  // -----------------------------------------------------------------------
  const aliases = {
    'chevrotain$': path.join(nodeModulesDir, 'chevrotain', 'lib_esm', 'src', 'api.js'),
    'chevrotain-allstar$': path.join(nodeModulesDir, 'chevrotain-allstar', 'lib', 'index.js'),
    'meriyah$': path.join(nodeModulesDir, 'meriyah', 'dist', 'meriyah.esm.js'),
    'meriyah/package.json': path.join(nodeModulesDir, 'meriyah', 'package.json'),
    'java-parser/package.json': path.join(nodeModulesDir, 'java-parser', 'package.json'),
    'gojs': path.join(nodeModulesDir, 'astexplorer-go', 'go.js'),
  };

  // -----------------------------------------------------------------------
  // Module rules specific to parsers
  // -----------------------------------------------------------------------
  const rules = [
    // .txt files in parsers source (code examples)
    {
      test: /\.txt$/,
      include: parsersDir,
      loader: 'raw-loader',
    },
    // WASM handling: import-meta-loader polyfills import.meta for webpack 4
    {
      test: /\.js$/,
      include: [
        path.join(nodeModulesDir, '@swc', 'wasm-web'),
        path.join(nodeModulesDir, 'astexplorer-syn'),
      ],
      loader: require.resolve('@open-wc/webpack-import-meta-loader', { paths: [nodeModulesDir] }),
    },
    // WASM files: emit as files, return URL
    {
      test: /\.wasm$/,
      type: 'javascript/auto',
      include: [
        path.join(nodeModulesDir, '@swc', 'wasm-web'),
        path.join(nodeModulesDir, 'astexplorer-syn'),
        path.join(nodeModulesDir, 'astexplorer-go'),
        path.join(nodeModulesDir, '@gengjiawen', 'monkey-wasm'),
      ],
      loader: 'file-loader',
    },
    // eslint4's esquery import needs the CJS build
    {
      issuer: /eslint4/,
      resolve: {
        alias: {
          'esquery': path.join(nodeModulesDir, 'esquery', 'dist', 'esquery.min.js'),
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
  ];

  // -----------------------------------------------------------------------
  // noParse rules for large files that don't need webpack analysis
  // -----------------------------------------------------------------------
  const noParse = [
    /traceur\/bin/,
    /typescript\/lib/,
    /esprima\/dist\/esprima\.js/,
    /esprima-fb\/esprima\.js/,
    /flow-parser\/flow_parser\.js/,
  ];

  // -----------------------------------------------------------------------
  // Babel-loader include list for ESM/modern-syntax packages
  // -----------------------------------------------------------------------
  const babelIncludes = [
    parsersDir,
    /\/acorn\.es\.js$/,
    /\/acorn\.mjs$/,
    /\/acorn-loose\.mjs$/,
    path.join(nodeModulesDir, '@glimmer', 'compiler', 'dist'),
    path.join(nodeModulesDir, '@glimmer', 'syntax', 'dist'),
    path.join(nodeModulesDir, '@glimmer', 'util', 'dist'),
    path.join(nodeModulesDir, '@glimmer', 'wire-format', 'dist'),
    path.join(nodeModulesDir, 'ast-types'),
    path.join(nodeModulesDir, '@babel', 'eslint-parser'),
    path.join(nodeModulesDir, 'babel-eslint'),
    path.join(nodeModulesDir, 'babel-eslint8'),
    path.join(nodeModulesDir, 'jsesc'),
    path.join(nodeModulesDir, 'eslint-visitor-keys'),
    path.join(nodeModulesDir, 'babel7'),
    path.join(nodeModulesDir, 'babel-plugin-macros'),
    path.join(nodeModulesDir, 'json-parse-better-errors'),
    path.join(nodeModulesDir, 'babylon7'),
    path.join(nodeModulesDir, 'eslint', 'lib'),
    path.join(nodeModulesDir, 'eslint-scope'),
    path.join(nodeModulesDir, 'eslint3'),
    path.join(nodeModulesDir, 'eslint4'),
    path.join(nodeModulesDir, 'jscodeshift', 'src'),
    path.join(nodeModulesDir, 'lodash-es'),
    path.join(nodeModulesDir, 'prettier'),
    path.join(nodeModulesDir, 'recast'),
    path.join(nodeModulesDir, 'regexp-tree'),
    path.join(nodeModulesDir, 'regjsparser'),
    path.join(nodeModulesDir, 'regexpp'),
    path.join(nodeModulesDir, 'simple-html-tokenizer'),
    path.join(nodeModulesDir, '@swc', 'wasm-web'),
    path.join(nodeModulesDir, 'typescript-eslint-parser'),
    path.join(nodeModulesDir, 'webidl2'),
    path.join(nodeModulesDir, 'tslint'),
    path.join(nodeModulesDir, 'tslib'),
    path.join(nodeModulesDir, 'svelte'),
    path.join(nodeModulesDir, 'css-tree'),
    path.join(nodeModulesDir, 'astexplorer-syn'),
    path.join(nodeModulesDir, 'java-parser'),
    path.join(nodeModulesDir, 'chevrotain'),
    path.join(nodeModulesDir, 'chevrotain-allstar'),
  ];

  // -----------------------------------------------------------------------
  // Plugins for module resolution fixes
  // -----------------------------------------------------------------------
  const plugins = [];

  // --- Nested dependency resolution (ESM/CJS version mismatches) ---

  // @mdx-js/mdx nested deps
  const mdxNm = path.join(nodeModulesDir, '@mdx-js', 'mdx', 'node_modules');
  if (fs.existsSync(mdxNm)) {
    const mdxNestedDeps = new Set(fs.readdirSync(mdxNm));
    plugins.push({
      apply(compiler) {
        compiler.hooks.normalModuleFactory.tap('MdxNestedDepsPlugin', (nmf) => {
          nmf.hooks.beforeResolve.tap('MdxNestedDepsPlugin', (result) => {
            if (!result || !result.context) return;
            const ctx = result.context;
            if ((ctx.includes('/@mdx-js/') || ctx.includes('/remark-mdx')) && mdxNestedDeps.has(result.request)) {
              result.request = path.join(mdxNm, result.request);
            }
          });
        });
      },
    });
  }

  // unist-util-* walk-up resolution
  ['unist-util-visit', 'unist-util-visit-parents', 'unist-util-is', 'unist-util-stringify-position']
    .forEach(dep => {
      plugins.push(new webpack.NormalModuleReplacementPlugin(
        new RegExp('^' + dep.replace(/-/g, '\\-') + '$'),
        function(resource) {
          let dir = resource.context || '';
          while (dir.includes('/node_modules/')) {
            const candidate = path.join(dir, 'node_modules', dep);
            try { require.resolve(candidate); resource.request = candidate; return; } catch(e) {}
            dir = path.dirname(dir);
          }
        }
      ));
    });

  // unified version resolution
  plugins.push(new webpack.NormalModuleReplacementPlugin(/^unified$/, function(resource) {
    const ctx = resource.context || '';
    if (/\/redot$|\/redot\//.test(ctx))
      resource.request = path.join(nodeModulesDir, 'redot', 'node_modules', 'unified');
  }));

  // trough: only unified@10 needs trough@2
  plugins.push(new webpack.NormalModuleReplacementPlugin(/^trough$/, function(resource) {
    const ctx = resource.context || '';
    const unifiedV10 = path.join(nodeModulesDir, 'unified');
    if (ctx.startsWith(unifiedV10 + path.sep) || ctx === unifiedV10)
      resource.request = path.join(unifiedV10, 'node_modules', 'trough');
  }));

  // vfile version resolution
  plugins.push(new webpack.NormalModuleReplacementPlugin(/^vfile$/, function(resource) {
    const ctx = resource.context || '';
    if (/\/redot$|\/redot\//.test(ctx))
      resource.request = path.join(nodeModulesDir, 'redot', 'node_modules', 'vfile');
    else if (/\/@mdx-js\/|\/remark-mdx/.test(ctx))
      resource.request = path.join(nodeModulesDir, '@mdx-js', 'mdx', 'node_modules', 'vfile');
  }));

  // remark-parse: remark@14 needs remark-parse@10
  plugins.push(new webpack.NormalModuleReplacementPlugin(/^remark-parse$/, function(resource) {
    const ctx = resource.context || '';
    if (/\/remark$|\/remark\//.test(ctx))
      resource.request = path.join(nodeModulesDir, 'remark', 'node_modules', 'remark-parse');
  }));

  // parse-entities: remark-parse@7 needs parse-entities@1
  const rp7 = path.join(nodeModulesDir, 'remark-parse');
  plugins.push(new webpack.NormalModuleReplacementPlugin(/^parse-entities$/, function(resource) {
    const ctx = resource.context || '';
    if (ctx.startsWith(rp7 + path.sep) || ctx === rp7)
      resource.request = path.join(rp7, 'node_modules', 'parse-entities');
  }));

  // character-entities-* CJS versions for parse-entities@1
  plugins.push(new webpack.NormalModuleReplacementPlugin(
    /^(character-entities-legacy|character-entities|character-reference-invalid|is-alphanumerical|is-hexadecimal)$/,
    function(resource) {
      const ctx = resource.context || '';
      const rpNm = path.join(nodeModulesDir, 'remark-parse', 'node_modules');
      if (ctx.startsWith(rpNm) || ctx.startsWith(path.join(nodeModulesDir, 'remark-parse', 'lib'))) {
        const nested = path.join(rpNm, resource.request);
        try { require.resolve(nested); resource.request = nested; } catch(e) {}
      }
    }
  ));

  // parse-entities@1 browser decode-entity
  plugins.push(new webpack.NormalModuleReplacementPlugin(
    /\.\/decode-entity$/,
    function(resource) {
      if (resource.context.includes('remark-parse/node_modules/parse-entities')) {
        resource.request = './decode-entity.browser';
      }
    }
  ));

  // --- Other plugins ---
  plugins.push(new webpack.IgnorePlugin(/\.md$/));
  plugins.push(new webpack.IgnorePlugin(/node\/nodeLoader.js/));
  plugins.push(new webpack.IgnorePlugin(/^eslint$/, /babel-eslint/));

  // Prettier: don't bundle parsers we don't use
  ['flow', 'glimmer', 'graphql', 'markdown', 'parse5', 'postcss', 'typescript', 'vue', 'yaml']
    .forEach(p => plugins.push(new webpack.IgnorePlugin(new RegExp('parser-' + p), /\/prettier/)));

  plugins.push(new webpack.NormalModuleReplacementPlugin(/^go$/, path.join(nodeModulesDir, 'astexplorer-go', 'go')));
  plugins.push(new webpack.NormalModuleReplacementPlugin(/cli-engine/, 'node-libs-browser/mock/empty'));
  plugins.push(new webpack.NormalModuleReplacementPlugin(/load-rules/, path.join(shimsDir, 'loadRulesShim.js')));
  plugins.push(new webpack.NormalModuleReplacementPlugin(/jest-validate/, path.join(shimsDir, 'jest-validate.js')));
  plugins.push(new webpack.ContextReplacementPlugin(/eslint/, /NEVER_MATCH^/));

  return { rules, plugins, aliases, noParse, babelIncludes, parsersDir };
}

module.exports = { getSharedConfig };
