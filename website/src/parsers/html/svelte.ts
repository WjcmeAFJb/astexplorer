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

  loadParser(callback: (realParser: typeof import('svelte/compiler')) => void) {
    require(['svelte/compiler'], callback);
  },

  parse(parser: typeof import('svelte/compiler'), code: string, options: import('svelte/compiler').CompileOptions) {
    return parser.compile(code, options).ast;
  },

  nodeToRange(/** @type {{type?: string, name?: string, start?: number, end?: number, [key: string]: unknown}} */ node) {
    if (node.type || node.name) {
      return [node.start, node.end];
    }
  },

  opensByDefault(node: ReturnType<typeof import('svelte/compiler').compile>['ast'], key: string) {
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
