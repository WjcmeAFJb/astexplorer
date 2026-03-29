import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@webassemblyjs/wast-parser/package.json';

/**
 * @typedef {Object} LineOffsetsMixin
 * @property {number[]} lineOffsets
 * @property {(pos: {line: number, column: number}) => number} getOffset
 */

const ID = 'wat-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://webassembly.js.org/',

  locationProps: new Set(['loc']),

  /** @this {LineOffsetsMixin} */
  getOffset(/** @type {Record<string, Function>} */ { line, column }) {
    return this.lineOffsets[line - 1] + column;
  },

  /** @this {LineOffsetsMixin} */
  nodeToRange(/** @type {Record<string, Function>} */ { loc }) {
    if (!loc) return;
    return [loc.start, loc.end].map(pos => this.getOffset(pos));
  },

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['@webassemblyjs/wast-parser'], function(parser) {
      callback(parser);
    });
  },

  /** @this {LineOffsetsMixin} */
  parse(/** @type {Record<string, Function>} */ { parse }, /** @type {string} */ code) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parse(code);
  },
};
