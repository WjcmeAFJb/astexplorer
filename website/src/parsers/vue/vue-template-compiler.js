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

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['vue-template-compiler/browser'], callback);
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
      outputSourceRange: true,
      whitespace: 'preserve',
    };
  },
  _ignoredProperties: new Set(['parent']),
};
