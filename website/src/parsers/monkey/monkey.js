import pkg from '@gengjiawen/monkey-wasm/package.json';

import defaultParserInterface from '../utils/defaultParserInterface'

/**
 * @typedef {{ parse(code: string): string }} MonkeyParser
 * @typedef {{ type?: string, span?: { start: number, end: number }, [key: string]: unknown }} MonkeyNode
 */

const ID = 'monkey'

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://monkeylang.org/',
  locationProps: new Set(['span']),

  async loadParser(/** @type {(realParser: {parse: (code: string) => string}) => void} */ callback) {
    require(['@gengjiawen/monkey-wasm/monkey_wasm.js'], callback);
  },

  parse(/** @type {{parse: (code: string) => string}} */ parser, /** @type {string} */ code) {
    try {
      return /** @type {Record<string, unknown>} */ (JSON.parse(parser.parse(code)));
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError(/** @type {string} */ (message));
    }
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node.type
  },

  nodeToRange(/** @type {{span?: {start: number, end: number}, [key: string]: unknown}} */ node) {
    if (node && node.span && typeof node.span.start === 'number') {
      return [node.span.start, node.span.end];
    }
  },
}
