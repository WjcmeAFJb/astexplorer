#!/usr/bin/env node
/**
 * Merge coverage from vitest (unit + browser) and Playwright into a single
 * Istanbul coverage report. Deduplicates by file path and merges hit counts.
 *
 * Usage: node scripts/merge-coverage.mjs
 *
 * Reads from:
 *   - website/coverage/coverage-final.json (vitest)
 *   - coverage/playwright/*.json (Playwright)
 *
 * Writes to:
 *   - coverage/merged/coverage-final.json
 *   - coverage/merged/lcov.info (for external tools)
 *   - Prints text summary to stdout
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import libCoverage from 'istanbul-lib-coverage';
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
const { createCoverageMap } = libCoverage;
const { createContext } = libReport;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function normalizePath(p) {
  // Normalize all paths to be relative to the website/src directory
  // This ensures vitest and Playwright coverage use the same keys
  const srcIdx = p.indexOf('/website/src/');
  if (srcIdx !== -1) {
    return path.resolve(ROOT, 'website', 'src', p.slice(srcIdx + '/website/src/'.length));
  }
  return p;
}

function normalizeReport(report) {
  const normalized = {};
  for (const [key, value] of Object.entries(report)) {
    const normKey = normalizePath(key);
    // Update the path inside the coverage data too
    const updated = { ...value, path: normKey };
    normalized[normKey] = updated;
  }
  return normalized;
}

// Collect all coverage files
const coverageMap = createCoverageMap({});

// 1. Load vitest coverage (primary source — accurate statement boundaries)
const vitestCov = loadJson(path.join(ROOT, 'website', 'coverage', 'coverage-final.json'));
const vitestFiles = new Set();
if (vitestCov) {
  const normalized = normalizeReport(vitestCov);
  coverageMap.merge(normalized);
  for (const key of Object.keys(normalized)) vitestFiles.add(key);
  console.log(`Loaded vitest coverage: ${vitestFiles.size} files`);
} else {
  console.log('No vitest coverage found (run: cd website && npx vitest run --coverage)');
}

// 2. Load Playwright coverage — ONLY for files NOT already covered by vitest.
//    Vitest and Playwright V8 coverage produce different Istanbul statement
//    boundaries for the same source file (due to different source map chains).
//    Merging both would double-count statements. Instead, we use Playwright
//    coverage exclusively for files that vitest excludes from coverage
//    (e.g., app.tsx, JSCodeshiftEditor.ts, types that have runtime code).
const playwrightDir = path.join(ROOT, 'coverage', 'playwright');
let playwrightFiles = 0;
let playwrightNewFiles = 0;
let playwrightSkipped = 0;
if (fs.existsSync(playwrightDir)) {
  for (const file of fs.readdirSync(playwrightDir)) {
    if (file.endsWith('.json')) {
      const data = loadJson(path.join(playwrightDir, file));
      if (data) {
        const normalized = normalizeReport(data);
        playwrightFiles++;
        for (const [key, value] of Object.entries(normalized)) {
          if (!vitestFiles.has(key)) {
            // New file not in vitest — add directly
            coverageMap.merge({ [key]: value });
            playwrightNewFiles++;
          } else {
            // Overlapping file — supplement vitest coverage with
            // Playwright hits. Use vitest's statement/branch/function
            // maps (they have accurate source positions) but add any
            // additional hit counts from Playwright for uncovered lines.
            const existing = coverageMap.fileCoverageFor(key).toJSON();
            const pw = value;

            // For each statement in vitest coverage that has 0 hits,
            // check if Playwright covered a statement at a similar line
            let added = 0;
            const pwLineHits = {};
            // Build a line→hit map from Playwright's statements
            if (pw.statementMap && pw.s) {
              for (const [sid, loc] of Object.entries(pw.statementMap)) {
                if (pw.s[sid] > 0) {
                  const line = loc.start?.line;
                  if (line) pwLineHits[line] = (pwLineHits[line] || 0) + pw.s[sid];
                }
              }
            }

            // Apply Playwright hits to vitest's uncovered statements
            if (existing.statementMap && existing.s) {
              for (const [sid, loc] of Object.entries(existing.statementMap)) {
                if (existing.s[sid] === 0) {
                  const line = loc.start?.line;
                  if (line && pwLineHits[line]) {
                    existing.s[sid] = pwLineHits[line];
                    added++;
                  }
                }
              }
            }

            // Same for branches
            if (existing.branchMap && existing.b && pw.branchMap && pw.b) {
              const pwBranchLines = {};
              for (const [bid, branch] of Object.entries(pw.branchMap)) {
                const line = branch.loc?.start?.line;
                if (line && pw.b[bid]) {
                  pwBranchLines[line] = pw.b[bid];
                }
              }
              for (const [bid, branch] of Object.entries(existing.branchMap)) {
                const line = branch.loc?.start?.line;
                if (line && pwBranchLines[line] && existing.b[bid]) {
                  for (let i = 0; i < existing.b[bid].length; i++) {
                    if (existing.b[bid][i] === 0 && pwBranchLines[line][i] > 0) {
                      existing.b[bid][i] = pwBranchLines[line][i];
                      added++;
                    }
                  }
                }
              }
            }

            // Same for functions
            if (existing.fnMap && existing.f && pw.fnMap && pw.f) {
              const pwFnLines = {};
              for (const [fid, fn] of Object.entries(pw.fnMap)) {
                const line = fn.loc?.start?.line || fn.decl?.start?.line;
                if (line && pw.f[fid] > 0) {
                  pwFnLines[line] = pw.f[fid];
                }
              }
              for (const [fid, fn] of Object.entries(existing.fnMap)) {
                const line = fn.loc?.start?.line || fn.decl?.start?.line;
                if (line && existing.f[fid] === 0 && pwFnLines[line]) {
                  existing.f[fid] = pwFnLines[line];
                  added++;
                }
              }
            }

            if (added > 0) {
              // Re-merge the updated coverage
              coverageMap.merge({ [key]: existing });
              playwrightNewFiles++;
            }
            playwrightSkipped++;
          }
        }
      }
    }
  }
  console.log(`Loaded Playwright coverage: ${playwrightFiles} files`);
  console.log(`  New files from Playwright (not in vitest): ${playwrightNewFiles}`);
  console.log(`  Skipped overlapping entries: ${playwrightSkipped} (vitest coverage preferred)`);
} else {
  console.log('No Playwright coverage found (run: npx playwright test)');
}

// 3. Write merged output
const mergedDir = path.join(ROOT, 'coverage', 'merged');
fs.mkdirSync(mergedDir, { recursive: true });

// Write merged coverage-final.json
const mergedJson = {};
for (const file of coverageMap.files()) {
  mergedJson[file] = coverageMap.fileCoverageFor(file).toJSON();
}
fs.writeFileSync(
  path.join(mergedDir, 'coverage-final.json'),
  JSON.stringify(mergedJson, null, 2),
);

// 4. Generate text report
const context = createContext({
  dir: mergedDir,
  coverageMap,
  defaultSummarizer: 'nested',
});

const textReport = reports.create('text', {});
const lcovReport = reports.create('lcov', {});

console.log('\n========== MERGED COVERAGE REPORT ==========\n');
textReport.execute(context);
lcovReport.execute(context);

// 5. Print summary comparison
const summary = coverageMap.getCoverageSummary();
console.log('\n========== SUMMARY ==========');
console.log(`Lines:      ${summary.lines.pct}%`);
console.log(`Branches:   ${summary.branches.pct}%`);
console.log(`Functions:  ${summary.functions.pct}%`);
console.log(`Statements: ${summary.statements.pct}%`);
console.log(`\nMerged report written to: ${mergedDir}`);
