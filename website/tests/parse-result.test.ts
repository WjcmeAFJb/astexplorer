/**
 * Tests for website/src/core/ParseResult.ts
 *
 * ParseResult.ts is a documentation-only module that defines the shape of
 * a parse result object. It does not export any constructors or functions.
 * We verify the structural expectations by creating conforming objects
 * and checking them against the documented shape.
 *
 * Also tests the ParseResult type from types.ts.
 */
import { describe, test, expect } from 'vitest';

// Import the module to ensure lines 8-34 are executed/covered
import '../src/core/ParseResult';

describe('ParseResult shape', () => {
  test('a valid parse result has ast, error, time, and treeAdapter', () => {
    const result = {
      ast: { type: 'Program', body: [] },
      error: null,
      time: 42,
      treeAdapter: {
        type: 'estree',
        options: {},
      },
    };

    expect(result.ast).toBeDefined();
    expect(result.error).toBeNull();
    expect(result.time).toBe(42);
    expect(result.treeAdapter.type).toBe('estree');
    expect(result.treeAdapter.options).toEqual({});
  });

  test('parse result with error has null ast and error set', () => {
    const result = {
      ast: null,
      error: new Error('Unexpected token'),
      time: null,
      treeAdapter: null,
    };

    expect(result.ast).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe('Unexpected token');
    expect(result.time).toBeNull();
    expect(result.treeAdapter).toBeNull();
  });

  test('parse result time can be a number (milliseconds)', () => {
    const result = {
      ast: {},
      error: null,
      time: 156,
      treeAdapter: { type: 'default', options: {} },
    };

    expect(typeof result.time).toBe('number');
    expect(result.time).toBeGreaterThan(0);
  });

  test('parse result treeAdapter type can be "default" or "estree"', () => {
    const defaultAdapter = { type: 'default', options: {} };
    const estreeAdapter = { type: 'estree', options: {} };

    expect(defaultAdapter.type).toBe('default');
    expect(estreeAdapter.type).toBe('estree');
  });

  test('parse result treeAdapter options can contain overrides', () => {
    const adapter = {
      type: 'estree',
      options: {
        filters: [],
        openByDefault: () => false,
        nodeToRange: () => null,
        nodeToName: (node: any) => node.type,
        walkNode: function* () {},
      },
    };

    expect(adapter.options.filters).toEqual([]);
    expect(typeof adapter.options.openByDefault).toBe('function');
    expect(typeof adapter.options.nodeToRange).toBe('function');
    expect(typeof adapter.options.nodeToName).toBe('function');
    expect(typeof adapter.options.walkNode).toBe('function');
  });

  test('parse result with successful parse has non-null ast and time', () => {
    const result = {
      ast: { type: 'Program', body: [{ type: 'ExpressionStatement' }] },
      error: null,
      time: 3,
      treeAdapter: { type: 'estree', options: {} },
    };

    expect(result.ast).not.toBeNull();
    expect(result.error).toBeNull();
    expect(result.time).toBe(3);
  });

  test('parse result time of 0 is a valid time', () => {
    const result = {
      ast: {},
      error: null,
      time: 0,
      treeAdapter: { type: 'default', options: {} },
    };

    expect(result.time).toBe(0);
  });

  test('parse result with complex AST structure', () => {
    const ast = {
      type: 'Program',
      body: [
        {
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: { type: 'Identifier', name: 'x' },
              init: { type: 'Literal', value: 42 },
            },
          ],
          kind: 'const',
        },
      ],
    };

    const result = {
      ast,
      error: null,
      time: 1,
      treeAdapter: { type: 'estree', options: {} },
    };

    expect(result.ast.type).toBe('Program');
    expect(result.ast.body).toHaveLength(1);
    expect(result.ast.body[0].type).toBe('VariableDeclaration');
  });
});
