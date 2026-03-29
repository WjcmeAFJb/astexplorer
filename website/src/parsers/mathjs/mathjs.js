import pkg from 'mathjs/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

const ID = 'mathjs'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://mathjs.org/',
  locationProps: new Set(['span']),

  defaultParserID: 'mathjs',

  async loadParser(/** @type {*} */ callback) {
    require(['mathjs'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code) {
    try {
      return parser.parse(code)
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError(message);
    }
  },

  getNodeName(/** @type {*} */ node) {
    return node.type
  },

  // TODO once this feature is added to mathjs
  // nodeToRange(node) {
  // },

  opensByDefault(/** @type {*} */ node) {
    return node.type === 'BlockNode'
  },
}
