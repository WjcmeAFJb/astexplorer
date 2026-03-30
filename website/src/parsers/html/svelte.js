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

  loadParser(/** @type {(realParser: typeof import('svelte/compiler')) => void} */ callback) {
    require(['svelte/compiler'], callback);
  },

  parse(/** @type {typeof import('svelte/compiler')} */ parser, /** @type {string} */ code, /** @type {import('svelte/compiler').CompileOptions} */ options) {
    return parser.compile(code, options).ast;
  },

  nodeToRange(/** @type {{type?: string, name?: string, start?: number, end?: number, [key: string]: unknown}} */ node) {
    if (node.type || node.name) {
      return [node.start, node.end];
    }
  },

  opensByDefault(/** @type {ReturnType<typeof import('svelte/compiler').compile>['ast']} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {{tag?: string}} */ node) {
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
