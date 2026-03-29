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

  loadParser(/** @type {*} */ callback) {
    require(['svelte/compiler'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code, /** @type {*} */ options) {
    return parser.compile(code, options).ast;
  },

  nodeToRange(/** @type {*} */ node) {
    if (node.type || node.name) {
      return [node.start, node.end];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {*} */ node) {
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
