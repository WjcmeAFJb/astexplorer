import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'svelte/package.json';

const ID = 'svelte';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['tag']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['svelte/compiler'], callback);
  },

  parse(/** @type {DynModule} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parser.compile(code, options).ast;
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (node.type || node.name) {
      return [node.start, node.end];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.tag;
  },

  getDefaultOptions() {
    return {
      preserveWhitespace: true,
      preserveComments: true,
    };
  },
  _ignoredProperties: new Set(['parent']),
};
