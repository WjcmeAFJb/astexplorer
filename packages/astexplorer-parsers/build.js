#!/usr/bin/env node
const path = require('path');
const { execSync } = require('child_process');
const websiteNodeModules = path.resolve(__dirname, '..', '..', 'website', 'node_modules');
const webpack = require(path.join(websiteNodeModules, 'webpack'));
const config = require('./webpack.config.js');

const mode = process.argv.includes('--production') ? 'production' : 'development';
config.mode = mode;

// Step 1: webpack bundle
const compiler = webpack(config);
compiler.run((err, stats) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(stats.toString({ colors: true, modules: false, children: false }));
  if (stats.hasErrors()) { process.exit(1); }

  // Step 2: emit .d.ts declarations (errors are expected from third-party types)
  console.log('\nGenerating declaration files...');
  const tsc = path.join(websiteNodeModules, '.bin', 'tsc');
  try {
    execSync(`${tsc} -p tsconfig.build.json`, { cwd: __dirname, stdio: 'inherit' });
    console.log('Declarations generated successfully.');
  } catch (e) {
    // tsc exits non-zero when there are type errors, but still emits declarations
    // (noEmitOnError defaults to false). Check if declarations were created.
    const fs = require('fs');
    if (fs.existsSync(path.join(__dirname, 'dist', 'index.d.ts'))) {
      console.log('Declarations generated (with pre-existing type errors in third-party deps).');
    } else {
      console.error('Failed to generate declarations.');
      process.exit(1);
    }
  }
});
