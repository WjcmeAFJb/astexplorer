import defaultParserInterface from '../../utils/defaultParserInterface';

type LineOffsetsMixin = {
  lineOffsets: number[];
  getOffset(pos: {line: number, column: number}): number;
};

export default {
  ...defaultParserInterface,

  locationProps: new Set(['loc']),

  parse(this: LineOffsetsMixin, parseHandlebars: (code: string) => import('@glimmer/syntax').ASTv1.Template | ReturnType<typeof import('handlebars').parse>, code: string) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parseHandlebars(code);
  },

  getOffset(this: LineOffsetsMixin, { line, column }: {line: number, column: number}) {
    return this.lineOffsets[line - 1] + column;
  },

  nodeToRange(this: LineOffsetsMixin, { loc }: {loc?: {toJSON?: () => {start: {line: number, column: number}, end: {line: number, column: number}}, start: {line: number, column: number}, end: {line: number, column: number}}, [key: string]: unknown}) {
    if (!loc) return;
    const serializedLoc = 'toJSON' in loc ? loc.toJSON() : loc;
    return [serializedLoc.start, serializedLoc.end].map(pos => this.getOffset(pos));
  },
};
