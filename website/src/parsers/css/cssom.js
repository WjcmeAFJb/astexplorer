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

  loadParser(/** @type {*} */ callback) {
    require(['cssom/lib/parse'], callback);
  },

  parse(/** @type {*} */ CSSOM, /** @type {*} */ code) {
    return CSSOM.parse(code);
  },

  getNodeName(/** @type {*} */ node) {
    return node.constructor.name;
  },

  nodeToRange(/** @type {*} */ node) {
    let { __starts, __ends } = node;
    if (__ends === undefined && node.parentRule) {
      ({ __ends } = node.parentRule);
    }
    if (__ends !== undefined) {
      return [__starts, __ends];
    }
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    return key === 'cssRules' || key === 'style';
  },

  _ignoredProperties: new Set(['parentRule', 'parentStyleSheet', '_importants']),
};
