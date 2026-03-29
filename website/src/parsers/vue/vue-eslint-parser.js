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

  loadParser(/** @type {(realParser: Record<string, unknown>) => void} */ callback) {
    require(['vue-eslint-parser'], callback);
  },

  parse(/** @type {{parse: (code: string, options: Record<string, unknown>) => unknown}} */ parser, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    if (Object.keys(options).length === 0) {
      options = this.getDefaultOptions();
    }
    return parser.parse(code, options);
  },

  nodeToRange(/** @type {{type?: string, name?: string, range?: [number, number], [key: string]: unknown}} */ node) {
    if (node.type || node.name) {
      return node.range;
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
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
        ['ecmaVersion', [3, 5, 6, 7, 8, 9, 10, 11], (/** @type {unknown} */ value) => Number(value)],
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
