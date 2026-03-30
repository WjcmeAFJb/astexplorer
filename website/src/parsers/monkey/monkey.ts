import pkg from '@gengjiawen/monkey-wasm/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

/**
 * @typedef {typeof import('@gengjiawen/monkey-wasm')} MonkeyModule
 */

const ID = 'monkey'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://monkeylang.org/',
  locationProps: new Set(['span']),

  async loadParser(callback: (realParser: MonkeyModule) => void) {
    require(['@gengjiawen/monkey-wasm/monkey_wasm.js'], callback);
  },

  parse(parser: MonkeyModule, code: string) {
    try {
      return /** @type {{type?: string, span?: {start: number, end: number}}} */ (JSON.parse(parser.parse(code)));
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError(/** @type {string} */ (message));
    }
  },

  getNodeName(/** @type {{type?: string}} */ node) {
    return node.type
  },

  nodeToRange(/** @type {{span?: {start: number, end: number}, [key: string]: unknown}} */ node) {
    if (node && node.span && typeof node.span.start === 'number') {
      return [node.span.start, node.span.end];
    }
  },
}
