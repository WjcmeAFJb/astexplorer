import defaultParserInterface from './utils/defaultCSSParserInterface';
import pkg from 'css/package.json';

const ID = 'rework';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage || 'https://github.com/reworkcss/rework',
  locationProps: new Set(['position']),

  loadParser(/** @type {(realParser: DynModule) => void} */ callback) {
    require(['css/lib/parse'], callback);
  },

  /** @this {import('./utils/defaultCSSParserInterface').LineOffsetsMixin} */
  nodeToRange(/** @type {DynModule} */ { position: range }) {
    if (!range) return;
    return [range.start, range.end].map(pos => this.getOffset(pos));
  },

  opensByDefault(/** @type {ASTNode} */ node, /** @type {string} */ key) {
    return key === 'rules';
  },

  _ignoredProperties: new Set(['parsingErrors', 'source', 'content']),
};
