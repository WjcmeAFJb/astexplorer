import defaultParserInterface from '../../utils/defaultParserInterface';

/**
 * @typedef {Object} LineOffsetsMixin
 * @property {number[]} lineOffsets
 * @property {(pos: {line: number, column: number}) => number} getOffset
 */

/**
 * @typedef {{line: number, column: number}} CSSPosition
 */

export default {
  ...defaultParserInterface,

  /** @this {LineOffsetsMixin} */
  getOffset(/** @type {CSSPosition} */ { line, column }) {
    return this.lineOffsets[line - 1] + column - 1;
  },

  /** @this {LineOffsetsMixin} */
  parse(/** @type {(code: string) => object} */ parseCSS, /** @type {string} */ code) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parseCSS(code);
  },
};
