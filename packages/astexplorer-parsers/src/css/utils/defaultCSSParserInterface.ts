import defaultParserInterface from '../../utils/defaultParserInterface';

export type LineOffsetsMixin = {
  lineOffsets: number[];
  getOffset(pos: {line: number, column: number}): number;
};

type CSSPosition = {line: number, column: number};

export default {
  ...defaultParserInterface,

  getOffset(this: LineOffsetsMixin, { line, column }: CSSPosition) {
    return this.lineOffsets[line - 1] + column - 1;
  },

  parse(this: LineOffsetsMixin, parseCSS: (code: string) => object, code: string) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parseCSS(code);
  },
};
