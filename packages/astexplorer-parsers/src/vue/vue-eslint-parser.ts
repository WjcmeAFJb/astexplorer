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

  loadParser(callback: (realParser: typeof import('vue-eslint-parser')) => void) {
    require(['vue-eslint-parser'], callback);
  },

  parse(parser: typeof import('vue-eslint-parser'), code: string, options: {ecmaVersion?: number, sourceType?: string, vueFeatures?: {filter?: boolean, interpolationAsNonHTML?: boolean}}) {
    if (Object.keys(options).length === 0) {
      options = this.getDefaultOptions();
    }
    return parser.parse(code, options);
  },

  nodeToRange(node: {type?: string, name?: string, range?: [number, number], [key: string]: unknown}) {
    if (node.type || node.name) {
      return node.range;
    }
  },

  opensByDefault(node: import('vue-eslint-parser/ast').Node, key: string) {
    return key === 'children';
  },

  getNodeName(node: {tag?: string}) {
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
        ['ecmaVersion', [3, 5, 6, 7, 8, 9, 10, 11], (value: unknown) => Number(value)],
        ['sourceType', ['script', 'module']],
        {
          key: 'vueFeatures',
          title: 'vueFeatures',
          fields: Object.keys(defaultOptions.vueFeatures),
          settings:
          (settings: {vueFeatures?: {filter?: boolean, interpolationAsNonHTML?: boolean}}) => settings.vueFeatures || {...defaultOptions.vueFeatures},
        },
      ],
    };
  },

  _ignoredProperties: new Set(['parent', 'tokens']),
};
