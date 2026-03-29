import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'sql-parser-cst/package.json';

const ID = 'sql-parser-cst';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/nene/sql-parser-cst',
  locationProps: new Set(['range']),

  loadParser(/** @type {*} */ callback) {
    require(['sql-parser-cst'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code, /** @type {*} */ options) {
    return parser.parse(code, options);
  },

  getNodeName(/** @type {*} */ node) {
    return node.type;
  },

  nodeToRange(/** @type {*} */ node) {
    return node.range;
  },

  getDefaultOptions() {
    return {
      dialect: 'sqlite',
      preserveComments: true,
      includeRange: true,
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        ['dialect', ['sqlite', 'mysql']],
        'preserveComments',
        'preserveNewlines',
        'preserveSpaces',
        'includeRange',
      ],
    };
  },
};
