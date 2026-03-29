import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'filbert/package.json';

const ID = 'python';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/differentmatt/filbert',
  locationProps: new Set(['range', 'loc', 'start', 'end']),

  loadParser(/** @type {*} */ callback) {
    require(['filbert'], (parser) => {
      callback({ parser });
    });
  },

  parse(/** @type {*} */ { parser }, /** @type {*} */ code) {
    return parser.parse(code, {
        locations: true,
        ranges: true,
    });
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    switch (key) {
      case 'block':
      case 'nodes':
        return true;
    }
  },

  nodeToRange(/** @type {*} */ node) {
    const { range } = node;
    if (typeof range === 'object') {
      return range;
    }
  },

};
