import defaultParserInterface from './utils/defaultESTreeParserInterface';
import pkg from '@typescript-eslint/parser/package.json';

const ID = '@typescript-eslint/parser';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://typescript-eslint.io/',
  locationProps: new Set(['loc', 'start', 'end', 'range']),

  loadParser(/** @type {*} */ callback) {
    require(['@typescript-eslint/parser'], callback);
  },

  parse(/** @type {*} */ parser, /** @type {*} */ code, /** @type {*} */ options) {
    return parser.parse(code, options);
  },

  getDefaultOptions() {
    return {
      range: true,
      loc: false,
      tokens: false,
      comment: false,
      useJSXTextNode: false,
      ecmaVersion: 6,
      sourceType: 'module',

      ecmaFeatures: {
        jsx: true,
      },
    };
  },

  _getSettingsConfiguration(/** @type {*} */ defaultOptions) {
    return {
      fields: [
        ['ecmaVersion', [3, 5, 6, 7, 8, 9], (/** @type {*} */ value) => Number(value)],
        ['sourceType', ['script', 'module']],
        'range',
        'loc',
        'tokens',
        'comment',
        'useJSXTextNode',
        {
          key: 'ecmaFeatures',
          title: 'ecmaFeatures',
          fields: Object.keys(defaultOptions.ecmaFeatures),
          settings:
          (/** @type {*} */ settings) => settings.ecmaFeatures || {...defaultOptions.ecmaFeatures},
        },
      ],
      required: new Set(['range']),
    };
  },
};
