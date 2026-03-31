import pkg from 'solidity-parser-diligence/package.json';
import defaultParserInterface from '../utils/defaultParserInterface';

const ID = 'solidity-parser-diligence';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/consensys/solidity-parser-antlr',

  loadParser(callback: (realParser: typeof import('solidity-parser-diligence')) => void) {
    require(['solidity-parser-diligence'], callback);
  },

  parse(parser: typeof import('solidity-parser-diligence'), code: string, options: import('solidity-parser-diligence').ParserOpts) {
    return parser.parse(code, options);
  },

  opensByDefault(node: import('solidity-parser-diligence').BaseASTNode, key: string) {
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

