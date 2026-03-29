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

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['filbert'], (parser) => {
      callback({ parser });
    });
  },

  parse(/** @type {Record<string, any>} */ { parser }, /** @type {string} */ code) {
    return parser.parse(code, {
        locations: true,
        ranges: true,
    });
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    switch (key) {
      case 'block':
      case 'nodes':
        return true;
    }
  },

  nodeToRange(/** @type {any} */ node) {
    const { range } = node;
    if (typeof range === 'object') {
      return range;
    }
  },

};
