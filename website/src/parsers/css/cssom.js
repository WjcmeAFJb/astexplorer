import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'cssom/package.json';

/**
 * @typedef {{parse: (code: string) => CSSOMNode}} CSSOMParser
 * @typedef {{__starts?: number, __ends?: number, parentRule?: CSSOMNode, cssRules?: CSSOMNode[], style?: Record<string, string>, constructor: Function, [key: string]: unknown}} CSSOMNode
 */

const ID = 'cssom';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/NV/CSSOM',
  locationProps: new Set(['__starts', '__ends']),
  typeProps: new Set(),

  loadParser(/** @type {(realParser: CSSOMParser) => void} */ callback) {
    require(['cssom/lib/parse'], (/** @type {CSSOMParser} */ m) => callback(m));
  },

  parse(/** @type {CSSOMParser} */ CSSOM, /** @type {string} */ code) {
    return CSSOM.parse(code);
  },

  getNodeName(/** @type {CSSOMNode} */ node) {
    return node.constructor.name;
  },

  nodeToRange(/** @type {CSSOMNode} */ node) {
    let { __starts, __ends } = node;
    if (__ends === undefined && node.parentRule) {
      ({ __ends } = node.parentRule);
    }
    if (__ends !== undefined) {
      return [__starts, __ends];
    }
  },

  opensByDefault(/** @type {CSSOMNode} */ node, /** @type {string} */ key) {
    return key === 'cssRules' || key === 'style';
  },

  _ignoredProperties: new Set(['parentRule', 'parentStyleSheet', '_importants']),
};
