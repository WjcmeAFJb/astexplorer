/**
 * Global setup: build the dist bundle before running tests.
 * This ensures tests exercise the actual webpack bundle, not source.
 */
import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import path from 'path';

const distPath = path.resolve(__dirname, '..', 'dist', 'index.js');
const srcDir = path.resolve(__dirname, '..', 'src');

function needsRebuild(): boolean {
  if (!existsSync(distPath)) return true;
  const distMtime = statSync(distPath).mtimeMs;
  // Check if any source file is newer than the dist
  function checkDir(dir: string): boolean {
    const { readdirSync } = require('fs');
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (checkDir(full)) return true;
      } else if (statSync(full).mtimeMs > distMtime) {
        return true;
      }
    }
    return false;
  }
  return checkDir(srcDir);
}

export function setup() {
  if (needsRebuild()) {
    console.log('Building parsers dist bundle...');
    execSync('node build.js', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--openssl-legacy-provider' },
    });
    console.log('Build complete.');
  } else {
    console.log('Parsers dist is up-to-date, skipping build.');
  }
}
