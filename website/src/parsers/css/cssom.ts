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

  loadParser(callback: (realParser: CSSOMParser) => void) {
    require(['cssom/lib/parse'], (m: CSSOMParser) => callback(m));
  },

  parse(CSSOM: CSSOMParser, code: string) {
    return CSSOM.parse(code);
  },

  getNodeName(node: CSSOMNode) {
    return node.constructor.name;
  },

  nodeToRange(node: CSSOMNode) {
    let { __starts, __ends } = node;
    if (__ends === undefined && node.parentRule) {
      ({ __ends } = node.parentRule);
    }
    if (__ends !== undefined) {
      return [__starts, __ends];
    }
  },

  opensByDefault(node: CSSOMNode, key: string) {
    return key === 'cssRules' || key === 'style';
  },

  _ignoredProperties: new Set(['parentRule', 'parentStyleSheet', '_importants']),
};
