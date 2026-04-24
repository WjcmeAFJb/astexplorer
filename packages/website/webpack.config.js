const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineManifestWebpackPlugin = require('inline-manifest-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const fs = require('fs');
const path = require('path');
const webpack = require('webpack');

const DEV = process.env.NODE_ENV !== 'production';
const CACHE_BREAKER = Number(fs.readFileSync(path.join(__dirname, 'CACHE_BREAKER')));

// Copy WASM files from parsers dist to output
const parsersDistDir = path.resolve(__dirname, '..', 'packages', 'astexplorer-parsers', 'dist');
class CopyParsersAssetsPlugin {
  apply(compiler) {
    compiler.hooks.afterEmit.tapAsync('CopyParsersAssetsPlugin', (compilation, callback) => {
      const outputPath = compilation.outputOptions.path;
      try {
        for (const file of fs.readdirSync(parsersDistDir)) {
          if (file.endsWith('.wasm')) {
            fs.copyFileSync(path.join(parsersDistDir, file), path.join(outputPath, file));
          }
        }
      } catch (e) {
        /* parsers dist may not exist yet */
      }
      callback();
    });
  }
}

const plugins = [
  new webpack.DefinePlugin({
    'process.env.API_HOST': JSON.stringify(process.env.API_HOST || ''),
    'process.version': JSON.stringify(process.version),
  }),
  new webpack.IgnorePlugin(/\.md$/),
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
  new InlineManifestWebpackPlugin(),
  new CopyParsersAssetsPlugin(),
  new webpack.ProgressPlugin({ modules: false, activeModules: false, profile: false }),
];

module.exports = Object.assign(
  {
    optimization: {
      moduleIds: DEV ? 'named' : 'hashed',
      runtimeChunk: 'single',
      splitChunks: {
        chunks: 'initial',
        maxAsyncRequests: 5,
        cacheGroups: {
          parsers: { priority: 10, test: /\/astexplorer-parsers\// },
          vendors: { test: /\/node_modules\// },
        },
      },
      minimizer: [new TerserPlugin({ terserOptions: { keep_fnames: true } })],
    },

    module: {
      rules: [
        { test: /\.d\.ts$/, use: 'null-loader' },
        { test: /\.mjs$/, include: /node_modules/, type: 'javascript/auto' },
        {
          test: /\.(jsx?|tsx?|mjs)$/,
          type: 'javascript/auto',
          include: [
            path.join(__dirname, 'node_modules', 'react-redux', 'es'),
            path.join(__dirname, 'node_modules', 'redux', 'es'),
            path.join(__dirname, 'node_modules', 'symbol-observable', 'es'),
            path.join(__dirname, 'node_modules', 'lodash-es'),
            path.join(__dirname, 'src'),
          ],
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: [
              [
                require.resolve('@babel/preset-env'),
                { targets: { browsers: ['defaults'] }, modules: 'commonjs' },
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
            { loader: 'css-loader', options: { importLoaders: 1 } },
            'postcss-loader',
          ],
        },
        {
          test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
          loader: 'url-loader?limit=10000&mimetype=application/font-woff',
        },
        { test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/, loader: 'file-loader' },
      ],
      // The parsers dist is self-contained — skip parsing to avoid resolving internal require() calls
      noParse: [/\/astexplorer-parsers\/dist\//],
    },

    node: {
      child_process: 'empty',
      fs: 'empty',
      module: 'empty',
      net: 'empty',
      readline: 'empty',
    },

    plugins,

    resolveLoader: {
      modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.jsx', '.js', '.mjs', '.json'],
      modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    },

    entry: { app: './src/app.tsx' },

    output: {
      path: path.resolve(__dirname, '../../out'),
      filename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
      chunkFilename: DEV ? '[name].js' : `[name]-[contenthash]-${CACHE_BREAKER}.js`,
    },
  },
  DEV ? { devtool: 'eval' } : {},
);
