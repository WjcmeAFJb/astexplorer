#!/usr/bin/env node
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const websiteNodeModules = path.resolve(__dirname, '..', '..', 'website', 'node_modules');
const rootNodeModules = path.resolve(__dirname, '..', '..', 'node_modules');

/** Resolve a path under node_modules, checking website then root (hoisted). */
function nm(...segments) {
  const ws = path.join(websiteNodeModules, ...segments);
  if (fs.existsSync(ws)) return ws;
  return path.join(rootNodeModules, ...segments);
}

const webpack = require(nm('webpack'));
const config = require('./webpack.config.js');

const mode = process.argv.includes('--production') ? 'production' : 'development';
config.mode = mode;

// Some third-party parsers ship broken inline source maps that crash
// webpack-sources when the main build concatenates them. Setting
// NO_SOURCE_MAPS=1 skips source-map emission so CI builds succeed.
if (process.env.NO_SOURCE_MAPS === '1') {
  config.devtool = false;
}

const distDir = path.join(__dirname, 'dist');

// Step 1: webpack bundle → dist/index.js (CJS, self-contained)
const compiler = webpack(config);
compiler.run((err, stats) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(stats.toString({ colors: true, modules: false, children: false }));
  if (stats.hasErrors()) { process.exit(1); }

  // Step 2: emit .d.ts declarations
  console.log('\nGenerating declaration files...');
  const tsc = nm('.bin', 'tsc');
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
    'swc.wasm': nm('@swc', 'wasm-web', 'wasm_bg.wasm'),
    'syn.wasm': nm('astexplorer-syn', 'astexplorer_syn_bg.wasm'),
    'go.wasm': nm('astexplorer-go', 'parser.wasm'),
    'monkey.wasm': nm('@gengjiawen', 'monkey-wasm', 'monkey_wasm_bg.wasm'),
  };
  for (const [name, src] of Object.entries(wasmSources)) {
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(distDir, name));
      console.log(`  ${name} (from ${src})`);
    } else {
      console.warn(`  ${name} SKIPPED — source not found: ${src}`);
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
  //
  // In production builds webpack's terser pass renames __webpack_require__ to
  // a short identifier (e.g. `i`), so we detect the actual name by locating
  // the chunk URL expression `<X>.p+"chunk-"` and target `<X>.p=""`.
  const wrMatch = cjsCode.match(/\b([A-Za-z_$][\w$]*)\.p\s*\+\s*"chunk-"/);
  const wrName = wrMatch ? wrMatch[1] : '__webpack_require__';
  const wrPattern = new RegExp('(' + wrName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\.p\\s*=\\s*)""', 'g');
  cjsCode = cjsCode.replace(
    wrPattern,
    '$1(typeof __webpack_public_path__!=="undefined"?__webpack_public_path__:"");globalThis.__PARSERS_WR__=' + wrName + ';void 0'
  );

  // Build a mapping from bare module names to webpack module IDs.
  //
  // Two sources:
  // 1. Webpack's own require comments: __webpack_require__(/*! fs */ "...id...")
  //    These map bare names (fs, os, path) to their polyfill module IDs.
  // 2. Module definition headers: /***/ "...node_modules/pkg-name/..."
  //    These map npm package names to their entry module IDs.
  //
  // Scan ALL code (main + chunks) so that polyfills in async chunks
  // (e.g. os-browserify loaded by typescript) are discoverable.
  const allCode = mainWithoutMap + '\n' + allChunks.join('\n');
  const bareNameToId = {};

  // Source 1: Extract from webpack's /*! name */ comments
  const wpReqPattern = /__webpack_require__\(\/\*! (\S+?) \*\/ "([^"]+)"\)/g;
  let match;
  while ((match = wpReqPattern.exec(allCode)) !== null) {
    const [, name, id] = match;
    if (!bareNameToId[name]) bareNameToId[name] = id;
  }

  // Source 2: Extract from module definition headers
  const moduleIdPattern = /\/node_modules\/([@\w][\w.\-]*(?:\/[\w.\-]+)?)\//;
  const moduleIdRegex = /\n\/\*\*\*\/ "([^"]+)":/g;
  while ((match = moduleIdRegex.exec(allCode)) !== null) {
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
    // Expose require globally so async chunks loaded via <script> tags can use it.
    // noParse'd libraries (typescript, traceur, etc.) contain bare require() calls
    // that must resolve at runtime in the global scope.
    'globalThis.require = require;',
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
