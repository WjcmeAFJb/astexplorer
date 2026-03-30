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

  loadParser(/** @type {(realParser: typeof import('astexplorer-syn')) => void} */ callback) {
    require(['astexplorer-syn'], callback);
  },

  /** @this {LineOffsetsMixin} */
  parse(/** @type {typeof import('astexplorer-syn')} */ parser, /** @type {string} */ code) {
    this.lineOffsets = [];
    let index = 0;
    do {
      this.lineOffsets.push(index);
    } while ((index = code.indexOf('\n', index) + 1)); // eslint-disable-line no-cond-assign
    // oxlint-disable-next-line typescript-eslint(no-unsafe-return) -- parseFile() is typed as returning any in its .d.ts
    return parser.parseFile(code);
  },

  getNodeName(/** @type {{_type?: string}} */ node) {
    return node._type;
  },

  /** @this {LineOffsetsMixin} */
  nodeToRange(/** @type {{span?: {start: {line: number, column: number}, end: {line: number, column: number}}, [key: string]: unknown}} */ node) {
    if (node.span) {
      return [node.span.start, node.span.end].map(
        ({ line, column }) => this.lineOffsets[line - 1] + column,
      );
    }
  },
};
