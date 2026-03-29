/** @typedef {import('../types.js').AdapterOptions} AdapterOptions */
/** @typedef {import('../types.js').WalkResult} WalkResult */
/** @typedef {import('../types.js').TreeFilter} TreeFilter */
/** @typedef {import('../types.js').ParseResult} ParseResult */

/**
 * Configurable base class for all tree traversal.
 */
class TreeAdapter {

  /**
   * @param {AdapterOptions} adapterOptions
   * @param {Record<string, boolean>} filterValues
   */
  constructor(adapterOptions, filterValues) {
    /** @type {WeakMap<object, [number, number] | null>} */
    this._ranges = new WeakMap();
    this._filterValues = filterValues;
    this._adapterOptions = adapterOptions;
  }

  /**
   * Used by UI components to render an appropriate input for each filter.
   * @returns {TreeFilter[]}
   */
  getConfigurableFilters() {
    return (this._adapterOptions.filters || []).filter(filter => Boolean(filter.key));
  }

  /**
   * A more or less human readable name of the node.
   * @param {unknown} node
   * @returns {string}
   */
  getNodeName(node) {
    return this._adapterOptions.nodeToName(node);
  }

  /**
   * The start and end indicies of the node in the source text. The return value
   * is an array of form `[start, end]`. This is used for highlighting source
   * text and focusing nodes in the tree.
   * @param {unknown} node
   * @returns {[number, number] | null | undefined}
   */
  getRange(node) {
    if (node == null) {
      return null;
    }
    // Typecast: node is unknown but guaranteed non-null here; WeakMap requires object keys
    if (this._ranges.has(/** @type {object} */ (node))) {
      return this._ranges.get(/** @type {object} */ (node));
    }
    const {nodeToRange} = this._adapterOptions;
    let range = nodeToRange(node);
    if (node && typeof node === 'object') {
      this._ranges.set(node, range);
    }
    return range;
  }

  /**
   * @param {unknown} node
   * @param {string} key
   * @param {number} position
   * @returns {boolean}
   */
  isInRange(node, key, position) {
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

  /**
   * @param {unknown} node
   * @param {string} key
   * @param {number} position
   * @param {Set<unknown>} [seen]
   * @returns {boolean}
   */
  hasChildrenInRange(node, key, position, seen=new Set()) {
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
    for (const {value: child, key} of this.walkNode(node)) {
      if (this.isInRange(child, key, position)) {
        return true;
      }
    }
    for (const {value: child, key} of this.walkNode(node)) {
      if (seen.has(child)) {
        continue;
      }
      if (this.hasChildrenInRange(child, key, position, seen)) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {string} key
   * @returns {boolean}
   */
  isLocationProp(key) {
    return this._adapterOptions.locationProps && this._adapterOptions.locationProps.has(key);
  }

  /**
   * Whether or not the provided node should be automatically expanded.
   * @param {unknown} node
   * @param {string} key
   * @returns {boolean}
   */
  opensByDefault(node, key) {
    return this._adapterOptions.openByDefault(node, key);
  }

  /**
   * @param {unknown} node
   * @returns {boolean}
   */
  isArray(node) {
    return Array.isArray(node);
  }

  /**
   * @param {unknown} node
   * @returns {boolean}
   */
  isObject(node) {
    return Boolean(node) && typeof node === 'object' && !this.isArray(node);
  }

  /**
   * A generator to iterate over each "property" of the node.
   * @param {unknown} node
   * @yields {WalkResult}
   * @returns {Generator<WalkResult>}
   */
  *walkNode(node) {
    if (node != null) {
      for (const result of this._adapterOptions.walkNode(node)) {
        if (
          (this._adapterOptions.filters || []).some(filter => {
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

/** @type {Record<string, *>} */
const TreeAdapterConfigs = {
  default: {
    filters: [],
    openByDefault: () => false,
    nodeToRange: /** @returns {null} */ () => null,
    nodeToName: /** @returns {string} */ () => { throw new Error('nodeToName must be passed');},
    walkNode: /** @returns {never} */ () => { throw new Error('walkNode must be passed');},
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
      'elements', // array literals
      'declarations', // variable declaration
      'expression', // expression statements
    ]),
    /** @param {Record<string, unknown>} node @param {string} key */
    openByDefault(node, key) {
      return node && this.openByDefaultNodes.has(node.type) ||
        this.openByDefaultKeys.has(key);
    },
    /** @param {Record<string, unknown>} node */
    nodeToRange(node) {
      if (!(node && typeof node === 'object')) {
        return null;
      }
      if (node.range) {
        return node.range;
      }
      if (typeof node.start === 'number' && typeof node.end === 'number') {
        return [node.start, node.end];
      }
      return null;
    },
    /** @param {Record<string, unknown>} node */
    nodeToName(node) {
      return node.type;
    },
    /** @param {Record<string, unknown>} node */
    *walkNode(node) {
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

/**
 * @param {number} position
 * @returns {boolean}
 */
function isValidPosition(position) {
  return Number.isInteger(position);
}

/**
 * @param {Set<string>} [keys]
 * @param {string} [key]
 * @param {string} [label]
 * @returns {TreeFilter}
 */
export function ignoreKeysFilter(keys=new Set(), key, label) {
  return {
    key,
    label,
    test(_, key) { return  keys.has(key); },
  };
}

/**
 * @param {Set<string>} keys
 * @returns {TreeFilter}
 */
export function locationInformationFilter(keys) {
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
    test(value) { return typeof value === 'function'; },
  };
}

/**
 * @returns {TreeFilter}
 */
export function emptyKeysFilter() {
  return {
    key: 'hideEmptyKeys',
    label: 'Hide empty keys',
    test(value, key, fromArray) { return value == null && !fromArray; },
  };
}

/**
 * @param {Set<string>} [keys]
 * @returns {TreeFilter}
 */
export function typeKeysFilter(keys) {
  return ignoreKeysFilter(
    keys,
    'hideTypeKeys',
    'Hide type keys',
  );
}

/**
 * @param {string} type
 * @param {Partial<AdapterOptions>} adapterOptions
 * @param {Record<string, boolean>} filterValues
 * @returns {TreeAdapter}
 */
function createTreeAdapter(type, adapterOptions, filterValues) {
  if (TreeAdapterConfigs[type] == null) {
    throw new Error(`Unknown tree adapter type "${type}"`);
  }
  return new TreeAdapter(
    Object.assign({}, TreeAdapterConfigs[type], adapterOptions),
    filterValues,
  );
}

/**
 * @param {ParseResult} parseResult
 * @param {Record<string, boolean>} filterValues
 * @returns {TreeAdapter}
 */
export function treeAdapterFromParseResult({treeAdapter}, filterValues) {
  return createTreeAdapter(
    treeAdapter.type,
    treeAdapter.options,
    filterValues,
  );
}
