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

  async loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['@gengjiawen/monkey-wasm/monkey_wasm.js'], callback);
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code) {
    try {
      return JSON.parse(parser.parse(code));
    } catch (message) {
      // AST Explorer expects the thrown error to be an object, not a string.
      throw new SyntaxError(message);
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
