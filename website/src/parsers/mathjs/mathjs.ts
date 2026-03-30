import pkg from 'mathjs/package.json';
type MathJSParser = import('mathjs').MathJsStatic;
type MathJSNode = import('mathjs').MathNode;

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

  async loadParser(callback: (realParser: MathJSParser) => void) {
    require(['mathjs'], callback);
  },

  parse(parser: MathJSParser, code: string) {
    try {
      return parser.parse(code)
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError((message as string));
    }
  },

  getNodeName(node: MathJSNode) {
    return node.type
  },

  // TODO once this feature is added to mathjs
  // nodeToRange(node) {
  // },

  opensByDefault(node: MathJSNode) {
    return node.type === 'BlockNode'
  },
}
