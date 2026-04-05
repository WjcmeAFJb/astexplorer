/**
 * Playwright fixture that collects V8 JS coverage from Chromium,
 * converts it to Istanbul format via v8-to-istanbul with source map
 * support, and writes coverage JSON files for merging with vitest.
 */
import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import v8toIstanbul from 'v8-to-istanbul';

const COVERAGE_DIR = path.resolve(__dirname, '..', 'coverage', 'playwright');
const OUT_DIR = path.resolve(__dirname, '..', 'out');

export const test = base.extend<{ collectCoverage: void }>({
  collectCoverage: [async ({ page }, use, testInfo) => {
    await page.coverage.startJSCoverage({
      resetOnNavigation: false,
    });

    await use();

    const entries = await page.coverage.stopJSCoverage();

    // Filter to only our app's JS files
    const appEntries = entries.filter(entry =>
      entry.url.includes('/assets/') && entry.source,
    );

    if (appEntries.length === 0) return;
    fs.mkdirSync(COVERAGE_DIR, { recursive: true });

    for (const entry of appEntries) {
      try {
        // Resolve the file on disk from the served URL
        const urlPath = new URL(entry.url).pathname;
        const filePath = path.join(OUT_DIR, urlPath);

        // Check if source map exists alongside the file
        const mapPath = filePath + '.map';
        const hasSourceMap = fs.existsSync(mapPath);

        // Create converter with source content
        // v8-to-istanbul uses the file path to find .map files
        const converter = v8toIstanbul(
          filePath,
          0,
          { source: entry.source! },
          (fpath) => {
            // Source map resolver: check if .map file exists on disk
            if (fs.existsSync(fpath + '.map')) {
              return { sourceMap: JSON.parse(fs.readFileSync(fpath + '.map', 'utf8')), source: entry.source! };
            }
            return undefined;
          },
        );

        await converter.load();
        converter.applyCoverage(entry.functions);
        const istanbulCov = converter.toIstanbul();

        // Filter to only website/src/ files (source-mapped origins)
        const filtered: Record<string, any> = {};
        for (const [filePath, data] of Object.entries(istanbulCov)) {
          // Accept paths that contain website/src/ (source-mapped from built files)
          if (filePath.includes('/website/src/') && !filePath.includes('node_modules')) {
            filtered[filePath] = data;
          }
        }

        if (Object.keys(filtered).length > 0) {
          const hash = crypto.randomBytes(8).toString('hex');
          const outFile = path.join(COVERAGE_DIR, `cov-${hash}.json`);
          fs.writeFileSync(outFile, JSON.stringify(filtered));
        }
      } catch (err) {
        // Log but don't fail the test
        console.error(`Coverage conversion failed for ${entry.url}: ${err}`);
      }
    }
  }, { auto: true }],
});

export { expect } from '@playwright/test';
