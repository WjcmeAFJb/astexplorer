import { describe, test, expect } from 'vitest';
import {
  ignoreKeysFilter,
  locationInformationFilter,
  functionFilter,
  emptyKeysFilter,
  typeKeysFilter,
  treeAdapterFromParseResult,
} from '../src/core/TreeAdapter';

// -----------------------------------------------------------------------
// Helper: create a TreeAdapter with sensible defaults
// -----------------------------------------------------------------------
function makeAdapter(opts: {
  locationProps?: Set<string>;
  filters?: Array<{ key?: string; label?: string; test: (...args: unknown[]) => boolean }>;
  filterValues?: Record<string, boolean>;
} = {}) {
  return treeAdapterFromParseResult(
    {
      treeAdapter: {
        type: 'default',
        options: {
          nodeToRange: (node: Record<string, unknown>) =>
            node && typeof node === 'object' && typeof node.start === 'number'
              ? [node.start, node.end]
              : null,
          nodeToName: (node: Record<string, unknown>) =>
            node && typeof node.type === 'string' ? node.type : '',
          openByDefault: () => false,
          *walkNode(node: Record<string, unknown>) {
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

// -----------------------------------------------------------------------
// Filter factory tests
// -----------------------------------------------------------------------
describe('filter factories', () => {
  describe('ignoreKeysFilter', () => {
    test('returns true for keys in the set', () => {
      const f = ignoreKeysFilter(new Set(['a', 'b']));
      expect(f.test('val', 'a')).toBe(true);
      expect(f.test('val', 'b')).toBe(true);
    });
    test('returns false for keys not in the set', () => {
      const f = ignoreKeysFilter(new Set(['a']));
      expect(f.test('val', 'c')).toBe(false);
    });
    test('sets key and label', () => {
      const f = ignoreKeysFilter(new Set(), 'k', 'L');
      expect(f.key).toBe('k');
      expect(f.label).toBe('L');
    });
  });

  describe('locationInformationFilter', () => {
    test('delegates to ignoreKeysFilter with correct key/label', () => {
      const f = locationInformationFilter(new Set(['loc']));
      expect(f.key).toBe('hideLocationData');
      expect(f.label).toBe('Hide location data');
      expect(f.test(null, 'loc')).toBe(true);
      expect(f.test(null, 'name')).toBe(false);
    });
  });

  describe('functionFilter', () => {
    test('returns true only for functions', () => {
      const f = functionFilter();
      expect(f.test(() => {}, 'k')).toBe(true);
      expect(f.test(function() {}, 'k')).toBe(true);
      expect(f.test('str', 'k')).toBe(false);
      expect(f.test(42, 'k')).toBe(false);
      expect(f.test(null, 'k')).toBe(false);
      expect(f.test({}, 'k')).toBe(false);
    });
    test('has correct key and label', () => {
      const f = functionFilter();
      expect(f.key).toBe('hideFunctions');
      expect(f.label).toBe('Hide methods');
    });
  });

  describe('emptyKeysFilter', () => {
    test('filters null/undefined when not in array', () => {
      const f = emptyKeysFilter();
      expect(f.test(null, 'k', false)).toBe(true);
      expect(f.test(undefined, 'k', false)).toBe(true);
      expect(f.test(null, 'k')).toBe(true); // fromArray defaults to falsy
    });
    test('does NOT filter null/undefined inside arrays', () => {
      const f = emptyKeysFilter();
      expect(f.test(null, '0', true)).toBe(false);
      expect(f.test(undefined, '1', true)).toBe(false);
    });
    test('does NOT filter other falsy values', () => {
      const f = emptyKeysFilter();
      expect(f.test(0, 'k')).toBe(false);
      expect(f.test('', 'k')).toBe(false);
      expect(f.test(false, 'k')).toBe(false);
    });
    test('has correct key and label', () => {
      const f = emptyKeysFilter();
      expect(f.key).toBe('hideEmptyKeys');
      expect(f.label).toBe('Hide empty keys');
    });
  });

  describe('typeKeysFilter', () => {
    test('delegates to ignoreKeysFilter with correct key/label', () => {
      const f = typeKeysFilter(new Set(['type']));
      expect(f.key).toBe('hideTypeKeys');
      expect(f.label).toBe('Hide type keys');
      expect(f.test(null, 'type')).toBe(true);
      expect(f.test(null, 'value')).toBe(false);
    });
  });
});

// -----------------------------------------------------------------------
// TreeAdapter class tests
// -----------------------------------------------------------------------
describe('TreeAdapter', () => {
  // -- getNodeName --
  test('getNodeName delegates to nodeToName', () => {
    const a = makeAdapter();
    expect(a.getNodeName({ type: 'Program' })).toBe('Program');
    expect(a.getNodeName({ type: 'Identifier' })).toBe('Identifier');
    expect(a.getNodeName({ noType: true })).toBe('');
  });

  // -- getRange --
  describe('getRange', () => {
    test('returns null for null', () => {
      expect(makeAdapter().getRange(null)).toBeNull();
    });
    test('returns null for undefined', () => {
      expect(makeAdapter().getRange(undefined)).toBeNull();
    });
    test('returns range from node', () => {
      expect(makeAdapter().getRange({ start: 0, end: 10 })).toEqual([0, 10]);
    });
    test('returns null for node without range', () => {
      expect(makeAdapter().getRange({ name: 'foo' })).toBeNull();
    });
    test('caches result (same reference returned)', () => {
      const a = makeAdapter();
      const node = { start: 0, end: 10 };
      expect(a.getRange(node)).toBe(a.getRange(node));
    });
    test('does not cache for primitives', () => {
      // primitives can't be WeakMap keys, so getRange should still work
      const a = makeAdapter();
      expect(a.getRange(42 as any)).toBeNull();
    });
  });

  // -- isInRange --
  describe('isInRange', () => {
    test('true when position is within range', () => {
      const a = makeAdapter();
      const node = { start: 5, end: 15 };
      expect(a.isInRange(node, 'body', 5)).toBe(true);
      expect(a.isInRange(node, 'body', 10)).toBe(true);
      expect(a.isInRange(node, 'body', 15)).toBe(true);
    });
    test('false when position is outside range', () => {
      const a = makeAdapter();
      const node = { start: 5, end: 15 };
      expect(a.isInRange(node, 'body', 4)).toBe(false);
      expect(a.isInRange(node, 'body', 16)).toBe(false);
    });
    test('false for location prop keys', () => {
      const a = makeAdapter({ locationProps: new Set(['start', 'end', 'loc']) });
      expect(a.isInRange({ start: 0, end: 100 }, 'start', 50)).toBe(false);
      expect(a.isInRange({ start: 0, end: 100 }, 'loc', 50)).toBe(false);
    });
    test('false for invalid position (NaN, float, negative)', () => {
      const a = makeAdapter();
      const node = { start: 0, end: 100 };
      expect(a.isInRange(node, 'body', NaN)).toBe(false);
      expect(a.isInRange(node, 'body', 1.5)).toBe(false);
    });
    test('false when node has no range', () => {
      const a = makeAdapter();
      expect(a.isInRange({ noRange: true }, 'body', 5)).toBe(false);
    });
  });

  // -- hasChildrenInRange --
  describe('hasChildrenInRange', () => {
    test('false for location prop keys even when children are in range', () => {
      const a = makeAdapter();
      // Node has children that ARE in range, but key is a location prop — must still return false
      const node = { start: 0, end: 100, child: { start: 10, end: 20 } };
      // With key='body', this would return true (child is at position 15)
      expect(a.hasChildrenInRange(node, 'body', 15)).toBe(true);
      // But with key='loc' (location prop), must return false
      expect(a.hasChildrenInRange(node, 'loc', 15)).toBe(false);
    });

    test('false for invalid position even when children are in range', () => {
      const a = makeAdapter();
      // Same node that would return true for valid position
      const node = { start: 0, end: 100, child: { start: 10, end: 20 } };
      expect(a.hasChildrenInRange(node, 'body', 15)).toBe(true); // valid
      expect(a.hasChildrenInRange(node, 'body', NaN)).toBe(false); // invalid
      expect(a.hasChildrenInRange(node, 'body', 1.5)).toBe(false); // invalid
    });

    test('false when node has range but position is outside even with children', () => {
      const a = makeAdapter();
      // Node at [10,20], child at [12,18] — position 5 is outside node range
      const node = { start: 10, end: 20, child: { start: 12, end: 18 } };
      expect(a.hasChildrenInRange(node, 'body', 15)).toBe(true); // in range
      expect(a.hasChildrenInRange(node, 'body', 5)).toBe(false); // out of range
    });

    test('true when direct child is in range', () => {
      const a = makeAdapter();
      const child = { start: 10, end: 20 };
      const parent = { start: 0, end: 100, child };
      expect(a.hasChildrenInRange(parent, 'root', 15)).toBe(true);
    });

    test('true when nested grandchild is in range (recursive)', () => {
      const a = makeAdapter();
      const grandchild = { start: 30, end: 40 };
      const child = { items: grandchild }; // no range on child
      const parent = { start: 0, end: 100, body: child };
      expect(a.hasChildrenInRange(parent, 'root', 35)).toBe(true);
    });

    test('false when no children are in range', () => {
      const a = makeAdapter();
      const child = { start: 10, end: 20 };
      const parent = { start: 0, end: 100, child };
      expect(a.hasChildrenInRange(parent, 'root', 50)).toBe(false);
    });

    test('handles circular references via seen set (no infinite loop)', () => {
      const a = makeAdapter();
      // Create a circular chain: parent -> child -> parent
      // child has no range, so hasChildrenInRange recurses into child
      // child's only property is parent, which is in the seen set, so it's skipped
      const parent: any = { body: null }; // no range
      const child: any = { ref: parent }; // no range, points back
      parent.body = child;
      // Position 5: no nodes have ranges so nothing is in range
      expect(a.hasChildrenInRange(parent, 'root', 5)).toBe(false);
    });

    test('node without range still checks children', () => {
      const a = makeAdapter();
      const child = { start: 5, end: 15 };
      const wrapper = { child }; // no range
      expect(a.hasChildrenInRange(wrapper, 'root', 10)).toBe(true);
    });
  });

  // -- isLocationProp --
  test('isLocationProp checks against locationProps set', () => {
    const a = makeAdapter({ locationProps: new Set(['loc', 'start']) });
    expect(a.isLocationProp('loc')).toBe(true);
    expect(a.isLocationProp('start')).toBe(true);
    expect(a.isLocationProp('type')).toBe(false);
  });

  // -- opensByDefault --
  test('opensByDefault delegates to adapterOptions', () => {
    const a = makeAdapter();
    expect(a.opensByDefault({}, 'body')).toBe(false);
  });

  // -- isArray / isObject --
  describe('isArray', () => {
    test('true for arrays', () => {
      const a = makeAdapter();
      expect(a.isArray([])).toBe(true);
      expect(a.isArray([1, 2])).toBe(true);
    });
    test('false for non-arrays', () => {
      const a = makeAdapter();
      expect(a.isArray({})).toBe(false);
      expect(a.isArray('str')).toBe(false);
      expect(a.isArray(null)).toBe(false);
    });
  });

  describe('isObject', () => {
    test('true for plain objects', () => {
      const a = makeAdapter();
      expect(a.isObject({})).toBe(true);
      expect(a.isObject({ a: 1 })).toBe(true);
    });
    test('false for arrays (typeof=object but isArray=true)', () => {
      const a = makeAdapter();
      expect(a.isObject([])).toBe(false);
    });
    test('false for null, undefined, primitives', () => {
      const a = makeAdapter();
      expect(a.isObject(null)).toBe(false);
      expect(a.isObject(undefined)).toBe(false);
      expect(a.isObject(0)).toBe(false);
      expect(a.isObject('')).toBe(false);
    });
    test('false for number (typeof !== object)', () => {
      // Specifically tests the typeof check
      const a = makeAdapter();
      expect(a.isObject(42)).toBe(false);
    });
  });

  // -- walkNode --
  describe('walkNode', () => {
    test('yields properties of a node', () => {
      const a = makeAdapter();
      const results = [...a.walkNode({ type: 'X', value: 42 })];
      expect(results.map(r => r.key)).toContain('type');
      expect(results.map(r => r.key)).toContain('value');
    });

    test('yields nothing for null/undefined', () => {
      const a = makeAdapter();
      expect([...a.walkNode(null)]).toEqual([]);
      expect([...a.walkNode(undefined)]).toEqual([]);
    });

    test('applies enabled filters to skip properties', () => {
      const filt = functionFilter();
      const a = makeAdapter({
        filters: [filt],
        filterValues: { hideFunctions: true },
      });
      const node = { type: 'T', fn: () => {}, val: 1 };
      const keys = [...a.walkNode(node)].map(r => r.key);
      expect(keys).toContain('type');
      expect(keys).toContain('val');
      expect(keys).not.toContain('fn');
    });

    test('does NOT apply disabled filters', () => {
      const filt = functionFilter();
      const a = makeAdapter({
        filters: [filt],
        filterValues: { hideFunctions: false },
      });
      const node = { fn: () => {} };
      const keys = [...a.walkNode(node)].map(r => r.key);
      expect(keys).toContain('fn');
    });

    test('filter without key is always active', () => {
      const alwaysFilter = { test: (_v: unknown, k: string) => k === 'secret' };
      const a = makeAdapter({ filters: [alwaysFilter], filterValues: {} });
      const keys = [...a.walkNode({ visible: 1, secret: 2 })].map(r => r.key);
      expect(keys).toContain('visible');
      expect(keys).not.toContain('secret');
    });

    test('passes fromArray=true for array nodes', () => {
      let capturedFromArray: boolean | undefined;
      const spy = { test: (_v: unknown, _k: string, fromArray?: boolean) => { capturedFromArray = fromArray; return false; } };
      const a = makeAdapter({ filters: [spy as any], filterValues: {} });
      Array.from(a.walkNode([1, 2, 3])); // consume generator for array node
      expect(capturedFromArray).toBe(true);
    });
  });

  // -- getConfigurableFilters --
  test('getConfigurableFilters returns only filters with keys', () => {
    const a = makeAdapter({
      filters: [
        { key: 'a', label: 'A', test: () => false },
        { test: () => false }, // no key
        { key: 'b', label: 'B', test: () => false },
      ],
    });
    const result = a.getConfigurableFilters();
    expect(result).toHaveLength(2);
    expect(result.map((f: any) => f.key)).toEqual(['a', 'b']);
  });

  // -- treeAdapterFromParseResult with unknown type --
  test('treeAdapterFromParseResult throws for unknown adapter type', () => {
    expect(() =>
      treeAdapterFromParseResult(
        { treeAdapter: { type: 'nonexistent', options: {} } } as any,
        {},
      ),
    ).toThrow('Unknown tree adapter type "nonexistent"');
  });

  // -- adapter with no filters (exercises || [] fallback) --
  test('works when adapterOptions.filters is undefined', () => {
    const a = treeAdapterFromParseResult(
      {
        treeAdapter: {
          type: 'default',
          options: {
            nodeToRange: () => null,
            nodeToName: () => 'X',
            openByDefault: () => false,
            *walkNode(node: Record<string, unknown>) {
              if (node && typeof node === 'object') {
                for (const key of Object.keys(node)) yield { value: node[key], key, computed: false };
              }
            },
            // No filters property at all
          },
        },
      } as any,
      {},
    );
    // getConfigurableFilters should return empty array
    expect(a.getConfigurableFilters()).toEqual([]);
    // walkNode should still work
    expect([...a.walkNode({ a: 1 })]).toHaveLength(1);
  });
});

// -----------------------------------------------------------------------
// ESTree adapter config tests
// -----------------------------------------------------------------------
describe('ESTree adapter', () => {
  function makeEstreeAdapter(filterValues: Record<string, boolean> = {}) {
    return treeAdapterFromParseResult(
      { treeAdapter: { type: 'estree', options: {} } } as any,
      filterValues,
    );
  }

  test('nodeToName returns node.type', () => {
    const a = makeEstreeAdapter();
    expect(a.getNodeName({ type: 'Program' })).toBe('Program');
  });

  test('nodeToRange returns range array if present', () => {
    const a = makeEstreeAdapter();
    expect(a.getRange({ range: [0, 10] })).toEqual([0, 10]);
  });

  test('nodeToRange returns [start, end] if both are numbers', () => {
    const a = makeEstreeAdapter();
    expect(a.getRange({ start: 5, end: 15 })).toEqual([5, 15]);
  });

  test('nodeToRange returns null for non-object', () => {
    const a = makeEstreeAdapter();
    expect(a.getRange('string' as any)).toBeNull();
    expect(a.getRange(42 as any)).toBeNull();
  });

  test('nodeToRange returns null when no range info', () => {
    const a = makeEstreeAdapter();
    expect(a.getRange({ type: 'Identifier' })).toBeNull();
  });

  test('opensByDefault opens Program nodes', () => {
    const a = makeEstreeAdapter();
    expect(a.opensByDefault({ type: 'Program' }, 'root')).toBe(true);
  });

  test('opensByDefault opens body/elements/declarations/expression keys', () => {
    const a = makeEstreeAdapter();
    expect(a.opensByDefault({ type: 'Other' }, 'body')).toBe(true);
    expect(a.opensByDefault({ type: 'Other' }, 'elements')).toBe(true);
    expect(a.opensByDefault({ type: 'Other' }, 'declarations')).toBe(true);
    expect(a.opensByDefault({ type: 'Other' }, 'expression')).toBe(true);
  });

  test('opensByDefault returns false for other nodes/keys', () => {
    const a = makeEstreeAdapter();
    expect(a.opensByDefault({ type: 'Identifier' }, 'name')).toBe(false);
  });

  test('walkNode yields object properties', () => {
    const a = makeEstreeAdapter();
    const results = [...a.walkNode({ type: 'X', value: 42 })];
    expect(results.map(r => r.key)).toContain('type');
    expect(results.map(r => r.key)).toContain('value');
  });

  test('walkNode yields nothing for non-objects', () => {
    const a = makeEstreeAdapter();
    expect([...a.walkNode(null)]).toEqual([]);
    expect([...a.walkNode('string')]).toEqual([]);
  });

  test('has function, empty, location, and type filters', () => {
    const a = makeEstreeAdapter();
    const filters = a.getConfigurableFilters();
    const keys = filters.map((f: any) => f.key);
    expect(keys).toContain('hideFunctions');
    expect(keys).toContain('hideEmptyKeys');
    expect(keys).toContain('hideLocationData');
    expect(keys).toContain('hideTypeKeys');
  });

  test('function filter hides functions when enabled', () => {
    const a = makeEstreeAdapter({ hideFunctions: true });
    const results = [...a.walkNode({ type: 'X', fn: () => {}, val: 1 })];
    expect(results.map(r => r.key)).not.toContain('fn');
    expect(results.map(r => r.key)).toContain('val');
  });

  test('empty keys filter hides null values when enabled', () => {
    const a = makeEstreeAdapter({ hideEmptyKeys: true });
    const results = [...a.walkNode({ type: 'X', empty: null, val: 1 })];
    expect(results.map(r => r.key)).not.toContain('empty');
    expect(results.map(r => r.key)).toContain('val');
  });

  test('location filter hides range/loc/start/end when enabled', () => {
    const a = makeEstreeAdapter({ hideLocationData: true });
    const results = [...a.walkNode({ type: 'X', start: 0, end: 10, loc: {}, range: [] })];
    const keys = results.map(r => r.key);
    expect(keys).toContain('type');
    expect(keys).not.toContain('start');
    expect(keys).not.toContain('end');
    expect(keys).not.toContain('loc');
    expect(keys).not.toContain('range');
  });

  test('nodeToRange returns null when start is number but end is not', () => {
    const a = makeEstreeAdapter();
    expect(a.getRange({ start: 0, end: 'foo' })).toBeNull();
  });

  test('nodeToRange returns null when end is number but start is not', () => {
    const a = makeEstreeAdapter();
    expect(a.getRange({ start: 'foo', end: 10 })).toBeNull();
  });

  test('nodeToRange returns null for node with no range-like properties', () => {
    const a = makeEstreeAdapter();
    expect(a.getRange({ type: 'X', name: 'foo' })).toBeNull();
  });

  test('nodeToRange prefers range over start/end', () => {
    const a = makeEstreeAdapter();
    const node = { range: [100, 200], start: 0, end: 10 };
    expect(a.getRange(node)).toEqual([100, 200]);
  });

  test('walkNode sets computed:false for all properties', () => {
    const a = makeEstreeAdapter();
    const results = [...a.walkNode({ type: 'X', value: 1 })];
    for (const r of results) {
      expect(r.computed).toBe(false);
    }
  });

  test('opensByDefault returns false for null node with non-default key', () => {
    const a = makeEstreeAdapter();
    expect(a.opensByDefault(null as any, 'name')).toBe(false);
  });

  test('default adapter opensByDefault returns false', () => {
    const a = treeAdapterFromParseResult(
      { treeAdapter: { type: 'default', options: {
        nodeToRange: () => null,
        nodeToName: () => '',
        *walkNode() {},
      } } } as any,
      {},
    );
    expect(a.opensByDefault({}, 'body')).toBe(false);
    // Must be boolean false, not undefined
    expect(a.opensByDefault({}, 'body')).toStrictEqual(false);
  });

  test('default adapter nodeToRange returns null', () => {
    const a = treeAdapterFromParseResult(
      { treeAdapter: { type: 'default', options: {
        nodeToName: () => '',
        openByDefault: () => false,
        *walkNode() {},
      } } } as any,
      {},
    );
    expect(a.getRange({ start: 0, end: 10 })).toBeNull();
    // Must be null, not undefined
    expect(a.getRange({ start: 0, end: 10 })).toStrictEqual(null);
  });
});

