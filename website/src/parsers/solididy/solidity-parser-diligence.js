import pkg from 'solidity-parser-diligence/package.json';
import defaultParserInterface from '../utils/defaultParserInterface';

const ID = 'solidity-parser-diligence';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/consensys/solidity-parser-antlr',

  loadParser(/** @type {*} */ callback) {
    require(['solidity-parser-diligence'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code, /** @type {*} */ options) {
    return parser.parse(code, options);
  },

  opensByDefault(/** @type {*} */ node, /** @type {*} */ key) {
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

