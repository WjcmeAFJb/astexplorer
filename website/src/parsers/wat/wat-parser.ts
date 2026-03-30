import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from '@webassemblyjs/wast-parser/package.json';

type LineOffsetsMixin = {
  lineOffsets: number[];
};

const ID = 'wat-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://webassembly.js.org/',

  locationProps: new Set(['loc']),

  /** @this {LineOffsetsMixin} */
  getOffset({ line, column }: {line: number, column: number}) {
    return this.lineOffsets[line - 1] + column;
  },

  /** @this {LineOffsetsMixin} */
  nodeToRange({ loc }: {loc?: {start: {line: number, column: number}, end: {line: number, column: number}}}) {
    if (!loc) return;
    return [loc.start, loc.end].map(pos => this.getOffset(pos));
  },

  loadParser(callback: (realParser: unknown) => void) {
    require(['@webassemblyjs/wast-parser'], function(parser) {
      callback(parser);
    });
  },

  /** @this {LineOffsetsMixin} */
  parse({ parse }: {parse: (code: string) => object}, code: string) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while (index = code.indexOf('\n', index) + 1); // eslint-disable-line no-cond-assign
    return parse(code);
  },
};
