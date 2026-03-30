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

  loadParser(/** @type {(realParser: typeof import('sql-parser-cst')) => void} */ callback) {
    require(['sql-parser-cst'], callback);
  },

  parse(/** @type {typeof import('sql-parser-cst')} */ parser, /** @type {string} */ code, /** @type {import('sql-parser-cst').ParserOptions} */ options) {
    return parser.parse(code, options);
  },

  getNodeName(/** @type {import('sql-parser-cst/lib/cst/Node').Node} */ node) {
    return node.type;
  },

  nodeToRange(/** @type {{range?: [number, number], [key: string]: unknown}} */ node) {
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
