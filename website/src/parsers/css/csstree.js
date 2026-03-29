import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'css-tree/package.json';

/**
 * @typedef {{
 *   parse: (code: string, options?: Record<string, unknown>) => object,
 *   toPlainObject: (ast: object) => CSSTreeNode,
 * }} CSSTreeModule
 *
 * @typedef {{
 *   type?: string,
 *   loc?: { start: { offset: number, line: number, column: number }, end: { offset: number, line: number, column: number } },
 *   children?: CSSTreeNode[],
 *   [key: string]: unknown,
 * }} CSSTreeNode
 */

const ID = 'csstree';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/csstree/csstree',
  locationProps: new Set(['loc']),

  loadParser(/** @type {(realParser: CSSTreeModule) => void} */ callback) {
    require(['css-tree'], (/** @type {CSSTreeModule} */ m) => callback(m));
  },

  parse(/** @type {CSSTreeModule} */ csstree, /** @type {string} */ code, /** @type {Record<string, unknown>} */ options) {
    return csstree.toPlainObject(csstree.parse(code, {
      positions: true,
      ...options,
    }));
  },

  nodeToRange(/** @type {CSSTreeNode} */ { loc }) {
    if (loc && loc.start && loc.end) {
      return [loc.start.offset, loc.end.offset];
    }
  },

  opensByDefault(/** @type {CSSTreeNode} */ node, /** @type {string} */ key) {
    return key === 'children';
  },

  getDefaultOptions() {
    return {
      context: 'stylesheet',
      parseValue: true,
      parseRulePrelude: true,
      parseAtrulePrelude: true,
      parseCustomProperty: false,
    };
  },

  _getSettingsConfiguration() {
    return {
      fields: [
        ['context', [
          'stylesheet',
          'atrule',
          'atrulePrelude',
          'mediaQueryList',
          'mediaQuery',
          'rule',
          'selectorList',
          'selector',
          'block',
          'declarationList',
          'declaration',
          'value',
        ]],
        'parseValue',
        'parseRulePrelude',
        'parseAtrulePrelude',
        'parseCustomProperty',
      ],
    };
  },
};
