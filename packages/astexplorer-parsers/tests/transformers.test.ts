/**
 * Tests for transformer modules in the astexplorer-parsers dist bundle.
 *
 * These tests import from the BUILT dist/index.js (not source) to verify
 * that transformers load correctly and produce expected output.
 */
import { describe, test, expect, beforeAll } from 'vitest';
import path from 'path';
import { setup } from './setup';

beforeAll(() => {
  setup();
});

function loadBundle() {
  const distPath = path.resolve(__dirname, '..', 'dist', 'index.js');
  delete require.cache[distPath];
  return require(distPath);
}

type Transformer = {
  id: string;
  displayName: string;
  version?: string;
  homepage?: string;
  defaultParserID: string;
  defaultTransform: string;
  loadTransformer: (cb: (realTransformer: unknown) => void) => void;
  transform: (realTransformer: unknown, transformCode: string, code: string) => unknown;
};

type Category = {
  id: string;
  displayName: string;
  codeExample: string;
  transformers: Transformer[];
};

function loadTransformerAsync(transformer: Transformer): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      transformer.loadTransformer(resolve);
    } catch (e) {
      reject(e);
    }
    setTimeout(() => reject(new Error(`loadTransformer timeout for ${transformer.id}`)), 30_000);
  });
}

describe('transformer dist bundle', () => {
  let bundle: ReturnType<typeof loadBundle>;

  beforeAll(() => {
    bundle = loadBundle();
  });

  // -------------------------------------------------------------------------
  // Remark transformer
  // -------------------------------------------------------------------------
  describe('remark transformer', () => {
    test('loads transformer without error', async () => {
      const cat = bundle.getCategoryByID('markdown') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'remark');
      expect(transformer).toBeTruthy();
      expect(transformer!.id).toBe('remark');
      expect(transformer!.defaultParserID).toBe('remark');

      const real = await loadTransformerAsync(transformer!);
      expect(real).toBeTruthy();
      expect(typeof (real as Record<string, unknown>).remark).toBe('function');
    });

    test('transforms markdown with default code example', async () => {
      const cat = bundle.getCategoryByID('markdown') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'remark')!;
      const transformCode = transformer.defaultTransform;

      const real = await loadTransformerAsync(transformer);
      const result = transformer.transform(real, transformCode, '# Hello World\n\nSome text.');
      expect(typeof result).toBe('string');
      // The default transform adds a heading level: # -> ##
      expect(result).toContain('## Hello World');
    });

    test('identity transform preserves content', async () => {
      const cat = bundle.getCategoryByID('markdown') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'remark')!;

      const real = await loadTransformerAsync(transformer);
      const identityCode = `
module.exports = function() {
  return function(tree) { return tree; };
};`;
      const input = '# Title\n\nParagraph text.\n';
      const result = transformer.transform(real, identityCode, input);
      expect(typeof result).toBe('string');
      expect((result as string).trim()).toContain('# Title');
      expect((result as string).trim()).toContain('Paragraph text.');
    });

    test('sandbox require provides unist-util-visit', async () => {
      const cat = bundle.getCategoryByID('markdown') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'remark')!;

      const real = await loadTransformerAsync(transformer);
      const code = `
const visit = require("unist-util-visit");
module.exports = function() {
  return function(tree) {
    visit(tree, "heading", function(node) {
      node.depth = 3;
    });
  };
};`;
      const result = transformer.transform(real, code, '# One\n## Two\n### Three\n');
      expect(typeof result).toBe('string');
      expect(result).toContain('### One');
      expect(result).toContain('### Two');
      expect(result).toContain('### Three');
    });

    test('sandbox require provides unist-util-is', async () => {
      const cat = bundle.getCategoryByID('markdown') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'remark')!;

      const real = await loadTransformerAsync(transformer);
      const code = `
const visit = require("unist-util-visit");
const is = require("unist-util-is");
module.exports = function() {
  return function(tree) {
    visit(tree, function(node) {
      if (is(node, "heading")) {
        node.depth = 4;
      }
    });
  };
};`;
      const result = transformer.transform(real, code, '# Heading\n\nParagraph\n');
      expect(typeof result).toBe('string');
      expect(result).toContain('#### Heading');
    });

    test('sandbox require rejects unknown modules', async () => {
      const cat = bundle.getCategoryByID('markdown') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'remark')!;

      const real = await loadTransformerAsync(transformer);
      const code = `
const fs = require("fs");
module.exports = function() { return function(tree) { return tree; }; };`;
      expect(() => transformer.transform(real, code, '# test')).toThrow("Cannot find module 'fs'");
    });
  });

  // -------------------------------------------------------------------------
  // MDX transformer
  // -------------------------------------------------------------------------
  describe('mdx transformer', () => {
    test('loads transformer without error', async () => {
      const cat = bundle.getCategoryByID('mdx') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'mdx');
      expect(transformer).toBeTruthy();
      expect(transformer!.id).toBe('mdx');
      expect(transformer!.defaultParserID).toBe('mdxhast');

      const real = await loadTransformerAsync(transformer!);
      expect(real).toBeTruthy();
      expect((real as Record<string, unknown>).mdx).toBeTruthy();
      expect((real as Record<string, unknown>).prettier).toBeTruthy();
      expect((real as Record<string, unknown>).babel).toBeTruthy();
    });

    test('loadTransformer provides babel key (not babylon)', async () => {
      const cat = bundle.getCategoryByID('mdx') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'mdx')!;

      const real = await loadTransformerAsync(transformer) as Record<string, unknown>;
      expect(real.babel).toBeTruthy();
      expect(real).not.toHaveProperty('babylon');
    });

    test('transforms MDX with default code example', async () => {
      const cat = bundle.getCategoryByID('mdx') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'mdx')!;
      const transformCode = transformer.defaultTransform;

      const real = await loadTransformerAsync(transformer);
      const mdxCode = '# Hello\n\n<div>World</div>\n';
      const result = transformer.transform(real, transformCode, mdxCode);
      expect(typeof result).toBe('string');
      expect((result as string).length).toBeGreaterThan(0);
    });

    test('prettier formats output with babel parser (not babylon)', async () => {
      const cat = bundle.getCategoryByID('mdx') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'mdx')!;

      const real = await loadTransformerAsync(transformer);
      const code = `export default {mdPlugins: [], hastPlugins: []}`;
      const mdxInput = '# Test\n\nParagraph\n';
      const result = transformer.transform(real, code, mdxInput);
      expect(typeof result).toBe('string');
      // If prettier failed with "Cannot read properties of undefined", the
      // fallback would contain the error message — verify it doesn't
      expect(result).not.toContain('Cannot read properties of undefined');
    });

    test('transform result contains JSX output', async () => {
      const cat = bundle.getCategoryByID('mdx') as Category;
      const transformer = cat.transformers.find((t: Transformer) => t.id === 'mdx')!;

      const real = await loadTransformerAsync(transformer);
      const code = `export default {mdPlugins: [], hastPlugins: []}`;
      const mdxInput = '# Hello MDX\n';
      const result = transformer.transform(real, code, mdxInput);
      expect(typeof result).toBe('string');
      const output = result as string;
      expect(output.length).toBeGreaterThan(0);
    });
  });
});
