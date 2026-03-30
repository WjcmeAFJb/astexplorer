import defaultParserInterface from './utils/defaultCSSParserInterface';
import pkg from 'css/package.json';

/**
 * @typedef {(code: string) => ReworkNode} ReworkParse
 *
 * @typedef {{
 *   type?: string,
 *   position?: { start: {line: number, column: number}, end: {line: number, column: number} },
 *   rules?: ReworkNode[],
 *   [key: string]: unknown,
 * }} ReworkNode
 */

const ID = 'rework';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/reworkcss/rework',
  locationProps: new Set(['position']),

  loadParser(callback: (realParser: ReworkParse) => void) {
    require(['css/lib/parse'], (m: ReworkParse) => callback(m));
  },

  /** @this {import('./utils/defaultCSSParserInterface').LineOffsetsMixin} */
  nodeToRange(/** @type {ReworkNode} */ { position: range }) {
    if (!range) return;
    return [range.start, range.end].map(pos => this.getOffset(pos));
  },

  opensByDefault(node: ReworkNode, key: string) {
    return key === 'rules';
  },

  _ignoredProperties: new Set(['parsingErrors', 'source', 'content']),
};
