import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'css-tree/package.json';

/**
 * @typedef {typeof import('css-tree')} CSSTreeModule
 *
 * @typedef {import('css-tree').CssNodePlain} CSSTreeNode
 */

const ID = 'csstree';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/csstree/csstree',
  locationProps: new Set(['loc']),

  loadParser(callback: (realParser: CSSTreeModule) => void) {
    require(['css-tree'], (m: CSSTreeModule) => callback(m));
  },

  parse(csstree: CSSTreeModule, code: string, options: import('css-tree').ParseOptions) {
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

  opensByDefault(node: CSSTreeNode, key: string) {
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
