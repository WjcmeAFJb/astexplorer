import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'pbkit/package.json';

/**
 * @typedef {{ parse(code: string): { ast: object } }} PbkitParser
 * @typedef {{ start: number, end: number, type?: string, statements?: object[], [key: string]: unknown }} PbkitNode
 */

const ID = 'pbkit';

export default {
  ...defaultParserInterface,
  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: 'https://github.com/riiid/pbkit',
  locationProps: new Set(['start', 'end']),
  typeProps: new Set(['type']),

  loadParser(/** @type {(realParser: Record<string, any>) => void} */ callback) {
    require(['pbkit/core/parser/proto'], callback);
  },

  parse(/** @type {Record<string, any>} */ parser, /** @type {string} */ code) {
    return parser.parse(code).ast;
  },

  nodeToRange(/** @type {any} */ node) {
    const { start, end } = node;
    return [start, end];
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    if (key === 'statements') {
      return true;
    }
  },
};
