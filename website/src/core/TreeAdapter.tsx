// oxlint-disable typescript-eslint/no-unsafe-call, typescript-eslint/no-unsafe-member-access, typescript-eslint/no-unsafe-return, typescript-eslint/no-unsafe-type-assertion, typescript-eslint/prefer-nullish-coalescing, typescript-eslint/strict-boolean-expressions -- legacy untyped code; full strict typing migration tracked as tech debt
import type {ParseResult, TreeFilter, WalkResult, AdapterOptions} from '../types';

/**
 * Configurable base class for all tree traversal.
 */
class TreeAdapter {
  _ranges: WeakMap<object, [number, number] | null> = new WeakMap();
  _filterValues: Record<string, boolean>;
  _adapterOptions: AdapterOptions;

    constructor(adapterOptions: AdapterOptions, filterValues: Record<string, boolean>) {
    this._ranges = new WeakMap();
    this._filterValues = filterValues;
    this._adapterOptions = adapterOptions;
  }

  /**
   * Used by UI components to render an appropriate input for each filter.
   * @returns {TreeFilter[]}
   */
  getConfigurableFilters() {
    return (this._adapterOptions.filters ?? []).filter(filter => Boolean(filter.key));
  }

  /**

   * A more or less human readable name of the node.
 */
  getNodeName(node: unknown): string {
    return this._adapterOptions.nodeToName(node);
  }

  /**

   * The start and end indicies of the node in the source text. The return value
   * is an array of form `[start, end]`. This is used for highlighting source
   * text and focusing nodes in the tree.
 */
  getRange(node: unknown): [number, number] | null | undefined {
    if (node === null || node === undefined) {
      // oxlint-disable-next-line unicorn/no-null -- return type is [number, number] | null | undefined; null matches the nodeToRange API contract
      return null;
    }
    // Typecast: node is unknown but guaranteed non-null here; WeakMap requires object keys
    if (this._ranges.has((node as object))) {
      return this._ranges.get((node as object));
    }
    const {nodeToRange} = this._adapterOptions;
    let range = nodeToRange(node);
    if (node && typeof node === 'object') {
      this._ranges.set(node, range);
    }
    return range;
  }

    isInRange(node: unknown, key: string, position: number): boolean {
    if (this.isLocationProp(key)) {
      return false;
    }
    if (!isValidPosition(position)) {
      return false;
    }
    const range = this.getRange(node);
    if (!range) {
      return false;
    }
    return range[0] <= position && position <= range[1];
  }

    hasChildrenInRange(node: unknown, key: string, position: number, seen: Set<unknown> = new Set()): boolean {
    if (this.isLocationProp(key)) {
      return false;
    }
    if (!isValidPosition(position)) {
      return false;
    }
    seen.add(node);
    const range = this.getRange(node);
    if (range && !this.isInRange(node, key, position)) {
      return false;
    }
    // Not everything that is rendered has location associated with it (most
    // commonly arrays). In such a case we are a looking whether the node
    // contains any other nodes with location data (recursively).
    for (const {value: child, key: childKey} of this.walkNode(node)) {
      if (this.isInRange(child, childKey, position)) {
        return true;
      }
    }
    for (const {value: child, key: childKey} of this.walkNode(node)) {
      if (seen.has(child)) {
        continue;
      }
      if (this.hasChildrenInRange(child, childKey, position, seen)) {
        return true;
      }
    }
    return false;
  }

    isLocationProp(key: string): boolean {
    return this._adapterOptions.locationProps && this._adapterOptions.locationProps.has(key);
  }

  /**

   * Whether or not the provided node should be automatically expanded.
 */
  opensByDefault(node: unknown, key: string): boolean {
    return this._adapterOptions.openByDefault(node, key);
  }

    isArray(node: unknown): boolean {
    return Array.isArray(node);
  }

    isObject(node: unknown): boolean {
    return Boolean(node) && typeof node === 'object' && !this.isArray(node);
  }

  /**

   * A generator to iterate over each "property" of the node.
   * @yields {WalkResult}
 */
  *walkNode(node: unknown): Generator<WalkResult> {
    if (node !== null && node !== undefined) {
      for (const result of this._adapterOptions.walkNode(node)) {
        if (
          (this._adapterOptions.filters ?? []).some(filter => {
            if (filter.key && !this._filterValues[filter.key]) {
              return false;
            }
            return filter.test(result.value, result.key, Array.isArray(node));
          })
        ) {
          continue;
        }
        yield result;
      }
    }
  }

}

const TreeAdapterConfigs: Record<string, AdapterOptions & Record<string, unknown>> = {
  default: {
    filters: [],
    openByDefault: () => false,
    // oxlint-disable-next-line unicorn/no-null -- nodeToRange API returns [number, number] | null; null means "no range"
    nodeToRange: (): null => null,
    nodeToName: (): string => { throw new Error('nodeToName must be passed');},
    walkNode: (): never => { throw new Error('walkNode must be passed');},
  },

  estree: {
    filters: [
      functionFilter(),
      emptyKeysFilter(),
      locationInformationFilter(new Set(['range', 'loc', 'start', 'end'])),
      typeKeysFilter(),
    ],
    openByDefaultNodes: new Set(['Program']),
    openByDefaultKeys: new Set([
      'body',
      // array literals
      'elements',
      // variable declaration
      'declarations',
      // expression statements
      'expression',
    ]),
    /**
 @this {{openByDefaultNodes: Set<unknown>, openByDefaultKeys: Set<string>}} @param {Record<string, unknown>} node @param {string} key
 */
    openByDefault(node: Record<string, unknown>, key: string) {
      return node && this.openByDefaultNodes.has(node.type) ||
        this.openByDefaultKeys.has(key);
    },
        nodeToRange(node: Record<string, unknown>): [number, number] | null {
      if (!(node && typeof node === 'object')) {
        // oxlint-disable-next-line unicorn/no-null -- nodeToRange API returns [number, number] | null; null means "no range"
        return null;
      }
      if (node.range) {
        return (node.range as [number, number]);
      }
      if (typeof node.start === 'number' && typeof node.end === 'number') {
        return [node.start, node.end];
      }
      // oxlint-disable-next-line unicorn/no-null -- nodeToRange API returns [number, number] | null; null means "no range"
      return null;
    },
        nodeToName(node: Record<string, unknown>): string {
      return (node.type as string);
    },
        *walkNode(node: Record<string, unknown>) {
      if (node && typeof node === 'object') {
        for (let prop in node) {
          yield {
            value: node[prop],
            key: prop,
            computed: false,
          }
        }
      }
    },
  },
};

function isValidPosition(position: number): boolean {
  return Number.isInteger(position);
}

export function ignoreKeysFilter(keys?: Set<string>, key?: string, label?: string): TreeFilter {
  return {
    key,
    label,
    test(_: unknown, nodeKey: string) { return  keys.has(nodeKey); },
  };
}

export function locationInformationFilter(keys: Set<string>): TreeFilter {
  return ignoreKeysFilter(
    keys,
    'hideLocationData',
    'Hide location data',
  );
}

/**
 * @returns {TreeFilter}
 */
export function functionFilter() {
  return {
    key: 'hideFunctions',
    label: 'Hide methods',
    test(value: unknown) { return typeof value === 'function'; },
  };
}

/**
 * @returns {TreeFilter}
 */
export function emptyKeysFilter() {
  return {
    key: 'hideEmptyKeys',
    label: 'Hide empty keys',
    test(value: unknown, key: string, fromArray?: boolean) { return (value === null || value === undefined) && !fromArray; },
  };
}

export function typeKeysFilter(keys?: Set<string>): TreeFilter {
  return ignoreKeysFilter(
    keys,
    'hideTypeKeys',
    'Hide type keys',
  );
}

function createTreeAdapter(type: string, adapterOptions: Partial<AdapterOptions>, filterValues: Record<string, boolean>): TreeAdapter {
  if (TreeAdapterConfigs[type] === null || TreeAdapterConfigs[type] === undefined) {
    throw new Error(`Unknown tree adapter type "${type}"`);
  }
  return new TreeAdapter(
    Object.assign({}, TreeAdapterConfigs[type], adapterOptions),
    filterValues,
  );
}

export function treeAdapterFromParseResult({treeAdapter}: ParseResult, filterValues: Record<string, boolean>): TreeAdapter {
  return createTreeAdapter(
    treeAdapter.type,
    treeAdapter.options,
    filterValues,
  );
}
