import defaultParserInterface from '../../utils/defaultParserInterface';

/**
 * @typedef {Object} LineOffsetsMixin
 * @property {number[]} lineOffsets
 * @property {(pos: {line: number, column: number}) => number} getOffset
 */

export default {
  ...defaultParserInterface,

  /** @this {LineOffsetsMixin} */
  getOffset(/** @type {*} */ { line, column }) {
    return this.lineOffsets[line - 1] + column - 1;
  },

  /** @this {LineOffsetsMixin} */
  parse(/** @type {*} */ parseCSS, /** @type {*} */ code) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parseCSS(code);
  },
};
