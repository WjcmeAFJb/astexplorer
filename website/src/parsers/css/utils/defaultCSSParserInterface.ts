import defaultParserInterface from '../../utils/defaultParserInterface';

type LineOffsetsMixin = {
  lineOffsets: number[];
};

type CSSPosition = {line: number, column: number};

export default {
  ...defaultParserInterface,

  /** @this {LineOffsetsMixin} */
  getOffset({ line, column }: CSSPosition) {
    return this.lineOffsets[line - 1] + column - 1;
  },

  /** @this {LineOffsetsMixin} */
  parse(parseCSS: (code: string) => object, code: string) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parseCSS(code);
  },
};
