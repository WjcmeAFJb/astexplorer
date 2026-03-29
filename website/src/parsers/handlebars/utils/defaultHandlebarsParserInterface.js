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
  parse(parseHandlebars, code) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parseHandlebars(code);
  },

  /** @this {LineOffsetsMixin} */
  getOffset({ line, column }) {
    return this.lineOffsets[line - 1] + column;
  },

  /** @this {LineOffsetsMixin} */
  nodeToRange({ loc }) {
    if (!loc) return;
    const serializedLoc = 'toJSON' in loc ? loc.toJSON() : loc;
    return [serializedLoc.start, serializedLoc.end].map(pos => this.getOffset(pos));
  },
};
