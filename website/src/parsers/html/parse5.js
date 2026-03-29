import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'parse5/package.json';

/** @typedef {{ Parser: new (opts: object) => { parse(code: string): Parse5Node }, TreeAdapters: Record<string, object> }} Parse5Module */
/** @typedef {{ type?: string, name?: string, nodeName?: string, tagName?: string, sourceCodeLocation?: { startOffset: number, endOffset: number }, children?: Parse5Node[], childNodes?: Parse5Node[], [k: string]: unknown }} Parse5Node */

const ID = 'parse5';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['sourceCodeLocation']),
  typeProps: new Set(['type', 'name', 'nodeName', 'tagName']),

  loadParser(/** @type {(realParser: Parse5Module) => void} */ callback) {
    require([
      'parse5/lib/parser',
      'parse5/lib/tree-adapters/default',
      'parse5-htmlparser2-tree-adapter',
    ], (/** @type {any} */ Parser, /** @type {any} */ defaultAdapter, /** @type {any} */ htmlparser2Adapter) => {
      callback({
        Parser,
        TreeAdapters: {
          default: defaultAdapter,
          htmlparser2: htmlparser2Adapter,
        },
      });
    });
  },

  /** @this {{options: {treeAdapter?: string; [k: string]: unknown}}} */
  parse(/** @type {Parse5Module} */ { Parser, TreeAdapters }, /** @type {string} */ code, /** @type {any} */ options) {
    this.options = options;
    return new Parser({
      treeAdapter: TreeAdapters[this.options.treeAdapter],
      sourceCodeLocationInfo: true,
    }).parse(code);
  },

  /** @this {{options: {treeAdapter?: string; [k: string]: unknown}}} */
  getNodeName(/** @type {Parse5Node} */ node) {
    if (this.options.treeAdapter === 'htmlparser2') {
      if (node.type) {
        return node.type + (node.name && node.type !== 'root' ? `(${node.name})` : '');
      }
    } else {
      return node.nodeName;
    }
  },

  nodeToRange(/** @type {Parse5Node} */ { sourceCodeLocation: loc }) {
    if (loc) {
      return [loc.startOffset, loc.endOffset];
    }
  },

  opensByDefault(/** @type {Parse5Node} */ node, /** @type {string} */ key) {
    return key === 'children' || key === 'childNodes';
  },

  getDefaultOptions() {
    return {
      treeAdapter: 'default',
    };
  },

  _getSettingsConfiguration() {
    return {
      fields : [
        ['treeAdapter', ['default', 'htmlparser2']],
      ],
    };
  },

  _ignoredProperties: new Set(['parentNode', 'prev', 'next', 'parent', 'firstChild', 'lastChild']),
};
