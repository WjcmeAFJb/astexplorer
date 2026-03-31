import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'pbkit/package.json';

type PbkitParser = { parse(code: string): { ast: object } };
type PbkitNode = { start: number, end: number, type?: string, statements?: object[], [key: string]: unknown };

const ID = 'pbkit';

export default {
  ...defaultParserInterface,
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://github.com/riiid/pbkit',
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['type']),

  loadParser(callback: (realParser: PbkitParser) => void) {
    require(['pbkit/core/parser/proto'], callback);
  },

  parse(parser: PbkitParser, code: string) {
    return parser.parse(code).ast;
  },

  nodeToRange(node: {start?: number, end?: number, [key: string]: unknown}) {
    const { start, end } = node;
    return [start, end];
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    if (key === 'statements') {
      return true;
    }
  },
};
