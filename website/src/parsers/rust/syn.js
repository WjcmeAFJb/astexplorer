import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'astexplorer-syn/package.json';

/** @typedef {{lineOffsets: number[]}} LineOffsetsMixin */

const ID = 'syn';

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: `https://docs.rs/syn/${pkg.version}/syn/`,
  _ignoredProperties: new Set(['_type']),
  locationProps: new Set(['span']),

  loadParser(/** @type {*} */ callback) {
    require(['astexplorer-syn'], callback);
  },

  /** @this {LineOffsetsMixin} */
  parse(/** @type {*} */ parser, /** @type {*} */ code) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while ((index = code.indexOf('\n', index) + 1)); // eslint-disable-line no-cond-assign
    return parser.parseFile(code);
  },

  getNodeName(/** @type {*} */ node) {
    return node._type;
  },

  /** @this {LineOffsetsMixin} */
  nodeToRange(/** @type {*} */ node) {
    if (node.span) {
      return [node.span.start, node.span.end].map(
        ({ line, column }) => this.lineOffsets[line - 1] + column,
      );
    }
  },
};
