import defaultParserInterface from './utils/defaultCSSParserInterface';
import pkg from 'postcss/package.json';
import type { ChildNode as PostCSSNode } from 'postcss';

type PostCSSParsers = { 'built-in': import('postcss').Parser, scss: import('postcss').Parser, less: import('postcss').Parser, 'safe-parser': import('postcss').Parser, [key: string]: import('postcss').Parser, };

const ID = 'postcss';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['source']),

  loadParser(callback: (realParser: PostCSSParsers) => void) {
    require(['postcss/lib/parse', 'postcss-scss/lib/scss-parse', 'postcss-less/lib/', 'postcss-safe-parser'], (builtIn: import('postcss').Parser, scss: import('postcss').Parser, less: {parse: import('postcss').Parser}, safe: import('postcss').Parser) => {
      callback({
        'built-in': builtIn,
        scss,
        less: less.parse,
        'safe-parser': safe,
      });
    });
  },

  parse(parsers: PostCSSParsers, code: string, options: {parser: string}) {
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- .call() returns any; TS limitation
    return defaultParserInterface.parse.call(
      this,
      parsers[(options.parser as string)],
      code,
    );
  },

  nodeToRange(this: import('./utils/defaultCSSParserInterface').LineOffsetsMixin, { source: range }: PostCSSNode) {
    if (!range || !range.end) return;
    return [
      this.getOffset(range.start),
      this.getOffset(range.end) + 1,
    ];
  },

  opensByDefault(node: PostCSSNode, key: string) {
    return key === 'nodes';
  },

  _ignoredProperties: new Set(['parent', 'input']),

  getDefaultOptions() {
    return {
      parser: 'built-in',
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        ['parser', ['built-in', 'scss', 'less', 'safe-parser']],
      ],
    };
  },
};
