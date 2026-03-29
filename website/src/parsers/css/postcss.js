import defaultParserInterface from './utils/defaultCSSParserInterface';
import pkg from 'postcss/package.json';

/**
 * @typedef {{
 *   'built-in': import('postcss').Parser,
 *   scss: import('postcss').Parser,
 *   less: import('postcss').Parser,
 *   'safe-parser': import('postcss').Parser,
 *   [key: string]: import('postcss').Parser,
 * }} PostCSSParsers
 *
 * @typedef {import('postcss').ChildNode} PostCSSNode
 */

const ID = 'postcss';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['source']),

  loadParser(/** @type {(realParser: PostCSSParsers) => void} */ callback) {
    require(['postcss/lib/parse', 'postcss-scss/lib/scss-parse', 'postcss-less/lib/', 'postcss-safe-parser'], (/** @type {import('postcss').Parser} */ builtIn, /** @type {import('postcss').Parser} */ scss, /** @type {{parse: import('postcss').Parser}} */ less, /** @type {import('postcss').Parser} */ safe) => {
      callback({
        'built-in': builtIn,
        scss,
        less: less.parse,
        'safe-parser': safe,
      });
    });
  },

  parse(/** @type {PostCSSParsers} */ parsers, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- .call() returns any; TS limitation
    return defaultParserInterface.parse.call(
      this,
      parsers[/** @type {string} */ (options.parser)],
      code,
    );
  },

  /** @this {import('./utils/defaultCSSParserInterface').LineOffsetsMixin} */
  nodeToRange(/** @type {PostCSSNode} */ { source: range }) {
    if (!range || !range.end) return;
    return [
      this.getOffset(range.start),
      this.getOffset(range.end) + 1,
    ];
  },

  opensByDefault(/** @type {PostCSSNode} */ node, /** @type {string} */ key) {
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
