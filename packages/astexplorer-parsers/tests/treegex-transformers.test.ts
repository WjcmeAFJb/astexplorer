/**
 * Tests for tree-gex transformer integration across all parser categories.
 */
import { describe, test, expect, beforeAll } from 'vitest';
import path from 'path';
import { setup } from './setup';

beforeAll(() => { setup(); });

function loadBundle() {
  const distPath = path.resolve(__dirname, '..', 'dist', 'index.js');
  delete require.cache[distPath];
  return require(distPath);
}

type Transformer = {
  id: string;
  displayName: string;
  version?: string;
  defaultTransform: string;
  loadTransformer: (cb: (real: unknown) => void) => void;
  transform: (real: unknown, code: string, src: string) => string;
};

function loadTransformerAsync(tx: Transformer): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try { tx.loadTransformer(resolve); }
    catch (e) { reject(e); }
    setTimeout(() => reject(new Error(`loadTransformer timeout for ${tx.id}`)), 30_000);
  });
}

// WASM-based parsers that can't run in Node.js
const BROWSER_ONLY = new Set(['go', 'monkey', 'rust']);

describe('tree-gex transformers', () => {
  let bundle: ReturnType<typeof loadBundle>;

  beforeAll(() => { bundle = loadBundle(); });

  test('every category has a tree-gex transformer', () => {
    for (const cat of bundle.categories) {
      const tg = cat.transformers.find((t: Transformer) => t.id === 'tree-gex');
      expect(tg, `${cat.id} should have tree-gex`).toBeTruthy();
    }
  });

  test('all tree-gex transformers have correct metadata', () => {
    for (const cat of bundle.categories) {
      const tg = cat.transformers.find((t: Transformer) => t.id === 'tree-gex');
      expect(tg.displayName).toBe('tree-gex');
      expect(tg.version).toBeTruthy();
      expect(typeof tg.loadTransformer).toBe('function');
      expect(typeof tg.transform).toBe('function');
      expect(typeof tg.defaultTransform).toBe('string');
      expect(tg.defaultTransform.length).toBeGreaterThan(0);
    }
  });

  // Test a representative set of categories (not browser-only ones)
  const testCategories = [
    { id: 'javascript', code: 'const x = 1;' },
    { id: 'css', code: 'body { color: red; }' },
    { id: 'graphql', code: 'type Query { hello: String }' },
    { id: 'markdown', code: '# Hello\n\nWorld' },
    { id: 'json', code: '{"key": "value"}' },
    { id: 'yaml', code: 'key: value' },
    { id: 'regexp', code: '/abc/' },
  ];

  for (const { id, code } of testCategories) {
    test(`${id}: tree-gex transformer loads and runs`, async () => {
      const cat = bundle.getCategoryByID(id);
      const tg = cat.transformers.find((t: Transformer) => t.id === 'tree-gex');

      const real = await loadTransformerAsync(tg);
      expect(real).toBeTruthy();

      const transformCode = `
const w = require('tree-gex');
module.exports = {
  pattern: {
    type: w.group(w.string(), 'nodeType'),
  },
};`;
      const result = tg.transform(real, transformCode, code);
      expect(typeof result).toBe('string');
      const parsed = JSON.parse(result);
      const matches = parsed.matches ?? parsed;
      expect(Array.isArray(matches)).toBe(true);
    });
  }

  test('javascript: tree-gex captures variable declarations', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id === 'tree-gex');
    const real = await loadTransformerAsync(tg);

    const code = 'const x = 1; let y = 2; var z = 3;';
    const transformCode = `
const w = require('tree-gex');
module.exports = {
  pattern: {
    type: 'VariableDeclaration',
    kind: w.group(w.string(), 'kind'),
  },
};`;
    const result = JSON.parse(tg.transform(real, transformCode, code));
    const matches = result.matches ?? result;
    const kinds = matches.map((m: any) => m.groups?.kind?.[0]?.value);
    expect(kinds).toContain('const');
    expect(kinds).toContain('let');
    expect(kinds).toContain('var');
  });

  test('graphql: tree-gex captures node kinds', async () => {
    const cat = bundle.getCategoryByID('graphql');
    const tg = cat.transformers.find((t: Transformer) => t.id === 'tree-gex');
    const real = await loadTransformerAsync(tg);

    const code = 'type Query { hello: String }';
    const transformCode = `
const w = require('tree-gex');
module.exports = { pattern: { kind: w.group(w.string(), 'kind') } };`;
    const result = JSON.parse(tg.transform(real, transformCode, code));
    const matches = result.matches ?? result;
    const kinds = matches.map((m: any) => m.groups?.kind?.[0]?.value).filter(Boolean);
    expect(kinds).toContain('Document');
    expect(kinds).toContain('ObjectTypeDefinition');
  });

  test('sandbox require rejects unknown modules', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id === 'tree-gex');
    const real = await loadTransformerAsync(tg);

    const code = 'const x = 1;';
    const transformCode = `
const fs = require('fs');
module.exports = { pattern: {} };`;
    expect(() => tg.transform(real, transformCode, code)).toThrow("Cannot find module 'fs'");
  });

  test('sandbox require provides tree-gex', async () => {
    const cat = bundle.getCategoryByID('javascript');
    const tg = cat.transformers.find((t: Transformer) => t.id === 'tree-gex');
    const real = await loadTransformerAsync(tg);

    const code = 'const x = 1;';
    const transformCode = `
const w = require('tree-gex');
// Verify tree-gex exports are available
if (typeof w.group !== 'function') throw new Error('group missing');
if (typeof w.string !== 'function') throw new Error('string missing');
if (typeof w.any !== 'function') throw new Error('any missing');
if (typeof w.regex !== 'function') throw new Error('regex missing');
if (typeof w.accumWalkMatch !== 'function') throw new Error('accumWalkMatch missing');
module.exports = { pattern: { type: w.string() } };`;
    const result = tg.transform(real, transformCode, code);
    expect(typeof result).toBe('string');
  });
});
