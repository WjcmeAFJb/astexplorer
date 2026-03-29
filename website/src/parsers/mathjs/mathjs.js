import pkg from 'mathjs/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

/**
 * @typedef {{ parse(code: string): MathJSNode }} MathJSParser
 * @typedef {{ type: string, [key: string]: unknown }} MathJSNode
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

  async loadParser(/** @type {(realParser: {parse: (code: string) => object}) => void} */ callback) {
    require(['mathjs'], callback);
  },

  parse(/** @type {{parse: (code: string) => object}} */ parser, /** @type {string} */ code) {
    try {
      return parser.parse(code)
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError(message);
    }
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node.type
  },

  // TODO once this feature is added to mathjs
  // nodeToRange(node) {
  // },

  opensByDefault(/** @type {Record<string, unknown>} */ node) {
    return node.type === 'BlockNode'
  },
}
