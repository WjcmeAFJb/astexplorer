#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const websiteNodeModules = path.resolve(__dirname, '..', '..', 'website', 'node_modules');
const webpack = require(path.join(websiteNodeModules, 'webpack'));
const config = require('./webpack.config.js');

const mode = process.argv.includes('--production') ? 'production' : 'development';
config.mode = mode;

const distDir = path.join(__dirname, 'dist');

// Step 1: webpack bundle → dist/index.js (CJS, self-contained)
const compiler = webpack(config);
compiler.run((err, stats) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(stats.toString({ colors: true, modules: false, children: false }));
  if (stats.hasErrors()) { process.exit(1); }

  // Step 2: emit .d.ts declarations
  console.log('\nGenerating declaration files...');
  const tsc = path.join(websiteNodeModules, '.bin', 'tsc');
  try {
    execSync(`${tsc} -p tsconfig.build.json`, { cwd: __dirname, stdio: 'inherit' });
    console.log('Declarations generated successfully.');
  } catch (e) {
    if (fs.existsSync(path.join(distDir, 'index.d.ts'))) {
      console.log('Declarations generated (with pre-existing type errors in third-party deps).');
    } else {
      console.error('Failed to generate declarations.');
      process.exit(1);
    }
  }

  // Step 3: Copy WASM files with stable names
  console.log('\nCopying WASM files...');
  const wasmSources = {
    'swc.wasm': path.join(websiteNodeModules, '@swc', 'wasm-web', 'wasm_bg.wasm'),
    'syn.wasm': path.join(websiteNodeModules, 'astexplorer-syn', 'astexplorer_syn_bg.wasm'),
    'go.wasm': path.join(websiteNodeModules, 'astexplorer-go', 'parser.wasm'),
    'monkey.wasm': path.join(websiteNodeModules, '@gengjiawen', 'monkey-wasm', 'monkey_wasm_bg.wasm'),
  };
  for (const [name, src] of Object.entries(wasmSources)) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(distDir, name));
      console.log(`  ${name}`);
    }
  }

  // Step 4: Make CJS entry self-contained for Node.js consumers
  //
  // Webpack's code splitting creates async chunks loaded via <script> tags.
  // This doesn't work in Node.js. Pre-load all chunks by concatenating them
  // before the main bundle — the JSONP callbacks register their modules
  // so they're available synchronously when the main bundle needs them.
  console.log('\nGenerating self-contained CJS entry...');
  const mainCode = fs.readFileSync(path.join(distDir, 'index.js'), 'utf-8');
  const chunkFiles = fs.readdirSync(distDir)
    .filter(f => f.startsWith('chunk-') && f.endsWith('.js'))
    .sort();
  const allChunks = chunkFiles.map(f => fs.readFileSync(path.join(distDir, f), 'utf-8'));
  // Chunks use push() to register with the JSONP array, which must exist.
  // The main bundle creates it, so we put chunks AFTER the main bundle.
  // Strip the main chunk's sourcemap reference since it becomes invalid
  // after concatenation (the individual chunk .map files remain valid).
  const mainWithoutMap = mainCode.replace(/\/\/# sourceMappingURL=.*$/m, '');
  fs.writeFileSync(
    path.join(distDir, 'index.js'),
    mainWithoutMap + '\n' + allChunks.join('\n'),
  );
  console.log(`  Inlined ${chunkFiles.length} chunks into index.js`);

  // Step 5: Generate ESM entry (dist/index.mjs)
  //
  // Wraps the split webpack main chunk (NOT the concatenated CJS) in ESM.
  // Async chunks are loaded at runtime via script tags using the public path.
  console.log('\nGenerating ESM entry...');
  let cjsCode = mainCode;

  // Set public path from __webpack_public_path__ (defined in the ESM wrapper
  // via import.meta.url) so webpack's async chunk loading resolves correctly.
  // Also expose __webpack_require__ for the require() stub.
  cjsCode = cjsCode.replace(
    /(__webpack_require__\.p\s*=\s*)""/g,
    '$1(typeof __webpack_public_path__!=="undefined"?__webpack_public_path__:"");globalThis.__PARSERS_WR__=__webpack_require__;void 0'
  );

  // Build a mapping from bare module names to webpack module IDs.
  //
  // Two sources:
  // 1. Webpack's own require comments: __webpack_require__(/*! fs */ "...id...")
  //    These map bare names (fs, os, path) to their polyfill module IDs.
  // 2. Module definition headers: /***/ "...node_modules/pkg-name/..."
  //    These map npm package names to their entry module IDs.
  const bareNameToId = {};

  // Source 1: Extract from webpack's /*! name */ comments
  const wpReqPattern = /__webpack_require__\(\/\*! (\S+?) \*\/ "([^"]+)"\)/g;
  let match;
  while ((match = wpReqPattern.exec(cjsCode)) !== null) {
    const [, name, id] = match;
    if (!bareNameToId[name]) bareNameToId[name] = id;
  }

  // Source 2: Extract from module definition headers
  const moduleIdPattern = /\/node_modules\/([@\w][\w.\-]*(?:\/[\w.\-]+)?)\//;
  const moduleIdRegex = /\n\/\*\*\*\/ "([^"]+)":/g;
  while ((match = moduleIdRegex.exec(cjsCode)) !== null) {
    const id = match[1];
    const m = id.match(moduleIdPattern);
    if (m) {
      const pkg = m[1];
      if (!bareNameToId[pkg]) bareNameToId[pkg] = id;
      // For polyfills: os-browserify → os, path-browserify → path, etc.
      const baseName = pkg.replace(/-browserify$/, '');
      if (baseName !== pkg && !bareNameToId[baseName]) bareNameToId[baseName] = id;
    }
  }
  const requireMap = JSON.stringify(bareNameToId);

  const esmEntry = [
    '// Public path for webpack async chunk loading — resolves relative to this module.',
    'var __webpack_public_path__ = import.meta.url.replace(/[^/]*$/, "");',
    '',
    '// CJS shims — the webpack bundle expects module/exports/require.',
    'var module = {exports: {}};',
    'var exports = module.exports;',
    'var __filename = "/index.js";',
    'var __dirname = "/";',
    // require() stub for noParse'd libraries (typescript, traceur, etc.)
    'var __requireMap = ' + requireMap + ';',
    'var require = function(m) {',
    '  var wr = globalThis.__PARSERS_WR__;',
    '  if (wr) {',
    '    var id = __requireMap[m];',
    '    if (id) { try { return wr(id); } catch(e) {} }',
    '    for (var k in wr.m) { if (k.indexOf("/" + m + "/") !== -1 || k.indexOf("/" + m + ".js") !== -1) { try { return wr(k); } catch(e) {} } }',
    '  }',
    '  return {};',
    '};',
    '',
    cjsCode,
    '',
    'var _p = module.exports;',
    'export default _p;',
    'export var categories = _p.categories;',
    'export var configureWasm = _p.configureWasm;',
    'export var getDefaultCategory = _p.getDefaultCategory;',
    'export var getDefaultParser = _p.getDefaultParser;',
    'export var getCategoryByID = _p.getCategoryByID;',
    'export var getParserByID = _p.getParserByID;',
    'export var getTransformerByID = _p.getTransformerByID;',
  ].join('\n');
  fs.writeFileSync(path.join(distDir, 'index.mjs'), esmEntry);
  console.log('ESM entry generated.');
});
