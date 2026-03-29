import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'parse5/package.json';

const ID = 'parse5';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['sourceCodeLocation']),
  typeProps: new Set(['type', 'name', 'nodeName', 'tagName']),

  loadParser(/** @type {*} */ callback) {
    require([
      'parse5/lib/parser',
      'parse5/lib/tree-adapters/default',
      'parse5-htmlparser2-tree-adapter',
    ], (Parser, defaultAdapter, htmlparser2Adapter) => {
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
  parse(/** @type {*} */ { Parser, TreeAdapters }, /** @type {*} */ code, /** @type {*} */ options) {
    this.options = options;
    return new Parser({
      treeAdapter: TreeAdapters[this.options.treeAdapter],
      sourceCodeLocationInfo: true,
    }).parse(code);
  },

  /** @this {{options: {treeAdapter?: string; [k: string]: unknown}}} */
  getNodeName(/** @type {*} */ node) {
    if (this.options.treeAdapter === 'htmlparser2') {
      if (node.type) {
        return node.type + (node.name && node.type !== 'root' ? `(${node.name})` : '');
      }
    } else {
      return node.nodeName;
    }
  },

  nodeToRange(/** @type {*} */ { sourceCodeLocation: loc }) {
    if (loc) {
      return [loc.startOffset, loc.endOffset];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
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
