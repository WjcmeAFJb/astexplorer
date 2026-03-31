import pkg from 'solidity-parser-antlr/package.json';
import defaultParserInterface from '../utils/defaultParserInterface';

const ID = 'solidity-parser-antlr';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/federicobond/solidity-parser-antlr',

  loadParser(callback: (realParser: typeof import('solidity-parser-antlr')) => void) {
    require(['solidity-parser-antlr'], callback);
  },

  parse(parser: typeof import('solidity-parser-antlr'), code: string, options: import('solidity-parser-antlr').ParserOpts) {
    return parser.parse(code, options);
  },

  opensByDefault(node: import('solidity-parser-antlr').BaseASTNode, key: string) {
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

