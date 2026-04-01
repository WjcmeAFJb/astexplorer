const HtmlWebpackPlugin = require('html-webpack-plugin')
const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(path.join(__dirname, 'CACHE_BREAKER')));

// Import shared parser config (rules, plugins, aliases) so the website builds
// parsers from source instead of using the pre-built dist. This enables proper
// code splitting — each parser's `require(['...'], cb)` becomes an async chunk.
const { getSharedConfig } = require('../packages/astexplorer-parsers/webpack.shared');
const parsersShared = getSharedConfig(webpack, path.resolve(__dirname, 'node_modules'));

const plugins = [
  new webpack.DefinePlugin({
    'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    'process.version': JSON.stringify(process.version),
  }),

  new MiniCssExtractPlugin({
    filename: DEV ? '[name].css' : `[name]-[contenthash]-${CACHE_BREAKER}.css`,
    allChunks: true,
  }),

  new HtmlWebpackPlugin({
    favicon: './favicon.png',
    inject: 'body',
    filename: 'index.html',
    template: './index.ejs',
    chunksSortMode: 'id',
  }),

  // Inline runtime and manifest into the HTML. It's small and changes after every build.
  new InlineManifestWebpackPlugin(),
  new webpack.ProgressPlugin({
    modules: false,
    activeModules: false,
    profile: false,
  }),

  // Include all parser-specific plugins (module replacement, ignores, shims)
  ...parsersShared.plugins,
];

module.exports = Object.assign({
  optimization: {
    moduleIds: DEV ? 'named' : 'hashed',
    runtimeChunk: 'single',
    splitChunks: {
      chunks: 'all',
      maxAsyncRequests: Infinity,
      cacheGroups: {
        parsers: {
          priority: 10,
          test: /\/astexplorer-parsers\//,
          chunks: 'initial',
        },
        vendors: {
          test: /\/node_modules\//,
          chunks: 'initial',
        },
      },
    },
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          keep_fnames: true,
        },
      }),
    ],
  },

  module: {
    rules: [
      {
        test: /\.d\.ts$/,
        use: 'null-loader',
      },
      // .mjs files in node_modules need explicit module type for webpack 4
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto',
      },
      {
        test: /\.(jsx?|tsx?|mjs)$/,
        type: 'javascript/auto',
        include: [
          path.join(__dirname, 'node_modules', 'react-redux', 'es'),
          path.join(__dirname, 'node_modules', 'redux', 'es'),
          path.join(__dirname, 'node_modules', 'symbol-observable', 'es'),
          path.join(__dirname, 'node_modules', 'lodash-es'),
          path.join(__dirname, 'src'),
          // Parser source + ESM/modern-syntax dependencies
          ...parsersShared.babelIncludes,
        ],
        loader: 'babel-loader',
        options: {
          babelrc: false,
          presets: [
            [
              require.resolve('@babel/preset-env'),
              {
                targets: {
                  browsers: ['defaults'],
                },
                modules: 'commonjs',
              },
            ],
            require.resolve('@babel/preset-react'),
            require.resolve('@babel/preset-typescript'),
          ],
          plugins: [
            require.resolve('@babel/plugin-proposal-class-properties'),
            require.resolve('@babel/plugin-proposal-optional-chaining'),
            require.resolve('@babel/plugin-transform-runtime'),
          ],
        },
      },
      {
        test: /\.css$/,
        use: [
          DEV ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { importLoaders: 1 },
          },
          'postcss-loader',
        ],
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'url-loader?limit=10000&mimetype=application/font-woff',
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        loader: 'file-loader',
      },
      // Parser-specific rules (WASM handling, eslint compat, etc.)
      ...parsersShared.rules,
    ],

    noParse: [
      // Parser-specific noParse (large libs that don't need analysis)
      ...parsersShared.noParse,
    ],
  },

  node: {
    child_process: 'empty',
    fs: 'empty',
    module: 'empty',
    net: 'empty',
    readline: 'empty',
  },

  plugins: plugins,

  resolveLoader: {
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ],
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
    modules: [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ],
    alias: {
      // Resolve astexplorer-parsers from source for code splitting
      'astexplorer-parsers': path.resolve(__dirname, '..', 'packages', 'astexplorer-parsers', 'src'),
      // Parser-specific aliases
      ...parsersShared.aliases,
    },
  },

  entry: {
    app: './src/app.tsx',
  },

  output: {
    path: path.resolve(__dirname, '../out'),
    filename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
    chunkFilename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
  },
},

  DEV ?
    {
      devtool: 'eval',
    } :
    {},
);
