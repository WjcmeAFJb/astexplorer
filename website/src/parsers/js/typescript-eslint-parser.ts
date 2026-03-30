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

  loadParser(callback: (realParser: typeof import('@typescript-eslint/parser')) => void) {
    require(['@typescript-eslint/parser'], callback);
  },

  parse(parser: typeof import('@typescript-eslint/parser'), code: string, options: import('@typescript-eslint/parser').ParserOptions) {
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

  _getSettingsConfiguration(defaultOptions: Record<string, unknown>) {
    return {
      fields: [
        ['ecmaVersion', [3, 5, 6, 7, 8, 9], (value: unknown) => Number(value)],
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
          (settings: Record<string, unknown>) => settings.ecmaFeatures || {...(defaultOptions.ecmaFeatures as Record<string, unknown>)},
        },
      ],
      required: new Set(['range']),
    };
  },
};
