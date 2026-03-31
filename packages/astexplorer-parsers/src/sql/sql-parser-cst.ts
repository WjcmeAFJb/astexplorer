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

  loadParser(callback: (realParser: typeof import('sql-parser-cst')) => void) {
    require(['sql-parser-cst'], callback);
  },

  parse(parser: typeof import('sql-parser-cst'), code: string, options: import('sql-parser-cst').ParserOptions) {
    return parser.parse(code, options);
  },

  getNodeName(node: import('sql-parser-cst/lib/cst/Node').Node) {
    return node.type;
  },

  nodeToRange(node: {range?: [number, number], [key: string]: unknown}) {
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
