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

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['svelte/compiler'], callback);
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parser.compile(code, options).ast;
  },

  nodeToRange(/** @type {any} */ node) {
    if (node.type || node.name) {
      return [node.start, node.end];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
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
