/**
 * Additional tests for website/src/core/TreeAdapter.tsx
 *
 * Complements tree-filters.test.ts with additional edge cases
 * focused on the TreeAdapter class behavior and the createTreeAdapter
 * / treeAdapterFromParseResult integration paths.
 */
import { describe, test, expect } from 'vitest';
import {
  treeAdapterFromParseResult,
  ignoreKeysFilter,
  functionFilter,
  emptyKeysFilter,
  locationInformationFilter,
  typeKeysFilter,
} from '../src/core/TreeAdapter';

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function makeAdapter(
  opts: {
    type?: string;
    locationProps?: Set<string>;
    filters?: Array<{ key?: string; label?: string; test: (...args: unknown[]) => boolean }>;
    filterValues?: Record<string, boolean>;
    nodeToRange?: (node: unknown) => [number, number] | null;
    nodeToName?: (node: unknown) => string;
    walkNode?: (node: unknown) => Iterable<any>;
    openByDefault?: (node: unknown, key: string) => boolean;
  } = {},
) {
  return treeAdapterFromParseResult(
    {
      treeAdapter: {
        type: opts.type || 'default',
        options: {
          nodeToRange:
            opts.nodeToRange ||
            ((node: any) =>
              node && typeof node === 'object' && typeof node.start === 'number'
                ? [node.start, node.end]
                : null),
          nodeToName:
            opts.nodeToName ||
            ((node: any) => (node && typeof node.type === 'string' ? node.type : '')),
          openByDefault: opts.openByDefault || (() => false),
          *walkNode(node: any) {
            if (opts.walkNode) {
              yield* opts.walkNode(node);
              return;
            }
            if (node && typeof node === 'object') {
              for (const key of Object.keys(node)) {
                yield { value: (node as Record<string, unknown>)[key], key, computed: false };
              }
            }
          },
          locationProps: opts.locationProps || new Set(['start', 'end', 'loc']),
          filters: opts.filters || [],
        },
      },
    } as any,
    opts.filterValues || {},
  );
}

// ---------------------------------------------------------------------------
// createTreeAdapter / treeAdapterFromParseResult
// ---------------------------------------------------------------------------
describe('treeAdapterFromParseResult', () => {
  test('creates adapter with "default" type', () => {
    const adapter = makeAdapter({ type: 'default' });
    expect(adapter).toBeDefined();
    expect(typeof adapter.getNodeName).toBe('function');
    expect(typeof adapter.getRange).toBe('function');
    expect(typeof adapter.walkNode).toBe('function');
  });

  test('creates adapter with "estree" type', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter).toBeDefined();
    expect(adapter.getNodeName({ type: 'Identifier' })).toBe('Identifier');
  });

  test('throws for unknown adapter type', () => {
    expect(() =>
      treeAdapterFromParseResult({ treeAdapter: { type: 'xml', options: {} } } as any, {}),
    ).toThrow('Unknown tree adapter type "xml"');
  });

  test('custom options override default config', () => {
    const customNodeToName = (node: any) => `custom-${node.type}`;
    const adapter = makeAdapter({ nodeToName: customNodeToName });
    expect(adapter.getNodeName({ type: 'X' })).toBe('custom-X');
  });
});

// ---------------------------------------------------------------------------
// getRange edge cases
// ---------------------------------------------------------------------------
describe('getRange edge cases', () => {
  test('caches the result for the same object node', () => {
    const adapter = makeAdapter();
    const node = { start: 10, end: 20 };
    const range1 = adapter.getRange(node);
    const range2 = adapter.getRange(node);
    expect(range1).toBe(range2); // same reference from cache
  });

  test('returns different ranges for different nodes', () => {
    const adapter = makeAdapter();
    const node1 = { start: 0, end: 10 };
    const node2 = { start: 20, end: 30 };
    expect(adapter.getRange(node1)).toEqual([0, 10]);
    expect(adapter.getRange(node2)).toEqual([20, 30]);
  });

  test('does not crash for string node (primitive)', () => {
    const adapter = makeAdapter();
    expect(adapter.getRange('hello' as any)).toBeNull();
  });

  test('does not crash for boolean node (primitive)', () => {
    const adapter = makeAdapter();
    expect(adapter.getRange(true as any)).toBeNull();
  });

  test('returns null for node with non-numeric start', () => {
    const adapter = makeAdapter();
    expect(adapter.getRange({ start: 'abc', end: 10 })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// isInRange edge cases
// ---------------------------------------------------------------------------
describe('isInRange edge cases', () => {
  test('returns true for position at exact start boundary', () => {
    const adapter = makeAdapter();
    expect(adapter.isInRange({ start: 5, end: 10 }, 'body', 5)).toBe(true);
  });

  test('returns true for position at exact end boundary', () => {
    const adapter = makeAdapter();
    expect(adapter.isInRange({ start: 5, end: 10 }, 'body', 10)).toBe(true);
  });

  test('returns false for position just before start', () => {
    const adapter = makeAdapter();
    expect(adapter.isInRange({ start: 5, end: 10 }, 'body', 4)).toBe(false);
  });

  test('returns false for position just after end', () => {
    const adapter = makeAdapter();
    expect(adapter.isInRange({ start: 5, end: 10 }, 'body', 11)).toBe(false);
  });

  test('returns false for negative position', () => {
    const adapter = makeAdapter();
    expect(adapter.isInRange({ start: 0, end: 100 }, 'body', -1)).toBe(false);
  });

  test('returns false for position 0 when key is a location prop', () => {
    const adapter = makeAdapter({ locationProps: new Set(['start', 'end', 'loc']) });
    expect(adapter.isInRange({ start: 0, end: 100 }, 'start', 50)).toBe(false);
    expect(adapter.isInRange({ start: 0, end: 100 }, 'end', 50)).toBe(false);
    expect(adapter.isInRange({ start: 0, end: 100 }, 'loc', 50)).toBe(false);
  });

  test('returns false for null node', () => {
    const adapter = makeAdapter();
    // null -> getRange returns null -> false
    expect(adapter.isInRange(null, 'body', 5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// hasChildrenInRange advanced scenarios
// ---------------------------------------------------------------------------
describe('hasChildrenInRange advanced', () => {
  test('returns false for null position', () => {
    const adapter = makeAdapter();
    const node = { start: 0, end: 100, child: { start: 10, end: 20 } };
    expect(adapter.hasChildrenInRange(node, 'body', NaN)).toBe(false);
  });

  test('returns false for float position', () => {
    const adapter = makeAdapter();
    const node = { start: 0, end: 100, child: { start: 10, end: 20 } };
    expect(adapter.hasChildrenInRange(node, 'body', 15.5)).toBe(false);
  });

  test('detects deeply nested child in range', () => {
    const adapter = makeAdapter();
    const deep = { start: 50, end: 60 };
    const mid = { inner: deep };
    const top = { start: 0, end: 100, outer: mid };
    expect(adapter.hasChildrenInRange(top, 'root', 55)).toBe(true);
  });

  test('handles array children', () => {
    const adapter = makeAdapter();
    const child1 = { start: 10, end: 20 };
    const child2 = { start: 30, end: 40 };
    const parent = { start: 0, end: 100, items: [child1, child2] };
    expect(adapter.hasChildrenInRange(parent, 'root', 15)).toBe(true);
    expect(adapter.hasChildrenInRange(parent, 'root', 35)).toBe(true);
    expect(adapter.hasChildrenInRange(parent, 'root', 25)).toBe(false);
  });

  test('does not infinite loop on self-referencing node', () => {
    const adapter = makeAdapter();
    const node: any = { start: 0, end: 100 };
    node.self = node;
    // Should not hang; position 50 is in range of node itself
    // but the self-reference is in the seen set
    expect(adapter.hasChildrenInRange(node, 'root', 50)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isLocationProp
// ---------------------------------------------------------------------------
describe('isLocationProp', () => {
  test('returns true for keys in locationProps set', () => {
    const adapter = makeAdapter({ locationProps: new Set(['loc', 'range', 'position']) });
    expect(adapter.isLocationProp('loc')).toBe(true);
    expect(adapter.isLocationProp('range')).toBe(true);
    expect(adapter.isLocationProp('position')).toBe(true);
  });

  test('returns false for keys not in locationProps set', () => {
    const adapter = makeAdapter({ locationProps: new Set(['loc']) });
    expect(adapter.isLocationProp('type')).toBe(false);
    expect(adapter.isLocationProp('value')).toBe(false);
    expect(adapter.isLocationProp('name')).toBe(false);
  });

  test('returns false when locationProps is empty', () => {
    const adapter = makeAdapter({ locationProps: new Set() });
    expect(adapter.isLocationProp('loc')).toBe(false);
    expect(adapter.isLocationProp('start')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// opensByDefault
// ---------------------------------------------------------------------------
describe('opensByDefault', () => {
  test('delegates to the adapter options', () => {
    const adapter = makeAdapter({
      openByDefault: (_node: any, key: string) => key === 'body',
    });
    expect(adapter.opensByDefault({}, 'body')).toBe(true);
    expect(adapter.opensByDefault({}, 'name')).toBe(false);
  });

  test('estree adapter opens Program nodes', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.opensByDefault({ type: 'Program' }, 'root')).toBe(true);
  });

  test('estree adapter opens standard keys', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.opensByDefault({}, 'body')).toBe(true);
    expect(adapter.opensByDefault({}, 'elements')).toBe(true);
    expect(adapter.opensByDefault({}, 'declarations')).toBe(true);
    expect(adapter.opensByDefault({}, 'expression')).toBe(true);
  });

  test('estree adapter does not open random keys', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.opensByDefault({ type: 'Identifier' }, 'name')).toBe(false);
    expect(adapter.opensByDefault({ type: 'Literal' }, 'value')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// isArray / isObject
// ---------------------------------------------------------------------------
describe('isArray and isObject', () => {
  test('isArray true for empty array', () => {
    expect(makeAdapter().isArray([])).toBe(true);
  });

  test('isArray true for populated array', () => {
    expect(makeAdapter().isArray([1, 2, 3])).toBe(true);
  });

  test('isArray false for object', () => {
    expect(makeAdapter().isArray({})).toBe(false);
  });

  test('isArray false for string', () => {
    expect(makeAdapter().isArray('array')).toBe(false);
  });

  test('isObject true for plain object', () => {
    expect(makeAdapter().isObject({})).toBe(true);
  });

  test('isObject false for null', () => {
    expect(makeAdapter().isObject(null)).toBe(false);
  });

  test('isObject false for arrays', () => {
    expect(makeAdapter().isObject([])).toBe(false);
  });

  test('isObject false for number', () => {
    expect(makeAdapter().isObject(42)).toBe(false);
  });

  test('isObject false for string', () => {
    expect(makeAdapter().isObject('hello')).toBe(false);
  });

  test('isObject false for undefined', () => {
    expect(makeAdapter().isObject(undefined)).toBe(false);
  });

  test('isObject true for Date (typeof object)', () => {
    expect(makeAdapter().isObject(new Date())).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// walkNode with multiple active filters
// ---------------------------------------------------------------------------
describe('walkNode with multiple filters', () => {
  test('applies multiple filters in combination', () => {
    const fnFilter = functionFilter();
    const emptyFilter = emptyKeysFilter();

    const adapter = makeAdapter({
      filters: [fnFilter, emptyFilter],
      filterValues: { hideFunctions: true, hideEmptyKeys: true },
    });

    const node = {
      type: 'X',
      fn: () => {},
      empty: null,
      value: 42,
    };

    const keys = [...adapter.walkNode(node)].map((r) => r.key);
    expect(keys).toContain('type');
    expect(keys).toContain('value');
    expect(keys).not.toContain('fn');
    expect(keys).not.toContain('empty');
  });

  test('disabled filter does not remove entries', () => {
    const fnFilter = functionFilter();

    const adapter = makeAdapter({
      filters: [fnFilter],
      filterValues: { hideFunctions: false },
    });

    const node = { fn: () => {}, val: 1 };
    const keys = [...adapter.walkNode(node)].map((r) => r.key);
    expect(keys).toContain('fn');
    expect(keys).toContain('val');
  });

  test('filter with no key is always active', () => {
    const noKeyFilter = {
      test: (_v: unknown, k: string) => k === 'hidden',
    };

    const adapter = makeAdapter({
      filters: [noKeyFilter as any],
      filterValues: {},
    });

    const node = { visible: 1, hidden: 2 };
    const keys = [...adapter.walkNode(node)].map((r) => r.key);
    expect(keys).toContain('visible');
    expect(keys).not.toContain('hidden');
  });
});

// ---------------------------------------------------------------------------
// getConfigurableFilters
// ---------------------------------------------------------------------------
describe('getConfigurableFilters', () => {
  test('returns filters that have a key property', () => {
    const adapter = makeAdapter({
      filters: [
        { key: 'a', label: 'A', test: () => false },
        { test: () => false }, // no key
        { key: 'b', label: 'B', test: () => false },
        { key: '', label: 'Empty', test: () => false }, // empty string key (falsy)
      ],
    });

    const result = adapter.getConfigurableFilters();
    // Only filters with truthy key are returned
    expect(result).toHaveLength(2);
    expect(result.map((f: any) => f.key)).toEqual(['a', 'b']);
  });

  test('returns empty array when no filters have keys', () => {
    const adapter = makeAdapter({
      filters: [{ test: () => false }, { test: () => true }],
    });

    expect(adapter.getConfigurableFilters()).toHaveLength(0);
  });

  test('returns empty array when no filters exist', () => {
    const adapter = makeAdapter({ filters: [] });
    expect(adapter.getConfigurableFilters()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// estree adapter - nodeToRange edge cases
// ---------------------------------------------------------------------------
describe('estree adapter nodeToRange', () => {
  test('prefers range property over start/end', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    const node = { range: [100, 200], start: 0, end: 10 };
    expect(adapter.getRange(node)).toEqual([100, 200]);
  });

  test('falls back to start/end when no range property', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.getRange({ start: 5, end: 15 })).toEqual([5, 15]);
  });

  test('returns null when start is not a number', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.getRange({ start: 'x', end: 10 })).toBeNull();
  });

  test('returns null when end is not a number', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.getRange({ start: 0, end: 'y' })).toBeNull();
  });

  test('returns null for null node', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.getRange(null)).toBeNull();
  });

  test('returns null for primitive node', () => {
    const adapter = treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      {},
    );
    expect(adapter.getRange(42 as any)).toBeNull();
    expect(adapter.getRange('str' as any)).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Default adapter config edge cases
// ---------------------------------------------------------------------------
describe('default adapter config', () => {
  test('nodeToRange always returns null', () => {
    const adapter = treeAdapterFromParseResult(
      {
        treeAdapter: {
          type: 'default',
          options: {
            nodeToName: () => 'X',
            *walkNode() {},
          },
        },
      } as any,
      {},
    );
    expect(adapter.getRange({ start: 0, end: 10 })).toBeNull();
    expect(adapter.getRange({})).toBeNull();
  });

  test('nodeToName throws when not overridden', () => {
    const adapter = treeAdapterFromParseResult(
      {
        treeAdapter: {
          type: 'default',
          options: {
            nodeToRange: () => null,
            *walkNode() {},
          },
        },
      } as any,
      {},
    );
    expect(() => adapter.getNodeName({})).toThrow('nodeToName must be passed');
  });

  test('walkNode throws when not overridden', () => {
    const adapter = treeAdapterFromParseResult(
      {
        treeAdapter: {
          type: 'default',
          options: {
            nodeToRange: () => null,
            nodeToName: () => 'X',
          },
        },
      } as any,
      {},
    );
    expect(() => [...adapter.walkNode({})]).toThrow('walkNode must be passed');
  });

  test('openByDefault always returns false by default', () => {
    const adapter = treeAdapterFromParseResult(
      {
        treeAdapter: {
          type: 'default',
          options: {
            nodeToRange: () => null,
            nodeToName: () => 'X',
            *walkNode() {},
          },
        },
      } as any,
      {},
    );
    expect(adapter.opensByDefault({}, 'body')).toBe(false);
    expect(adapter.opensByDefault({}, 'anything')).toBe(false);
  });
});
