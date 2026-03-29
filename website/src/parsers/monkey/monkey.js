import pkg from '@gengjiawen/monkey-wasm/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

const ID = 'monkey'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://monkeylang.org/',
  locationProps: new Set(['span']),

  async loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['@gengjiawen/monkey-wasm/monkey_wasm.js'], callback);
  },

  parse(/** @type {DynModule} */ parser, /** @type {string} */ code) {
    try {
      return JSON.parse(parser.parse(code));
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError(message);
    }
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.type
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (node && node.span && typeof node.span.start === 'number') {
      return [node.span.start, node.span.end];
    }
  },
}
