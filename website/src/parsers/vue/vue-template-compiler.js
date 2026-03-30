import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'vue-template-compiler/package.json';

const ID = 'vue-template-compiler';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['tag']),

  loadParser(/** @type {(realParser: typeof import('vue-template-compiler')) => void} */ callback) {
    require(['vue-template-compiler/browser'], callback);
  },

  parse(/** @type {typeof import('vue-template-compiler')} */ parser, /** @type {string} */ code, /** @type {Parameters<typeof import('vue-template-compiler').compile>[1]} */ options) {
    return parser.compile(code, options).ast;
  },

  nodeToRange(/** @type {{type?: string, name?: string, start?: number, end?: number, [key: string]: unknown}} */ node) {
    if (node.type || node.name) {
      return [node.start, node.end];
    }
  },

  opensByDefault(/** @type {import('vue-template-compiler').ASTNode} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {{tag?: string}} */ node) {
    return node.tag;
  },

  getDefaultOptions() {
    return {
      outputSourceRange: true,
      whitespace: 'preserve',
    };
  },
  _ignoredProperties: new Set(['parent']),
};
