import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'filbert/package.json';

/**
 * @typedef {{ parser: { parse(code: string, options: object): object } }} FilbertParser
 * @typedef {{ range?: [number, number] | number[], block?: object, nodes?: object[], [key: string]: unknown }} FilbertNode
 */

const ID = 'python';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/differentmatt/filbert',
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(callback: (realParser: unknown) => void) {
    require(['filbert'], (/** @type {{parse: (code: string, options: object) => object}} */ parser) => {
      callback({ parser });
    });
  },

  parse(/** @type {FilbertParser} */ { parser }, code: string) {
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

  nodeToRange(/** @type {{range?: [number, number] | Record<string, unknown>, [key: string]: unknown}} */ node) {
    const { range } = node;
    if (typeof range === 'object') {
      return range;
    }
  },

};
