import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'san/package.json';

const ID = 'san';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set([]),
  typeProps: new Set(['tag']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['san'], callback);
  },

  parse(/** @type {DynModule} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parser.parseTemplate(code, options).children[0];
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.tagName;
  },

  getDefaultOptions() {
    return {};
  },
  _ignoredProperties: new Set([]),
};
