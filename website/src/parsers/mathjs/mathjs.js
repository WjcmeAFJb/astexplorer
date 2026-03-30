import pkg from 'mathjs/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

/**
 * @typedef {import('mathjs').MathJsStatic} MathJSParser
 * @typedef {import('mathjs').MathNode} MathJSNode
 */

const ID = 'mathjs'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://mathjs.org/',
  locationProps: new Set(['span']),

  defaultParserID: 'mathjs',

  async loadParser(/** @type {(realParser: MathJSParser) => void} */ callback) {
    require(['mathjs'], callback);
  },

  parse(/** @type {MathJSParser} */ parser, /** @type {string} */ code) {
    try {
      return parser.parse(code)
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError(/** @type {string} */ (message));
    }
  },

  getNodeName(/** @type {MathJSNode} */ node) {
    return node.type
  },

  // TODO once this feature is added to mathjs
  // nodeToRange(node) {
  // },

  opensByDefault(/** @type {MathJSNode} */ node) {
    return node.type === 'BlockNode'
  },
}
