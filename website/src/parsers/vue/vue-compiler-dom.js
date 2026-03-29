import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@vue/compiler-dom/package.json';

const ID = '@vue/compiler-dom';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['tag']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['@vue/compiler-dom'], callback);
  },

  parse(/** @type {DynModule} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return parser.parse(code, options);
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (node.type || node.name) {
      return [node.loc.start.offset, node.loc.end.offset];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.tag;
  },

  getDefaultOptions() {
    return {};
  },

  _ignoredProperties: new Set([
    'components',
    'directives',
    'codegenNode',
    'helpers',
    'hoists',
    'imports',
    'cached',
    'temps',
  ]),
};
