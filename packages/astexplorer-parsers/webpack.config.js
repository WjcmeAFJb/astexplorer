const path = require('path');

// Resolve webpack and build tools from the website's node_modules (the host project).
// This avoids duplicating heavy devDependencies in this package.
const websiteNodeModules = path.resolve(__dirname, '..', '..', 'website', 'node_modules');
const webpack = require(path.join(websiteNodeModules, 'webpack'));

function resolveFromWebsite(mod) {
  return require.resolve(mod, { paths: [websiteNodeModules] });
}

// Packages that have webpack 4 resolution issues (exports field, missing main, etc.).
// These are bundled into the output instead of externalized so consumers don't need
// special aliases or plugins.
const BUNDLED_PACKAGES = new Set([
  'chevrotain',
  'chevrotain-allstar',
  'meriyah',
  'java-parser',
]);

function shouldBundle(request) {
  // Relative/absolute imports — always bundle
  if (request.startsWith('.') || request.startsWith('/')) return true;
  // package.json / esy.json — bundle to avoid exports-field issues
  if (request.endsWith('/package.json') || request.endsWith('/esy.json')) return true;
  // Packages with known resolution issues
  const pkgName = request.startsWith('@')
    ? request.split('/').slice(0, 2).join('/')
    : request.split('/')[0];
  if (BUNDLED_PACKAGES.has(pkgName)) return true;
  return false;
}

module.exports = {
  // target 'node' avoids browser-specific runtime (JSONP chunk loading, window refs).
  // The output is plain CommonJS2 which any bundler (webpack, rollup, etc.) can consume.
  // Node builtins (fs, net, etc.) are shimmed to empty for browser compatibility.
  target: 'node',

  // IMPORTANT: Never use eval-based devtool (the default in development mode).
  // eval() wraps module code in strings, hiding require() calls from consumer
  // bundlers that re-process this output. source-map generates a separate .map
  // file that consumers can optionally use.
  devtool: 'source-map',

  entry: './src/index.ts',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'astexplorer-parsers',
    libraryTarget: 'commonjs2',
  },

  externals: [
    function (context, request, callback) {
      if (shouldBundle(request)) {
        return callback();
      }
      // worker-loader is a webpack loader — not a runtime dep
      if (/^worker-loader/.test(request)) {
        return callback(null, 'var {}');
      }
      // Browser-only deps: wrap in try/catch for Node.js compat.
      // codemirror uses `navigator`, react needs a DOM — both fail in Node.js.
      // Consumer bundlers still see and resolve the require() calls inside
      // the try/catch, so everything works correctly in the browser.
      if (/^codemirror/.test(request) || /^react(-is)?$/.test(request)) {
        const escaped = request.replace(/"/g, '\\"');
        return callback(null, `var (function(){try{return require("${escaped}")}catch(e){return {createElement:function(){return null}}}})() `);
      }
      // Externalize npm packages — consumers resolve them
      return callback(null, 'commonjs2 ' + request);
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
      // These aliases are needed because webpack 4 can't resolve "exports"
      // field in package.json for these packages.
      'chevrotain$': path.join(websiteNodeModules, 'chevrotain', 'lib_esm', 'src', 'api.js'),
      'chevrotain-allstar$': path.join(websiteNodeModules, 'chevrotain-allstar', 'lib', 'index.js'),
      'meriyah$': path.join(websiteNodeModules, 'meriyah', 'dist', 'meriyah.esm.js'),
      'meriyah/package.json': path.join(websiteNodeModules, 'meriyah', 'package.json'),
      'java-parser/package.json': path.join(websiteNodeModules, 'java-parser', 'package.json'),
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
      {
        // Bundled packages that ship ESM or modern syntax need transpilation
        test: /\.(jsx?|tsx?|mjs)$/,
        type: 'javascript/auto',
        include: [
          path.resolve(__dirname, 'src'),
          path.join(websiteNodeModules, 'chevrotain'),
          path.join(websiteNodeModules, 'chevrotain-allstar'),
          path.join(websiteNodeModules, 'meriyah'),
          path.join(websiteNodeModules, 'java-parser'),
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
          ],
        },
      },
    ],

    noParse: [
      /traceur\/bin/,
      /typescript\/lib/,
      /esprima\/dist\/esprima\.js/,
      /flow-parser\/flow_parser\.js/,
    ],
  },

  node: {
    // Leave __dirname/__filename as-is for Node.js compatibility.
    // In browser builds these are meaningless but harmless.
    __dirname: false,
    __filename: false,
    // Shim Node-only builtins that some parsers reference at load time
    child_process: 'empty',
    fs: 'empty',
    module: 'empty',
    net: 'empty',
    readline: 'empty',
  },

  plugins: [
    new webpack.DefinePlugin({
      'process.env.API_HOST': JSON.stringify(''),
    }),
    // Force a single output chunk. AMD-style require([deps], callback) calls
    // become synchronous, making the bundle work without a chunk-loading runtime.
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
