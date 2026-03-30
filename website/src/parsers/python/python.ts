import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'filbert/package.json';

type FilbertParser = { parser: { parse(code: string, options: object): object } };
type FilbertNode = { range?: [number, number] | number[], block?: object, nodes?: object[], [key: string]: unknown };

const ID = 'python';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/differentmatt/filbert',
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(callback: (realParser: unknown) => void) {
    require(['filbert'], (parser: {parse: (code: string, options: object) => object}) => {
      callback({ parser });
    });
  },

  parse({ parser }: FilbertParser, code: string) {
    return parser.parse(code, {
        locations: true,
        ranges: true,
    });
  },

  opensByDefault(node: Record<string, unknown>, key: string) {
    switch (key) {
      case 'block':
      case 'nodes':
        return true;
    }
  },

  nodeToRange(node: {range?: [number, number] | Record<string, unknown>, [key: string]: unknown}) {
    const { range } = node;
    if (typeof range === 'object') {
      return range;
    }
  },

};
