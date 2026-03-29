import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'cssom/package.json';

const ID = 'cssom';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/NV/CSSOM',
  locationProps: new Set(['__starts', '__ends']),
  typeProps: new Set(),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['cssom/lib/parse'], callback);
  },

  parse(/** @type {DynModule} */ CSSOM, /** @type {string} */ code) {
    return CSSOM.parse(code);
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.constructor.name;
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    let { __starts, __ends } = node;
    if (__ends === undefined && node.parentRule) {
      ({ __ends } = node.parentRule);
    }
    if (__ends !== undefined) {
      return [__starts, __ends];
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'cssRules' || key === 'style';
  },

  _ignoredProperties: new Set(['parentRule', 'parentStyleSheet', '_importants']),
};
