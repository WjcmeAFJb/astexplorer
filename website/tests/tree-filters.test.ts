import { describe, test, expect } from 'vitest';
import {
  ignoreKeysFilter,
  locationInformationFilter,
  functionFilter,
  emptyKeysFilter,
  typeKeysFilter,
  treeAdapterFromParseResult,
} from '../src/core/TreeAdapter';

describe('tree filters', () => {
  describe('ignoreKeysFilter', () => {
    test('filters keys in the set', () => {
      const filter = ignoreKeysFilter(new Set(['_internal', '__proto']));
      expect(filter.test('anything', '_internal')).toBe(true);
      expect(filter.test('anything', '__proto')).toBe(true);
      expect(filter.test('anything', 'visible')).toBe(false);
    });

    test('accepts custom key and label', () => {
      const filter = ignoreKeysFilter(new Set(), 'myKey', 'My Label');
      expect(filter.key).toBe('myKey');
      expect(filter.label).toBe('My Label');
    });
  });

  describe('locationInformationFilter', () => {
    test('filters location-related keys', () => {
      const filter = locationInformationFilter(new Set(['loc', 'start', 'end']));
      expect(filter.test(null, 'loc')).toBe(true);
      expect(filter.test(null, 'start')).toBe(true);
      expect(filter.test(null, 'type')).toBe(false);
    });

    test('has correct key and label', () => {
      const filter = locationInformationFilter(new Set());
      expect(filter.key).toBe('hideLocationData');
      expect(filter.label).toBe('Hide location data');
    });
  });

  describe('functionFilter', () => {
    test('filters function values', () => {
      const filter = functionFilter();
      expect(filter.test(() => {}, 'key')).toBe(true);
      expect(filter.test(function() {}, 'key')).toBe(true);
      expect(filter.test('string', 'key')).toBe(false);
      expect(filter.test(42, 'key')).toBe(false);
      expect(filter.test(null, 'key')).toBe(false);
    });

    test('has correct key and label', () => {
      const filter = functionFilter();
      expect(filter.key).toBe('hideFunctions');
      expect(filter.label).toBe('Hide methods');
    });
  });

  describe('emptyKeysFilter', () => {
    test('filters null and undefined values', () => {
      const filter = emptyKeysFilter();
      expect(filter.test(null, 'key')).toBe(true);
      expect(filter.test(undefined, 'key')).toBe(true);
      expect(filter.test(0, 'key')).toBe(false);
      expect(filter.test('', 'key')).toBe(false);
      expect(filter.test(false, 'key')).toBe(false);
    });

    test('does not filter null values in arrays', () => {
      const filter = emptyKeysFilter();
      expect(filter.test(null, '0', true)).toBe(false);
      expect(filter.test(undefined, '1', true)).toBe(false);
    });

    test('has correct key and label', () => {
      const filter = emptyKeysFilter();
      expect(filter.key).toBe('hideEmptyKeys');
      expect(filter.label).toBe('Hide empty keys');
    });
  });

  describe('typeKeysFilter', () => {
    test('filters type-related keys', () => {
      const filter = typeKeysFilter(new Set(['type', 'kind']));
      expect(filter.test(null, 'type')).toBe(true);
      expect(filter.test(null, 'kind')).toBe(true);
      expect(filter.test(null, 'value')).toBe(false);
    });

    test('has correct key and label', () => {
      const filter = typeKeysFilter(new Set());
      expect(filter.key).toBe('hideTypeKeys');
      expect(filter.label).toBe('Hide type keys');
    });
  });

  describe('TreeAdapter', () => {
    function makeAdapter(
      ast: unknown,
      opts: {
        locationProps?: Set<string>;
        filters?: Array<{ key?: string; label?: string; test: (...args: unknown[]) => boolean }>;
        filterValues?: Record<string, boolean>;
      } = {},
    ) {
      const parseResult = {
        treeAdapter: {
          type: 'default',
          options: {
            nodeToRange: (node: Record<string, unknown>) =>
              node && typeof node.start === 'number' ? [node.start, node.end] : null,
            nodeToName: (node: Record<string, unknown>) =>
              node && typeof node.type === 'string' ? node.type : undefined,
            openByDefault: () => false,
            *walkNode(node: Record<string, unknown>) {
              if (node && typeof node === 'object') {
                for (const key of Object.keys(node)) {
                  yield { value: node[key], key, computed: false };
                }
              }
            },
            locationProps: opts.locationProps || new Set(['start', 'end', 'loc']),
            filters: opts.filters || [],
          },
        },
      };
      return treeAdapterFromParseResult(
        parseResult as any,
        opts.filterValues || {},
      );
    }

    test('getNodeName returns node type', () => {
      const adapter = makeAdapter(null);
      expect(adapter.getNodeName({ type: 'Program' })).toBe('Program');
      expect(adapter.getNodeName({ type: 'Identifier' })).toBe('Identifier');
    });

    test('getRange returns range from node', () => {
      const adapter = makeAdapter(null);
      expect(adapter.getRange({ start: 0, end: 10 })).toEqual([0, 10]);
      expect(adapter.getRange({ name: 'foo' })).toBeNull();
    });

    test('getRange returns null for null/undefined', () => {
      const adapter = makeAdapter(null);
      expect(adapter.getRange(null)).toBeNull();
      expect(adapter.getRange(undefined)).toBeNull();
    });

    test('getRange caches results', () => {
      const adapter = makeAdapter(null);
      const node = { start: 0, end: 10 };
      const range1 = adapter.getRange(node);
      const range2 = adapter.getRange(node);
      expect(range1).toBe(range2); // same reference
    });

    test('isInRange checks position against node range', () => {
      const adapter = makeAdapter(null);
      const node = { start: 5, end: 15 };
      expect(adapter.isInRange(node, 'body', 10)).toBe(true);
      expect(adapter.isInRange(node, 'body', 5)).toBe(true);
      expect(adapter.isInRange(node, 'body', 15)).toBe(true);
      expect(adapter.isInRange(node, 'body', 3)).toBe(false);
      expect(adapter.isInRange(node, 'body', 20)).toBe(false);
    });

    test('isInRange returns false for location props', () => {
      const adapter = makeAdapter(null);
      const node = { start: 0, end: 100 };
      expect(adapter.isInRange(node, 'start', 50)).toBe(false);
      expect(adapter.isInRange(node, 'loc', 50)).toBe(false);
    });

    test('isInRange returns false for invalid positions', () => {
      const adapter = makeAdapter(null);
      const node = { start: 0, end: 100 };
      expect(adapter.isInRange(node, 'body', -1)).toBe(false);
      expect(adapter.isInRange(node, 'body', NaN)).toBe(false);
    });

    test('isLocationProp checks against locationProps set', () => {
      const adapter = makeAdapter(null, { locationProps: new Set(['loc', 'start']) });
      expect(adapter.isLocationProp('loc')).toBe(true);
      expect(adapter.isLocationProp('start')).toBe(true);
      expect(adapter.isLocationProp('type')).toBe(false);
    });

    test('isArray identifies arrays', () => {
      const adapter = makeAdapter(null);
      expect(adapter.isArray([1, 2])).toBe(true);
      expect(adapter.isArray([])).toBe(true);
      expect(adapter.isArray({})).toBe(false);
      expect(adapter.isArray('string')).toBe(false);
    });

    test('isObject identifies objects (not arrays)', () => {
      const adapter = makeAdapter(null);
      expect(adapter.isObject({})).toBe(true);
      expect(adapter.isObject({ a: 1 })).toBe(true);
      expect(adapter.isObject([])).toBe(false);
      expect(adapter.isObject(null)).toBe(false);
      expect(adapter.isObject(undefined)).toBe(false);
      expect(adapter.isObject(42)).toBe(false);
    });

    test('walkNode yields node properties', () => {
      const adapter = makeAdapter(null);
      const node = { type: 'Program', body: [], start: 0 };
      const results = [...adapter.walkNode(node)];
      const keys = results.map(r => r.key);
      expect(keys).toContain('type');
      expect(keys).toContain('body');
      expect(keys).toContain('start');
    });

    test('walkNode with filters skips matching properties', () => {
      const filter = functionFilter();
      const adapter = makeAdapter(null, {
        filters: [filter],
        filterValues: { hideFunctions: true },
      });
      const node = { type: 'Test', method: () => {}, value: 42 };
      const results = [...adapter.walkNode(node)];
      const keys = results.map(r => r.key);
      expect(keys).toContain('type');
      expect(keys).toContain('value');
      expect(keys).not.toContain('method');
    });

    test('walkNode does not filter when filter is disabled', () => {
      const filter = functionFilter();
      const adapter = makeAdapter(null, {
        filters: [filter],
        filterValues: { hideFunctions: false },
      });
      const node = { type: 'Test', method: () => {}, value: 42 };
      const results = [...adapter.walkNode(node)];
      const keys = results.map(r => r.key);
      expect(keys).toContain('method');
    });

    test('walkNode yields nothing for null/undefined', () => {
      const adapter = makeAdapter(null);
      expect([...adapter.walkNode(null)]).toEqual([]);
      expect([...adapter.walkNode(undefined)]).toEqual([]);
    });

    test('hasChildrenInRange finds children at position', () => {
      const adapter = makeAdapter(null);
      const ast = {
        type: 'Program',
        start: 0,
        end: 100,
        body: {
          type: 'Statement',
          start: 10,
          end: 50,
        },
      };
      expect(adapter.hasChildrenInRange(ast, 'root', 25)).toBe(true);
      expect(adapter.hasChildrenInRange(ast, 'root', 75)).toBe(false);
    });

    test('getConfigurableFilters returns only filters with keys', () => {
      const adapter = makeAdapter(null, {
        filters: [
          { key: 'hideEmpty', label: 'Hide empty', test: () => false },
          { test: () => false }, // no key
        ],
      });
      const configurable = adapter.getConfigurableFilters();
      expect(configurable).toHaveLength(1);
      expect(configurable[0].key).toBe('hideEmpty');
    });
  });
});
