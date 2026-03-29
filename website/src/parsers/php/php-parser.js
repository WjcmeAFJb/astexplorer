import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'php-parser/package.json';

/**
 * @typedef {new (options: object) => { parseCode(code: string, filename: string): object }} PhpParserEngine
 * @typedef {{ kind?: string, loc?: { start?: { offset: number }, end?: { offset: number } }, [key: string]: unknown }} PhpNode
 */

const ID = 'php-parser';

const defaultOptions = {
  parser: {
    extractDoc: true,
  },
  ast: {
    withPositions: true,
  },
};

export default {
  ...defaultParserInterface,

  id: ID,
  displayName: ID,
  version: pkg.version,
  homepage: pkg.homepage,
  locationProps: new Set(['loc']),
  typeProps: new Set(['kind']),

  loadParser(/** @type {(realParser: Record<string, Function>) => void} */ callback) {
    require(['php-parser'], callback);
  },

  parse(/** @type {Record<string, Function>} */ Engine, /** @type {string} */ code) {
    const parser = new Engine(defaultOptions);
    return parser.parseCode(code, '');
  },

  getNodeName(/** @type {Record<string, unknown>} */ node) {
    return node.kind;
  },

  nodeToRange(/** @type {Record<string, unknown>} */ node) {
    if (node.loc && node.loc.start && node.loc.end) {
      return [node.loc.start.offset, node.loc.end.offset];
    }
  },

  opensByDefault(/** @type {Record<string, unknown>} */ node, /** @type {string} */ key) {
    return key === 'body' || key === 'what' || key === 'items';
  },
};
