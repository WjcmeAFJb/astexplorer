import defaultParserInterface from './utils/defaultCSSParserInterface';
import pkg from 'css/package.json';

type ReworkNode = {
  type?: string;
  position?: { start: {line: number, column: number}, end: {line: number, column: number} };
  rules?: ReworkNode[];
  [key: string]: unknown;
};
type ReworkParse = (code: string) => ReworkNode;

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
  nodeToRange({ position: range }: ReworkNode) {
    if (!range) return;
    return [range.start, range.end].map(pos => this.getOffset(pos));
  },

  opensByDefault(node: ReworkNode, key: string) {
    return key === 'rules';
  },

  _ignoredProperties: new Set(['parsingErrors', 'source', 'content']),
};
