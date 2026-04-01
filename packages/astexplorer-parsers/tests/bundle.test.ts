/**
 * Comprehensive snapshot tests for the astexplorer-parsers dist bundle.
 *
 * These tests import from the BUILT dist/index.js (not source) to verify
 * that the webpack bundle works correctly for Node.js consumers.
 *
 * Each test:
 *   1. Loads the parser via its callback-based loadParser() method
 *   2. Parses the category's code example (the same snippet shown in the UI)
 *   3. Snapshots the resulting AST
 */
import { describe, test, expect, beforeAll } from 'vitest';
import path from 'path';
import { setup } from './setup';

// ---------------------------------------------------------------------------
// Build dist before all tests
// ---------------------------------------------------------------------------

beforeAll(() => { setup(); });

// ---------------------------------------------------------------------------
// Import from the BUILT bundle — this is what Node.js consumers use.
// ---------------------------------------------------------------------------

function loadBundle() {
  const distPath = path.resolve(__dirname, '..', 'dist', 'index.js');
  delete require.cache[distPath];
  return require(distPath);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Parser = {
  id: string;
  displayName: string;
  version?: string;
  homepage?: string;
  showInMenu: boolean;
  category: { id: string; codeExample: string };
  loadParser: (cb: (realParser: unknown) => void) => void;
  parse: (realParser: unknown, code: string, options: Record<string, unknown>) => unknown;
  getDefaultOptions: () => Record<string, unknown>;
  nodeToRange: (node: unknown) => [number, number] | null | undefined;
  getNodeName: (node: unknown) => string | undefined;
  forEachProperty: (node: unknown) => Iterable<{ value: unknown; key: string; computed: boolean }>;
};

type Category = {
  id: string;
  displayName: string;
  codeExample: string;
  parsers: Parser[];
};

/** Promise-based wrapper around the callback-based loadParser. */
function loadParserAsync(parser: Parser): Promise<unknown> {
  return new Promise((resolve, reject) => {
    try {
      parser.loadParser(resolve);
    } catch (e) {
      reject(e);
    }
    setTimeout(() => reject(new Error(`loadParser timeout for ${parser.id}`)), 20_000);
  });
}

/**
 * Trim an AST for snapshotting: remove location data and functions,
 * keep only the structural content, and limit depth to avoid huge snapshots.
 */
function trimAst(node: unknown, depth = 0, maxDepth = 4): unknown {
  if (depth > maxDepth) return '...';
  if (node === null || node === undefined) return node;
  if (typeof node === 'function') return '[Function]';
  if (typeof node !== 'object') return node;
  if (Array.isArray(node)) {
    if (node.length > 10) {
      return [...node.slice(0, 5).map(n => trimAst(n, depth + 1, maxDepth)), `... ${node.length - 5} more`];
    }
    return node.map(n => trimAst(n, depth + 1, maxDepth));
  }
  const obj: Record<string, unknown> = {};
  const locationKeys = new Set(['start', 'end', 'loc', 'range', 'position', 'pos', 'span', 'offset', 'line', 'column', 'index', 'id']);
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (locationKeys.has(key)) continue;
    if (typeof value === 'function') continue;
    obj[key] = trimAst(value, depth + 1, maxDepth);
  }
  return obj;
}

// WASM-based parsers that require browser APIs (fetch, WebAssembly with URL loading)
// and cannot run in Node.js.
const BROWSER_ONLY_PARSERS = new Set(['go', 'monkey', 'rust', 'swc']);

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('parsers dist bundle', () => {
  let categories: Category[];
  let bundle: ReturnType<typeof loadBundle>;

  beforeAll(() => {
    bundle = loadBundle();
    categories = bundle.categories;
  });

  // -----------------------------------------------------------------------
  // Registry tests
  // -----------------------------------------------------------------------

  describe('registry', () => {
    test('exports categories array', () => {
      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
    });

    test('all expected categories are present', () => {
      const ids = categories.map(c => c.id).sort();
      expect(ids).toMatchSnapshot();
    });

    test('each category has required fields', () => {
      for (const cat of categories) {
        expect(cat.id).toBeTruthy();
        expect(cat.displayName).toBeTruthy();
        expect(typeof cat.codeExample).toBe('string');
        expect(cat.codeExample.length).toBeGreaterThan(0);
        expect(Array.isArray(cat.parsers)).toBe(true);
        expect(cat.parsers.length).toBeGreaterThan(0);
      }
    });

    test('parsers with showInMenu have required fields', () => {
      for (const cat of categories) {
        for (const parser of cat.parsers.filter(p => p.showInMenu)) {
          expect(parser.id, `parser in ${cat.id}`).toBeTruthy();
          expect(typeof parser.loadParser, `${parser.id}.loadParser`).toBe('function');
          expect(typeof parser.parse, `${parser.id}.parse`).toBe('function');
          expect(typeof parser.getNodeName, `${parser.id}.getNodeName`).toBe('function');
          expect(typeof parser.nodeToRange, `${parser.id}.nodeToRange`).toBe('function');
          expect(typeof parser.forEachProperty, `${parser.id}.forEachProperty`).toBe('function');
        }
      }
    });

    test('visible parser IDs are unique within each category', () => {
      for (const cat of categories) {
        const ids = cat.parsers.filter(p => p.showInMenu && p.id).map(p => p.id);
        const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
        expect(duplicates, `duplicates in ${cat.id}`).toEqual([]);
      }
    });

    test('getDefaultCategory returns JavaScript', () => {
      const defaultCat = bundle.getDefaultCategory();
      expect(defaultCat.id).toBe('javascript');
    });

    test('getDefaultParser returns first visible parser', () => {
      const jsCat = bundle.getCategoryByID('javascript');
      const defaultParser = bundle.getDefaultParser(jsCat);
      expect(defaultParser.showInMenu).toBe(true);
      expect(defaultParser.id).toBeTruthy();
    });

    test('getParserByID works for all visible parsers', () => {
      for (const cat of categories) {
        for (const parser of cat.parsers.filter(p => p.id)) {
          const found = bundle.getParserByID(parser.id);
          expect(found).toBe(parser);
        }
      }
    });

    test('getCategoryByID works for all categories', () => {
      for (const cat of categories) {
        const found = bundle.getCategoryByID(cat.id);
        expect(found).toBe(cat);
      }
    });

    test('parser.category backref is set', () => {
      for (const cat of categories) {
        for (const parser of cat.parsers.filter(p => p.id)) {
          expect(parser.category).toBeTruthy();
          expect(parser.category.id).toBeTruthy();
        }
      }
    });

    test('parser versions snapshot', () => {
      const versions: Record<string, string | undefined> = {};
      for (const cat of categories) {
        for (const parser of cat.parsers.filter(p => p.id)) {
          versions[parser.id] = parser.version;
        }
      }
      expect(versions).toMatchSnapshot();
    });
  });

  // -----------------------------------------------------------------------
  // Parser loading + parsing tests (one per category, using default parser)
  // -----------------------------------------------------------------------

  describe('parsing with default parsers', () => {
    // Categories whose default parser is browser-only (WASM with fetch)
    const browserOnlyCats = new Set(['go', 'monkey', 'rust']);

    const categoryIds = [
      'css', 'glsl', 'graphql', 'graphviz', 'handlebars', 'htmlmixed',
      'icu', 'java', 'javascript', 'json', 'lua', 'lucene', 'markdown',
      'mathjs', 'mdx', 'ocaml', 'php', 'protobuf', 'pug',
      'python', 'reason', 'regexp', 'san', 'text/x-scala',
      'solididy', 'sql', 'svelte', 'thrift-idl', 'vue', 'wat', 'webidl', 'yaml',
    ];

    test.each(categoryIds)(
      '%s: loads parser, parses code example, produces AST snapshot',
      async (catId) => {
        const cat = bundle.getCategoryByID(catId);
        expect(cat).toBeTruthy();

        const parser = cat.parsers.filter((p: Parser) => p.showInMenu)[0] || cat.parsers[0];
        expect(parser).toBeTruthy();
        expect(parser.id).toBeTruthy();

        const realParser = await loadParserAsync(parser);
        expect(realParser).toBeTruthy();

        const ast = parser.parse(realParser, cat.codeExample, parser.getDefaultOptions());
        expect(ast).toBeTruthy();
        expect(trimAst(ast)).toMatchSnapshot();

        // Verify AST navigation methods work on root node
        const range = parser.nodeToRange(ast);
        if (range) {
          expect(Array.isArray(range)).toBe(true);
          expect(range).toHaveLength(2);
        }

        const name = parser.getNodeName(ast);
        if (name) {
          expect(typeof name).toBe('string');
        }

        const props = [...parser.forEachProperty(ast)];
        expect(props.length).toBeGreaterThan(0);
        for (const prop of props) {
          expect(typeof prop.key).toBe('string');
          expect('value' in prop).toBe(true);
        }
      },
    );

    // Browser-only parsers: just verify they exist and have the right shape
    test.each(['go', 'monkey', 'rust'])(
      '%s: parser exists with correct shape (browser-only, skipped in Node)',
      (catId) => {
        const cat = bundle.getCategoryByID(catId);
        expect(cat).toBeTruthy();
        const parser = cat.parsers.filter((p: Parser) => p.showInMenu)[0] || cat.parsers[0];
        expect(parser.id).toBeTruthy();
        expect(typeof parser.loadParser).toBe('function');
        expect(typeof parser.parse).toBe('function');
      },
    );
  });

  // -----------------------------------------------------------------------
  // JavaScript parser-specific tests (all Node.js-compatible parsers)
  // -----------------------------------------------------------------------

  describe('JavaScript parsers', () => {
    const jsCode = `
const greeting = 'hello';
function add(a, b) { return a + b; }
const arrow = (x) => x * 2;
    `.trim();

    // swc uses WASM with fetch(), browser-only
    const nodeJsParsers = [
      'acorn', '@babel/eslint-parser', 'babel-eslint9', 'babylon7',
      'esformatter-parser', 'espree', 'esprima', 'flow', 'hermes',
      'meriyah', 'recast', 'seafox', 'shift', 'tenko',
      'traceur', '@typescript-eslint/parser', 'typescript', 'uglify-js',
    ];

    test.each(nodeJsParsers)(
      '%s: parses JavaScript and produces AST snapshot',
      async (parserId) => {
        const parser = bundle.getParserByID(parserId) as Parser;
        expect(parser).toBeTruthy();

        const realParser = await loadParserAsync(parser);
        expect(realParser).toBeTruthy();

        const ast = parser.parse(realParser, jsCode, parser.getDefaultOptions());
        expect(ast).toBeTruthy();
        expect(trimAst(ast)).toMatchSnapshot();
      },
    );

    test('swc: parser exists with correct shape (browser-only WASM)', () => {
      const parser = bundle.getParserByID('swc');
      expect(parser).toBeTruthy();
      expect(typeof parser.loadParser).toBe('function');
      expect(typeof parser.parse).toBe('function');
    });
  });
});
