import defaultParserInterface from '../../utils/defaultParserInterface';

/**
 * @typedef {Object} LineOffsetsMixin
 * @property {number[]} lineOffsets
 * @property {(pos: {line: number, column: number}) => number} getOffset
 */

export default {
  ...defaultParserInterface,

  locationProps: new Set(['loc']),

  /** @this {LineOffsetsMixin} */
  parse(/** @type {(code: string) => Record<string, unknown>} */ parseHandlebars, /** @type {string} */ code) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parseHandlebars(code);
  },

  /** @this {LineOffsetsMixin} */
  getOffset(/** @type {{line: number, column: number}} */ { line, column }) {
    return this.lineOffsets[line - 1] + column;
  },

  /** @this {LineOffsetsMixin} */
  nodeToRange(/** @type {{loc?: {toJSON?: () => {start: {line: number, column: number}, end: {line: number, column: number}}, start: {line: number, column: number}, end: {line: number, column: number}}, [key: string]: unknown}} */ { loc }) {
    if (!loc) return;
    const serializedLoc = 'toJSON' in loc ? loc.toJSON() : loc;
    return [serializedLoc.start, serializedLoc.end].map(pos => this.getOffset(pos));
  },
};
