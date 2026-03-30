import pkg from 'solidity-parser-antlr/package.json';
import defaultParserInterface from '../utils/defaultParserInterface';

const ID = 'solidity-parser-antlr';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/federicobond/solidity-parser-antlr',

  loadParser(/** @type {(realParser: typeof import('solidity-parser-antlr')) => void} */ callback) {
    require(['solidity-parser-antlr'], callback);
  },

  parse(/** @type {typeof import('solidity-parser-antlr')} */ parser, /** @type {string} */ code, /** @type {import('solidity-parser-antlr').ParserOpts} */ options) {
    return parser.parse(code, options);
  },

  opensByDefault(/** @type {import('solidity-parser-antlr').BaseASTNode} */ node, /** @type {string} */ key) {
    return node.type === 'SourceUnit' ||
      node.type === 'ContractDefinition' ||
      key === 'children' ||
      key === 'subNodes' ||
      key === 'body'
  },

  getDefaultOptions() {
    return {
      range: true,
      loc: false,
      tolerant: false,
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        'range',
        'loc',
        'tolerant',
      ],
    };
  },

};

