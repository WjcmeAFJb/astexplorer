import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'vue-eslint-parser/package.json';

const ID = 'vue-eslint-parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['tag']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['vue-eslint-parser'], callback);
  },

  parse(/** @type {DynModule} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    if (Object.keys(options).length === 0) {
      options = this.getDefaultOptions();
    }
    return parser.parse(code, options);
  },

  nodeToRange(/** @type {ASTNode} */ node) {
    if (node.type || node.name) {
      return node.range;
    }
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {ASTNode} */ node) {
    return node.tag;
  },

  getDefaultOptions() {
    return {
      ecmaVersion: 10,
      sourceType: 'module',
      vueFeatures: {
        filter: true,
        interpolationAsNonHTML: false,
      },
    };
  },

  _getSettingsConfiguration() {
    const defaultOptions = this.getDefaultOptions();

    return {
      fields: [
        ['ecmaVersion', [3, 5, 6, 7, 8, 9, 10, 11], (/** @type {ASTNodeValue} */ value) => Number(value)],
        ['sourceType', ['script', 'module']],
        {
          key: 'vueFeatures',
          title: 'vueFeatures',
          fields: Object.keys(defaultOptions.vueFeatures),
          settings:
          (/** @type {Record<string, unknown>} */ settings) => settings.vueFeatures || {...defaultOptions.vueFeatures},
        },
      ],
    };
  },

  _ignoredProperties: new Set(['parent', 'tokens']),
};
