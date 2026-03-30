import defaultParserInterface from '../utils/defaultParserInterface';
import pkg from 'php-parser/package.json';

/**
 * @typedef {typeof import('php-parser').Engine} PhpParserEngine
 * @typedef {import('php-parser').Node} PhpNode
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

  loadParser(/** @type {(realParser: PhpParserEngine) => void} */ callback) {
    require(['php-parser'], callback);
  },

  parse(/** @type {PhpParserEngine} */ Engine, /** @type {string} */ code) {
    const parser = new Engine(defaultOptions);
    return parser.parseCode(code, '');
  },

  getNodeName(/** @type {PhpNode} */ node) {
    return node.kind;
  },

  nodeToRange(/** @type {PhpNode} */ node) {
    if (node.loc && node.loc.start && node.loc.end) {
      return [node.loc.start.offset, node.loc.end.offset];
    }
  },

  opensByDefault(/** @type {PhpNode} */ node, /** @type {string} */ key) {
    return key === 'body' || key === 'what' || key === 'items';
  },
};
