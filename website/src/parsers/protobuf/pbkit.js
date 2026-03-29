import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'pbkit/package.json';

const ID = 'pbkit';

export default {
  ...defaultParserInterface,
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://github.com/riiid/pbkit',
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['type']),

  loadParser(/** @type {*} */ callback) {
    require(['pbkit/core/parser/proto'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code) {
    return parser.parse(code).ast;
  },

  nodeToRange(/** @type {*} */ node) {
    const { start, end } = node;
    return [start, end];
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
    if (key === 'statements') {
      return true;
    }
  },
};
